const express = require('express');
const router = express.Router();
const db = require('../db');

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

module.exports = router;
