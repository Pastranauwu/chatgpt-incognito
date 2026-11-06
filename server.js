const http = require('http');
const BraveChatGPTClient = require('./client');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Cliente persistente compartido para la API
let clientInstance = null;
let clientLock = Promise.resolve();

async function getClient() {
  if (!clientInstance || !clientInstance.initialized) {
    clientInstance = new BraveChatGPTClient({ headless: true });
    await clientInstance.init();
  }
  return clientInstance;
}

// Helper para parsear JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
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
  // Manejo de CORS preflight
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

  // Health check
  if (url.pathname === '/health' || url.pathname === '/') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'brave-chatgpt-api',
      endpoints: ['/v1/chat/completions', '/v1/models', '/chat', '/health']
    });
    return;
  }

  // Modelos disponibles (compatibilidad OpenAI)
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

  // Endpoint simple: POST /chat { prompt: "hola" }
  if (url.pathname === '/chat' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const prompt = body.prompt || body.message;

      if (!prompt) {
        sendJson(res, 400, { error: 'Falta campo prompt o message en el body' });
        return;
      }

      // Encolar peticiones concurrentes para no colapsar la sesion del navegador
      const responseText = await runSerialized(async () => {
        const client = await getClient();
        return await client.sendMessage(prompt);
      });

      sendJson(res, 200, {
        prompt,
        response: responseText
      });
    } catch (err) {
      console.error('[ERROR /chat]:', err.message);
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Endpoint OpenAI compatible: POST /v1/chat/completions
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

      // Construir prompt a partir del historial o tomar el ultimo mensaje del usuario
      // Para optimizar en modo incognito sin autenticacion, formateamos la conversacion si hay varios
      let finalPrompt = '';
      if (messages.length === 1) {
        finalPrompt = messages[0].content;
      } else {
        finalPrompt = messages
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n') + '\n\nASSISTANT:';
      }

      const stream = Boolean(body.stream);

      if (stream) {
        // Soporte Server-Sent Events (SSE) compatible con OpenAI
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        await runSerialized(async () => {
          const client = await getClient();
          let sentLength = 0;

          await client.sendMessage(finalPrompt, (currentFullText) => {
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

          // Finalizar stream
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

      // Modo non-stream
      const responseText = await runSerialized(async () => {
        const client = await getClient();
        return await client.sendMessage(finalPrompt);
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
          prompt_tokens: finalPrompt.length,
          completion_tokens: responseText.length,
          total_tokens: finalPrompt.length + responseText.length
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
  const result = clientLock.then(task);
  clientLock = result.catch(() => {});
  return result;
}

// Limpieza al cerrar proceso
process.on('SIGINT', async () => {
  console.log('\n[INFO] Deteniendo servidor y cerrando instancia de Brave...');
  if (clientInstance) {
    await clientInstance.close();
  }
  process.exit(0);
});

server.listen(PORT, HOST, () => {
  console.log(`[API LISTA] Servidor escuchando en http://${HOST}:${PORT}`);
  console.log(`- OpenAI Endpoint: http://${HOST}:${PORT}/v1/chat/completions`);
  console.log(`- Simple Endpoint: http://${HOST}:${PORT}/chat`);
});
