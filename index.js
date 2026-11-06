#!/usr/bin/env node

const readline = require('readline');
const BraveChatGPTClient = require('./client');
const SessionManager = require('./session');

async function main() {
  const args = process.argv.slice(2);
  const isHeaded = args.includes('--headed');
  const promptArgIndex = args.findIndex(arg => !arg.startsWith('--'));
  const promptArg = promptArgIndex !== -1 ? args.slice(promptArgIndex).join(' ') : null;

  console.log(`[INFO] Conectando a ChatGPT via Brave incognito (${isHeaded ? 'headed' : 'headless'})...`);
  const client = new BraveChatGPTClient({
    headless: !isHeaded
  });

  const session = new SessionManager({
    client,
    maxTokens: parseInt(process.env.MAX_TOKENS || '6000', 10),
    summaryThreshold: parseInt(process.env.SUMMARY_THRESHOLD || '4500', 10)
  });

  try {
    await client.init();
    console.log('[OK] Conexion lista.\n');

    // Si se paso un prompt directamente por argumento CLI
    if (promptArg) {
      console.log(`[PROMPT] ${promptArg}`);
      const response = await session.chat(promptArg);
      console.log('\n--- RESPUESTA ---');
      console.log(response);
      console.log('-----------------\n');
      await client.close();
      return;
    }

    // Modo interactivo en terminal
    console.log('Modo interactivo con gestion de tokens y auto-resumen.');
    console.log(`(Umbral resumen: ${session.summaryThreshold} tokens | Max: ${session.maxTokens} tokens)`);
    console.log('Comandos: "stats" para ver tokens, "reset" para reiniciar hilo, "exit" para salir.\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    rl.prompt();

    rl.on('line', async line => {
      const input = line.trim();
      if (!input) {
        rl.prompt();
        return;
      }
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'salir') {
        rl.close();
        return;
      }
      if (input.toLowerCase() === 'stats') {
        const stats = session.getStats();
        console.log(`[STATS] Sesion: #${stats.sessionCount} | Tokens acumulados: ${stats.totalTokens}/${stats.maxTokens} (Umbral: ${stats.summaryThreshold}) | Mensajes: ${stats.messageCount}`);
        rl.prompt();
        return;
      }
      if (input.toLowerCase() === 'reset') {
        console.log('[INFO] Forzando compactacion y nueva sesion limpia...');
        await session.compactAndReset();
        rl.prompt();
        return;
      }

      process.stdout.write('\nPensando...\r');
      try {
        const response = await session.chat(input);
        console.log('\nChatGPT:');
        console.log(response);
        console.log(`\n[Tokens acumulados: ${session.totalTokens}/${session.maxTokens}]\n`);
      } catch (err) {
        console.error('\n[ERROR] Al procesar mensaje:', err.message);
      }
      rl.prompt();
    });

    rl.on('close', async () => {
      console.log('\n[INFO] Cerrando sesion incognito de Brave...');
      await client.close();
      console.log('[OK] Sesion cerrada.');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error fatal:', error);
    await client.close();
    process.exit(1);
  }
}

main();
