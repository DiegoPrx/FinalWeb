import config from '../config/index.js';

/**
 * Envía un mensaje de error 5XX a un canal de Slack mediante Incoming Webhook.
 * @param {object} errorData - Datos del error a reportar
 * @param {string} errorData.method - Método HTTP
 * @param {string} errorData.path - Ruta de la petición
 * @param {string} errorData.message - Mensaje del error
 * @param {string} errorData.stack - Stack trace del error
 * @param {number} errorData.statusCode - Código de estado HTTP
 */
export const logErrorToSlack = async ({ method, path, message, stack, statusCode }) => {
  const webhookUrl = config.slackWebhookUrl;

  if (!webhookUrl) {
    console.warn('⚠️ SLACK_WEBHOOK_URL no configurada, omitiendo log a Slack');
    return;
  }

  const payload = {
    text: '🚨 *Error 5XX en BildyApp*',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Error del servidor detectado',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${new Date().toISOString()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${statusCode}`,
          },
          {
            type: 'mrkdwn',
            text: `*Método:*\n${method}`,
          },
          {
            type: 'mrkdwn',
            text: `*Ruta:*\n${path}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Mensaje:*\n\`\`\`${message}\`\`\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stack Trace:*\n\`\`\`${stack ? stack.substring(0, 500) : 'No disponible'}\`\`\``,
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Error enviando log a Slack:', response.statusText);
    }
  } catch (error) {
    console.error('Error enviando log a Slack:', error.message);
  }
};
