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

  const text = await response.text();
  console.log('n8n raw response:', text);

  if (!text) {
    throw new Error('n8n returned empty response — check Respond to Webhook node');
  }

  try {
    const data = JSON.parse(text);
    // n8n may wrap response in an array
    if (Array.isArray(data)) {
      return data[0] || {};
    }
    return data;
  } catch (e) {
    console.error('Failed to parse n8n response:', text);
    throw new Error('n8n returned invalid JSON');
  }
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
