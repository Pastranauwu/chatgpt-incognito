#!/usr/bin/env node

const readline = require('readline');
const BraveChatGPTClient = require('./client');

async function main() {
  const args = process.argv.slice(2);
  const isHeaded = args.includes('--headed');
  const promptArgIndex = args.findIndex(arg => !arg.startsWith('--'));
  const promptArg = promptArgIndex !== -1 ? args.slice(promptArgIndex).join(' ') : null;

  console.log(`[INFO] Conectando a ChatGPT via Brave incognito (${isHeaded ? 'headed' : 'headless'})...`);
  const client = new BraveChatGPTClient({
    headless: !isHeaded
  });

  try {
    await client.init();
    console.log('[OK] Conexion lista.\n');

    // Si se paso un prompt directamente por argumento CLI
    if (promptArg) {
      console.log(`[PROMPT] ${promptArg}`);
      const response = await client.sendMessage(promptArg);
      console.log('\n--- RESPUESTA ---');
      console.log(response);
      console.log('-----------------\n');
      await client.close();
      return;
    }

    // Modo interactivo en terminal
    console.log('Modo interactivo iniciado. Escribe tu mensaje y presiona Enter ("exit" para salir):');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n> '
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

      process.stdout.write('\nPensando...\r');
      try {
        const response = await client.sendMessage(input);
        console.log('\nChatGPT:');
        console.log(response);
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
