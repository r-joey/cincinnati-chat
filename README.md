# Cincinnati Hotel Chatbot

A hotel information chatbot system where guests chat with an AI assistant that answers questions based on an uploaded PDF document. Built with React, Node.js, and n8n automation workflows.

## Architecture

```
React (Vercel)  <-->  Node.js API (Railway)  <-->  n8n Cloud Webhooks  <-->  OpenAI
                              |                          |
                         PostgreSQL                 SMTP/Email
                      (Railway addon)            (idan@tauga.ai)
```

### Data Flow

1. **User sends message** → React calls Node.js API
2. **Backend processes** → Stores message in DB, forwards to n8n webhook with question + PDF content + chat history
3. **n8n orchestrates AI** → Sends context to OpenAI, classifies topic, detects unanswerable questions
4. **Response returned** → Backend stores response, updates stats, sends back to React
5. **Unanswered flow** → Contact form appears → submission triggers n8n email workflow → email sent to support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Automation | n8n Cloud (webhook workflows) |
| AI | OpenAI GPT (via n8n) |
| Hosting | Vercel (frontend), Railway (backend + DB) |

## How the Chatbot Processes PDF Information

1. **Admin uploads PDF** via the admin dashboard
2. **Backend extracts text** from the PDF using `pdf-parse`
3. **Text is stored** in the PostgreSQL `pdf_documents` table
4. **On each chat message**, the full PDF text is sent to n8n along with the user's question and conversation history
5. **n8n's OpenAI node** uses a system prompt that constrains the AI to answer **only** from the provided PDF content
6. **Topic classification** is performed by n8n (Rooms, Restaurant, Facilities, Pricing, etc.)
7. If the AI cannot find an answer, it returns an `isUnanswered` flag, triggering the contact form

## Admin Dashboard

- **PDF Upload**: Drag-and-drop area to upload the hotel's information PDF. New uploads replace the previous version.
- **Statistics Dashboard** (updates every 5 seconds):
  - Total chat sessions count
  - Total questions asked
  - Unanswered questions count
  - Bar chart showing questions broken down by topic/category

## n8n Workflows

### Workflow 1: Chat Response
- **Trigger**: Webhook (POST) — receives `{ question, chatHistory, pdfContent }`
- **Process**: OpenAI node with system prompt constraining answers to PDF content only
- **Classification**: Categorizes question into topic (Rooms, Restaurant, Facilities, etc.)
- **Output**: Returns `{ answer, topic, isUnanswered }`

### Workflow 2: Contact Email
- **Trigger**: Webhook (POST) — receives `{ name, phone, email, conversationSummary, unansweredQuestion }`
- **Process**: Sends formatted email via SMTP node
- **Recipient**: idan@tauga.ai

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL database
- n8n Cloud account (or self-hosted n8n)
- OpenAI API key

### 1. Clone the repository
```bash
git clone <repo-url>
cd cincinnati-chat
```

### 2. Backend setup
```bash
cd server
cp .env.example .env
# Edit .env with your database URL and n8n webhook URLs
npm install
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
npm run dev
```

### 4. n8n Workflow Setup

1. Go to [n8n Cloud](https://app.n8n.cloud) and create a new workflow
2. **Chat Workflow**:
   - Add a **Webhook** node (POST method) → copy the webhook URL
   - Connect to an **OpenAI** node with your API key
   - Set system prompt to constrain answers to the PDF content provided in the request body
   - Add a **Respond to Webhook** node returning `{ answer, topic, isUnanswered }`
   - Activate the workflow
3. **Email Workflow**:
   - Add a **Webhook** node (POST method) → copy the webhook URL
   - Connect to a **Send Email** node (configure SMTP)
   - Set recipient to `idan@tauga.ai`
   - Activate the workflow
4. Paste both webhook URLs into your server's `.env` file

### Environment Variables (Server)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | Frontend URL for CORS |
| `N8N_CHAT_WEBHOOK_URL` | n8n chat workflow webhook URL |
| `N8N_EMAIL_WEBHOOK_URL` | n8n email workflow webhook URL |

### Environment Variables (Client)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (default: http://localhost:3001) |

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `client`
3. Set `VITE_API_URL` env var to your Railway backend URL

### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `server`
3. Add PostgreSQL addon
4. Set all environment variables from the table above

## Extending the System

- **Add more n8n workflows** for additional automation (e.g., weekly usage reports)
- **Socket.io** can replace polling for truly real-time stats updates
- **Vector embeddings** could replace full-text PDF injection for better accuracy with large documents
- **Multi-language support** could be added via an n8n translation node
