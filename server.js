const http = require('http');
const BraveChatGPTClient = require('./client');
const SessionManager = require('./session');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '6000', 10);
const SUMMARY_THRESHOLD = parseInt(process.env.SUMMARY_THRESHOLD || '4500', 10);

// Instancia compartida de sesión y cliente
let clientInstance = null;
let sessionManager = null;
let queueLock = Promise.resolve();

async function getSessionManager() {
  if (!clientInstance || !clientInstance.initialized) {
    clientInstance = new BraveChatGPTClient({ headless: true });
    await clientInstance.init();
    sessionManager = new SessionManager({
      client: clientInstance,
      maxTokens: MAX_TOKENS,
      summaryThreshold: SUMMARY_THRESHOLD
    });
  }
  return sessionManager;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check & session stats
  if (url.pathname === '/health' || url.pathname === '/') {
    const session = sessionManager ? sessionManager.getStats() : null;
    sendJson(res, 200, {
      status: 'ok',
      service: 'brave-chatgpt-api',
      session,
      endpoints: ['/v1/chat/completions', '/v1/models', '/chat', '/session', '/health']
    });
    return;
  }

  // Info detallada de la sesión actual
  if (url.pathname === '/session' && req.method === 'GET') {
    const manager = await getSessionManager();
    sendJson(res, 200, manager.getStats());
    return;
  }

  // Modelos disponibles
  if (url.pathname === '/v1/models' && req.method === 'GET') {
    sendJson(res, 200, {
      object: 'list',
      data: [
        {
          id: 'chatgpt-incognito',
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'brave-bridge'
        }
      ]
    });
    return;
  }

  // POST /chat
  if (url.pathname === '/chat' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prompt = body.prompt || body.message;

      if (!prompt) {
        sendJson(res, 400, { error: 'Falta campo prompt o message en el body' });
        return;
      }

      const responseText = await runSerialized(async () => {
        const manager = await getSessionManager();
        return await manager.chat(prompt);
      });

      sendJson(res, 200, {
        prompt,
        response: responseText,
        session: sessionManager.getStats()
      });
    } catch (err) {
      console.error('[ERROR /chat]:', err.message);
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // POST /v1/chat/completions (OpenAI compatible)
  if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const messages = body.messages || [];

      if (!Array.isArray(messages) || messages.length === 0) {
        sendJson(res, 400, {
          error: {
            message: 'Campo messages debe ser un array no vacio',
            type: 'invalid_request_error'
          }
        });
        return;
      }

      // Si nos mandan un solo mensaje tomamos ese, si nos mandan una conversación completa de OpenCode/Claude,
      // tomamos el último mensaje del usuario para dejar que nuestro SessionManager gestione la persistencia del hilo
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const finalPrompt = lastUserMsg ? lastUserMsg.content : messages[messages.length - 1].content;

      const stream = Boolean(body.stream);

      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        await runSerialized(async () => {
          const manager = await getSessionManager();
          let sentLength = 0;

          await manager.chat(finalPrompt, (currentFullText) => {
            const newChunk = currentFullText.slice(sentLength);
            if (newChunk) {
              sentLength = currentFullText.length;
              const ssePayload = {
                id: 'chatcmpl-' + Date.now(),
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: body.model || 'chatgpt-incognito',
                choices: [
                  {
                    index: 0,
                    delta: { content: newChunk },
                    finish_reason: null
                  }
                ]
              };
              res.write(`data: ${JSON.stringify(ssePayload)}\n\n`);
            }
          });

          const finalPayload = {
            id: 'chatcmpl-' + Date.now(),
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: body.model || 'chatgpt-incognito',
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
          };
          res.write(`data: ${JSON.stringify(finalPayload)}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        });
        return;
      }

      // Non-stream
      const responseText = await runSerialized(async () => {
        const manager = await getSessionManager();
        return await manager.chat(finalPrompt);
      });

      const responseId = 'chatcmpl-' + Date.now();
      const openAiResponse = {
        id: responseId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: body.model || 'chatgpt-incognito',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: responseText
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: sessionManager.countTokens(finalPrompt),
          completion_tokens: sessionManager.countTokens(responseText),
          total_tokens: sessionManager.totalTokens
        }
      };

      sendJson(res, 200, openAiResponse);
    } catch (err) {
      console.error('[ERROR /v1/chat/completions]:', err.message);
      sendJson(res, 500, {
        error: {
          message: err.message,
          type: 'internal_server_error'
        }
      });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

function runSerialized(task) {
  const result = queueLock.then(task);
  queueLock = result.catch(() => {});
  return result;
}

process.on('SIGINT', async () => {
  console.log('\n[INFO] Deteniendo servidor y cerrando instancia de Brave...');
  if (clientInstance) {
    await clientInstance.close();
  }
  process.exit(0);
});

server.listen(PORT, HOST, () => {
  console.log(`[API LISTA] Servidor escuchando en http://${HOST}:${PORT}`);
  console.log(`- Umbral resumen: ${SUMMARY_THRESHOLD} tokens | Max tokens: ${MAX_TOKENS} tokens`);
  console.log(`- OpenAI Endpoint: http://${HOST}:${PORT}/v1/chat/completions`);
  console.log(`- Simple Endpoint: http://${HOST}:${PORT}/chat`);
});
