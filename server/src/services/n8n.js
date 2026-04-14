const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL;
const N8N_EMAIL_WEBHOOK = process.env.N8N_EMAIL_WEBHOOK_URL;

async function getAIResponse(question, chatHistory, pdfContent) {
  if (!N8N_CHAT_WEBHOOK) {
    throw new Error('N8N_CHAT_WEBHOOK_URL is not configured');
  }

  const response = await fetch(N8N_CHAT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, chatHistory, pdfContent }),
  });

  if (!response.ok) {
    throw new Error(`n8n webhook error: ${response.status}`);
  }

  return response.json();
}

async function sendContactEmail({ name, phone, email, conversationSummary, unansweredQuestion }) {
  if (!N8N_EMAIL_WEBHOOK) {
    throw new Error('N8N_EMAIL_WEBHOOK_URL is not configured');
  }

  const response = await fetch(N8N_EMAIL_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, conversationSummary, unansweredQuestion }),
  });

  if (!response.ok) {
    throw new Error(`n8n email webhook error: ${response.status}`);
  }

  return response.json();
}

module.exports = { getAIResponse, sendContactEmail };
