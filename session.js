const { encode } = require('gpt-tokenizer');

class SessionManager {
  /**
   * @param {Object} options
   * @param {number} options.maxTokens Limite maximo de tokens acumulados antes de compactar (default: 6000)
   * @param {number} options.summaryThreshold Umbral para disparar el resumen (default: 4500)
   * @param {Object} options.client Instancia de BraveChatGPTClient
   */
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 6000;
    this.summaryThreshold = options.summaryThreshold || 4500;
    this.client = options.client;

    // Historial y estado
    this.history = []; // [{ role: 'user'|'assistant', content: string, tokens: number }]
    this.totalTokens = 0;
    this.currentSummary = ''; // Resumen acumulado de sesiones anteriores
    this.sessionCount = 1;
  }

  countTokens(text) {
    if (!text) return 0;
    try {
      return encode(text).length;
    } catch (e) {
      // Fallback aproximado
      return Math.ceil(text.length / 4);
    }
  }

  getStats() {
    return {
      sessionCount: this.sessionCount,
      totalTokens: this.totalTokens,
      maxTokens: this.maxTokens,
      summaryThreshold: this.summaryThreshold,
      hasSummary: Boolean(this.currentSummary),
      messageCount: this.history.length
    };
  }

  /**
   * Procesa el mensaje de entrada, verifica si se excede el umbral,
   * compacta mediante resumen en caso necesario reiniciando el navegador en incognito,
   * y envia el mensaje.
   */
  async chat(userPrompt, onChunk = null) {
    const promptTokens = this.countTokens(userPrompt);

    // Verificar si sobrepasa el umbral
    if (this.totalTokens + promptTokens >= this.summaryThreshold && this.history.length > 0) {
      console.log(`\n[TOKEN LIMIT] Tokens acumulados: ${this.totalTokens}. Supera umbral (${this.summaryThreshold}).`);
      console.log(`[HANDOFF] Generando resumen de la conversación y reiniciando sesión en incógnito...`);
      await this.compactAndReset();
    }

    // Si es una sesion nueva que proviene de un reinicio con resumen previo,
    // inyectamos el contexto de resumen antes o junto con el prompt.
    let effectivePrompt = userPrompt;
    if (this.currentSummary && this.history.length === 0) {
      effectivePrompt = `[CONTEXTO PREVIO CONVERSACION]:\n${this.currentSummary}\n\n[MENSAJE ACTUAL]:\n${userPrompt}`;
      console.log('[CONTEXT] Contexto previo inyectado en la nueva sesión.');
    }

    // Enviar a ChatGPT
    const assistantResponse = await this.client.sendMessage(effectivePrompt, onChunk);
    const responseTokens = this.countTokens(assistantResponse);

    // Registrar en historial
    this.history.push({ role: 'user', content: userPrompt, tokens: promptTokens });
    this.history.push({ role: 'assistant', content: assistantResponse, tokens: responseTokens });
    this.totalTokens += promptTokens + responseTokens;

    return assistantResponse;
  }

  /**
   * Pide a ChatGPT un resumen compacto de toda la conversacion actual,
   * reinicia la pestaña/contexto de Brave en incognito, y guarda el resumen para la siguiente llamada.
   */
  async compactAndReset() {
    const summaryPrompt = 
      'Resume de forma concisa, exhaustiva y estructurada todos los puntos clave, decisiones, datos tecnicos y acuerdos tratados en esta conversacion hasta ahora. Este resumen servira como memoria de contexto para la siguiente sesion.';

    try {
      const summaryText = await this.client.sendMessage(summaryPrompt);
      this.currentSummary = summaryText.trim();
      console.log('[SUMMARY OK] Resumen generado exitosamente (' + this.countTokens(this.currentSummary) + ' tokens).');
    } catch (err) {
      console.error('[SUMMARY ERROR] No se pudo generar resumen automatico:', err.message);
      // Fallback: usar los ultimos mensajes como resumen crudo
      this.currentSummary = this.history
        .slice(-4)
        .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`)
        .join('\n');
    }

    // Reiniciar sesión en incógnito
    console.log('[BROWSER] Reiniciando ventana de incógnito en Brave...');
    await this.client.resetSession();

    // Reset de contadores de la sesión
    this.sessionCount++;
    this.history = [];
    this.totalTokens = this.countTokens(this.currentSummary);
    console.log(`[NUEVA SESION #${this.sessionCount}] Iniciada con memoria limpia y resumen preservado (${this.totalTokens} tokens base).`);
  }
}

module.exports = SessionManager;
