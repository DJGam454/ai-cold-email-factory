const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

router.get('/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { cta, hook, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT * FROM generated_emails WHERE batch_id=$1';
    let countQuery = 'SELECT COUNT(*) FROM generated_emails WHERE batch_id=$1';
    const params = [batchId];
    const conditions = [];

    if (cta) {
      params.push(cta);
      conditions.push(` AND cta_type=$${params.length}`);
    }
    if (hook) {
      params.push(`%${hook}%`);
      conditions.push(` AND opening_hook ILIKE $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(` AND (subject_line ILIKE $${params.length} OR email_body ILIKE $${params.length} OR recipient_name ILIKE $${params.length} OR recipient_company ILIKE $${params.length})`);
    }

    const whereClause = conditions.join('');
    query += whereClause + ' ORDER BY id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    countQuery += whereClause;

    params.push(parseInt(limit), offset);

    const [dataResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      emails: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM generated_emails WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_sent } = req.body;
    const result = await db.query(
      'UPDATE generated_emails SET is_sent=$1 WHERE id=$2 RETURNING *',
      [is_sent, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM generated_emails WHERE id=$1', [id]);
    res.json({ message: 'Email deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:batchId/csv', async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await db.query(
      'SELECT recipient_name, recipient_title, recipient_company, subject_line, opening_hook, cta_type, cta_text, email_body FROM generated_emails WHERE batch_id=$1 ORDER BY id',
      [batchId]
    );

    const headers = ['Recipient Name', 'Title', 'Company', 'Subject Line', 'Opening Hook', 'CTA Type', 'CTA Text', 'Email Body'];
    const escapeCsv = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    let csv = headers.join(',') + '\n';
    for (const row of result.rows) {
      csv += [row.recipient_name, row.recipient_title, row.recipient_company, row.subject_line, row.opening_hook, row.cta_type, row.cta_text, row.email_body].map(escapeCsv).join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=emails_batch_${batchId}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

router.post('/send/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM generated_emails WHERE id=$1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    const email = result.rows[0];

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(400).json({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env' });
    }

    const emailTo = process.env.EMAIL_TO || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"AI Cold Email Factory" <${process.env.SMTP_USER}>`,
      to: emailTo,
      subject: `[Test] ${email.subject_line}`,
      text: `To: ${email.recipient_name} — ${email.recipient_title} at ${email.recipient_company}\n\nSubject: ${email.subject_line}\n\n${email.email_body}\n\n---\nCTA: ${email.cta_text}\n`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #6c757d;">
          <strong>Test Send</strong> — originally for ${email.recipient_name} (${email.recipient_title}) at ${email.recipient_company}
        </div>
        <h2 style="color: #1a1a2e;">${email.subject_line}</h2>
        ${email.opening_hook ? `<p style="color: #6c757d; font-style: italic;">${email.opening_hook}</p>` : ''}
        <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${email.email_body}</div>
        <div style="margin-top: 16px; padding: 12px; background: #e94560; color: white; border-radius: 8px; text-align: center; font-weight: 600;">
          ${email.cta_text}
        </div>
      </div>`,
    });

    await db.query('UPDATE generated_emails SET is_sent=true WHERE id=$1', [id]);

    console.log('[EMAILS] Sent email #' + id + ' to ' + emailTo + ' — messageId: ' + info.messageId);
    res.json({ success: true, messageId: info.messageId, to: emailTo });
  } catch (err) {
    console.error('[EMAILS] Send error for email #' + req.params.id + ':', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(400).json({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env' });
    }

    const emailTo = process.env.EMAIL_TO || process.env.SMTP_USER;
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const result = await db.query('SELECT * FROM generated_emails WHERE id=$1', [id]);
        if (result.rows.length === 0) {
          return { id, status: 'failed', error: 'Email not found' };
        }
        const email = result.rows[0];
        const info = await transporter.sendMail({
          from: `"AI Cold Email Factory" <${process.env.SMTP_USER}>`,
          to: emailTo,
          subject: `[Test] ${email.subject_line}`,
          text: `To: ${email.recipient_name} — ${email.recipient_title} at ${email.recipient_company}\n\nSubject: ${email.subject_line}\n\n${email.email_body}\n\n---\nCTA: ${email.cta_text}\n`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #6c757d;">
              <strong>Test Send</strong> — originally for ${email.recipient_name} (${email.recipient_title}) at ${email.recipient_company}
            </div>
            <h2 style="color: #1a1a2e;">${email.subject_line}</h2>
            ${email.opening_hook ? `<p style="color: #6c757d; font-style: italic;">${email.opening_hook}</p>` : ''}
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${email.email_body}</div>
            <div style="margin-top: 16px; padding: 12px; background: #e94560; color: white; border-radius: 8px; text-align: center; font-weight: 600;">
              ${email.cta_text}
            </div>
          </div>`,
        });
        await db.query('UPDATE generated_emails SET is_sent=true WHERE id=$1', [id]);
        return { id, status: 'sent', messageId: info.messageId };
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').map(r => r.value.id);
    const failed = results.filter(r => r.status === 'rejected' || r.value.status === 'failed').map(r => ({
      id: r.value?.id || 'unknown',
      error: r.reason?.message || r.value?.error || 'Failed to send',
    }));

    console.log('[EMAILS] Batch send: ' + sent.length + ' sent, ' + failed.length + ' failed');
    res.json({ sent, failed, total: ids.length });
  } catch (err) {
    console.error('[EMAILS] Batch send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
