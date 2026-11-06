const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { resolveBrowserExecutable } = require('./browser-resolver');

chromium.use(stealth);

class BraveChatGPTClient {
  constructor(options = {}) {
    this.customBrowserPath = options.browserPath || options.bravePath || null;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    const executablePath = resolveBrowserExecutable(this.customBrowserPath);
    if (!executablePath) {
      throw new Error(
        'No se encontro ningun navegador compatible (Brave o Google Chrome) en el sistema. Puedes especificar la ruta con la variable de entorno BROWSER_PATH.'
      );
    }
    console.log(`[BROWSER] Usando ejecutable: ${executablePath}`);

    this.browser = await chromium.launch({
      executablePath,
      headless: this.headless,
      args: [
        '--incognito',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });

    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    this.page = await this.context.newPage();

    // Navegar a ChatGPT
    await this.page.goto('https://chatgpt.com/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Esperar a que el textarea esté listo
    await this.page.waitForSelector('#mobile-composer-prompt', { timeout: 15000 });
    this.initialized = true;
  }

  /**
   * Envía un mensaje a ChatGPT y espera la respuesta completa.
   * @param {string} prompt Mensaje a enviar
   * @param {function} onChunk Callback opcional para streaming de texto
   * @returns {Promise<string>} Respuesta completa de ChatGPT
   */
  async sendMessage(prompt, onChunk = null) {
    if (!this.initialized) {
      await this.init();
    }

    const textareaSelector = '#mobile-composer-prompt';
    await this.page.waitForSelector(textareaSelector, { state: 'visible', timeout: 10000 });

    // Contar respuestas actuales antes de mandar el nuevo mensaje
    const currentResponsesCount = await this.page.$$eval(
      '[data-assistant-markdown-root]',
      els => els.length
    );

    // Escribir mensaje
    await this.page.fill(textareaSelector, prompt);
    await this.page.press(textareaSelector, 'Enter');

    // Esperar a que aparezca el nuevo nodo de respuesta
    const targetIndex = currentResponsesCount;
    const targetSelector = `[data-assistant-markdown-root]`;

    // Polling hasta que aparezca y termine de generarse
    const startTime = Date.now();
    const timeout = 60000; // 60 segundos máx
    let lastText = '';
    let settledCount = 0;

    while (Date.now() - startTime < timeout) {
      const responseNodes = await this.page.$$(targetSelector);
      if (responseNodes.length > targetIndex) {
        const latestNode = responseNodes[targetIndex];
        const currentText = await latestNode.innerText();

        // Verificar si hay indicador de stream activo (botón stop visible o atributo aria-busy)
        const isGenerating = await this.page.evaluate(() => {
          const stopBtn = document.querySelector('[data-composer-stop-icon]:not([hidden])');
          const submitBtn = document.querySelector('button[data-composer-submit]');
          const isBusy = submitBtn && (submitBtn.getAttribute('aria-disabled') === 'true' || submitBtn.disabled);
          const busyElem = document.querySelector('[aria-busy="true"]');
          return Boolean(stopBtn || busyElem);
        });

        if (currentText && currentText !== lastText) {
          if (onChunk) {
            onChunk(currentText);
          }
          lastText = currentText;
          settledCount = 0;
        } else if (currentText && currentText === lastText && !isGenerating) {
          settledCount++;
          if (settledCount >= 2) {
            return currentText.trim();
          }
        }
      }

      await this.page.waitForTimeout(500);
    }

    return lastText.trim();
  }

  async resetSession() {
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {}
    }
    if (!this.browser) {
      await this.init();
      return;
    }
    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });
    this.page = await this.context.newPage();
    await this.page.goto('https://chatgpt.com/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await this.page.waitForSelector('#mobile-composer-prompt', { timeout: 15000 });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.initialized = false;
    }
  }
}

module.exports = BraveChatGPTClient;
