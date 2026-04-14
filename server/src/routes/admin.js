const express = require('express');
const multer = require('multer');
const { pool } = require('../services/db');
const { extractTextFromPdf } = require('../services/pdf');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload PDF (replaces previous)
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const text = await extractTextFromPdf(req.file.buffer);

    // Delete old PDFs and insert new one
    await pool.query('DELETE FROM pdf_documents');
    const result = await pool.query(
      'INSERT INTO pdf_documents (filename, content_text) VALUES ($1, $2) RETURNING id, filename, uploaded_at',
      [req.file.originalname, text]
    );

    res.json({
      message: 'PDF uploaded successfully',
      document: result.rows[0],
      textLength: text.length,
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Get current PDF info
router.get('/pdf-info', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, filename, uploaded_at FROM pdf_documents ORDER BY uploaded_at DESC LIMIT 1'
    );
    res.json({ document: result.rows[0] || null });
  } catch (error) {
    console.error('PDF info error:', error);
    res.status(500).json({ error: 'Failed to get PDF info' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    // Total chat sessions
    const sessionsResult = await pool.query('SELECT COUNT(*) as total FROM chat_sessions');

    // Questions per topic
    const topicsResult = await pool.query(`
      SELECT
        COALESCE(topic, 'Uncategorized') as topic,
        COUNT(*) as count
      FROM chat_messages
      WHERE role = 'user'
      GROUP BY topic
      ORDER BY count DESC
    `);

    // Total messages
    const messagesResult = await pool.query(
      "SELECT COUNT(*) as total FROM chat_messages WHERE role = 'user'"
    );

    // Unanswered questions count
    const unansweredResult = await pool.query(
      'SELECT COUNT(*) as total FROM chat_messages WHERE is_unanswered = true'
    );

    res.json({
      totalSessions: parseInt(sessionsResult.rows[0].total),
      totalMessages: parseInt(messagesResult.rows[0].total),
      totalUnanswered: parseInt(unansweredResult.rows[0].total),
      topicBreakdown: topicsResult.rows.map(r => ({
        topic: r.topic,
        count: parseInt(r.count),
      })),
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
