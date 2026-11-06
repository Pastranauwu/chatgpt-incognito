# Brave ChatGPT Incognito Bridge

Puente de automatización y servidor API local compatible con OpenAI que interactúa directamente con ChatGPT en modo incógnito a través de Brave Browser. No requiere cuenta, no guarda historial y cuenta con gestión continua de tokens mediante auto-resumen y reinicio de sesión (*session handoff*).

## Características

- **Modo Incógnito Real**: Ejecuta el binario de Brave con bandera `--incognito` para sesiones sin persistencia de historial.
- **API Compatible con OpenAI**: Expone `/v1/chat/completions` (con soporte para streaming SSE) y `/v1/models`. Conectable a OpenCode, Claude Code, Cursor, Aider, etc.
- **Gestión Continua de Contexto**:
  - Cuenta tokens en tiempo real mediante `gpt-tokenizer`.
  - Cuando se alcanza el umbral de tokens configurado, genera automáticamente un resumen estructurado del historial.
  - Reinicia la sesión de incógnito e inyecta el resumen como memoria previa, manteniendo el hilo de la conversación sin saturar el contexto.
- **CLI Interactivo y Directo**: Estilo terminal sin emojis ni interfaces recargadas.

---

## Requisitos y Compatibilidad Multiplataforma

- **Node.js** >= 18
- **Sistemas Operativos**: Windows, Linux o macOS.
- **Navegador**: Busca automáticamente en el sistema con el siguiente orden de prioridad:
  1. **Brave Browser** (`brave.exe` / `brave-browser` / `brave`)
  2. **Google Chrome** (`chrome.exe` / `google-chrome-stable` / `google-chrome`)
  3. **Chromium** (`chrome.exe` / `chromium`)
- **Ruta personalizada (Opcional)**: Puedes forzar un ejecutable específico con la variable de entorno `BROWSER_PATH`:
  - En Linux/macOS: `export BROWSER_PATH="/ruta/a/navegador"`
  - En Windows (PowerShell): `$env:BROWSER_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"`
  - En Windows (CMD): `set BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe`

---

## Instalación

```bash
cd /home/eduardo/brave-chatgpt-incognito
npm install
```

---

## Uso CLI (Terminal)

### Pregunta rápida:
```bash
node index.js "¿Qué es la entropía en física?"
```

### Modo chat interactivo:
```bash
node index.js
```

Comandos disponibles dentro del chat:
- `stats`: Muestra la sesión actual, tokens acumulados y umbrales.
- `reset`: Fuerza un resumen inmediato y abre una nueva sesión de incógnito.
- `exit` o `salir`: Cierra la sesión y termina el proceso.

### Modo con ventana visible (Headed):
```bash
node index.js --headed
```

---

## Servidor API

### Iniciar el servidor:
```bash
npm run server
```

Por defecto escucha en `http://127.0.0.1:3000`.

### Variables de entorno opcionales:
```bash
PORT=3000 \
HOST=127.0.0.1 \
SUMMARY_THRESHOLD=4500 \
MAX_TOKENS=6000 \
node server.js
```

### Endpoints disponibles:

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/v1/chat/completions` | Protocolo OpenAI (compatible con `stream: true/false`). |
| `GET` | `/v1/models` | Lista de modelos disponibles. |
| `POST` | `/chat` | Endpoint simple (`{ "prompt": "..." }`). |
| `GET` | `/session` | Estado actual de tokens y resumen acumulado. |
| `GET` | `/health` | Chequeo de salud del servicio. |

---

## Conexión con Clientes AI

### OpenCode

En `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "providers": {
    "brave-chatgpt": {
      "type": "openai",
      "baseURL": "http://127.0.0.1:3000/v1",
      "apiKey": "local-dummy",
      "models": [
        {
          "id": "chatgpt-incognito",
          "name": "ChatGPT Incognito (Brave)",
          "contextWindow": 16000
        }
      ]
    }
  }
}
```

Ejecutar:
```bash
opencode --model brave-chatgpt/chatgpt-incognito
```

### Claude Code / cURL / Scripts OpenAI

```bash
curl -X POST http://127.0.0.1:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chatgpt-incognito",
    "messages": [
      { "role": "user", "content": "Escribe una función en Go para invertir una cadena." }
    ]
  }'
```

---

## Estructura del Proyecto

```text
brave-chatgpt-incognito/
├── client.js      # Controlador de automatización Brave/Playwright en incógnito
├── session.js     # Contador de tokens, disparador de auto-resumen y gestor de sesiones
├── server.js      # Servidor HTTP / API compatible con OpenAI
├── index.js       # CLI de consola (interactivo y directo)
├── package.json   # Dependencias y scripts
└── README.md      # Documentación
```
