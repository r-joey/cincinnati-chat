const express = require('express');
const { pool } = require('../services/db');
const { getAIResponse, sendContactEmail } = require('../services/n8n');

const router = express.Router();

// Create new chat session
router.post('/sessions', async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO chat_sessions DEFAULT VALUES RETURNING id, created_at'
    );
    res.json({ session: result.rows[0] });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Send message and get AI response
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Get PDF content
    const pdfResult = await pool.query(
      'SELECT content_text FROM pdf_documents ORDER BY uploaded_at DESC LIMIT 1'
    );

    if (pdfResult.rows.length === 0) {
      return res.status(400).json({
        error: 'No hotel information PDF has been uploaded yet. Please ask an admin to upload one.',
      });
    }

    const pdfContent = pdfResult.rows[0].content_text;

    // Get chat history for this session
    const historyResult = await pool.query(
      'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    const chatHistory = historyResult.rows;

    // Call n8n webhook for AI response
    const aiResult = await getAIResponse(message, chatHistory, pdfContent);

    const answer = aiResult.answer || aiResult.output || 'Sorry, something went wrong.';
    const topic = aiResult.topic || 'General';
    const isUnanswered = aiResult.isUnanswered || false;

    // Store user message
    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content, topic, is_unanswered) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, 'user', message, topic, false]
    );

    // Store AI response
    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content, topic, is_unanswered) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, 'assistant', answer, topic, isUnanswered]
    );

    res.json({ answer, topic, isUnanswered });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Submit contact form
router.post('/contact', async (req, res) => {
  try {
    const { sessionId, name, phone, email, unansweredQuestion } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Get conversation summary
    let conversationSummary = '';
    if (sessionId) {
      const historyResult = await pool.query(
        'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      );
      conversationSummary = historyResult.rows
        .map(m => `${m.role === 'user' ? 'Guest' : 'Hotel Bot'}: ${m.content}`)
        .join('\n');
    }

    // Store contact submission
    await pool.query(
      'INSERT INTO contact_submissions (session_id, name, phone, email, unanswered_question, conversation_summary) VALUES ($1, $2, $3, $4, $5, $6)',
      [sessionId, name, phone, email, unansweredQuestion, conversationSummary]
    );

    // Send email via n8n
    await sendContactEmail({
      name,
      phone,
      email,
      conversationSummary,
      unansweredQuestion,
    });

    res.json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

module.exports = router;
