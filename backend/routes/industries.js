const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  try {
    const { company_id, industry_name } = req.body;
    const result = await db.query(
      `INSERT INTO target_industries (company_id, industry_name) VALUES ($1, $2) RETURNING *`,
      [company_id, industry_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.query;
    let result;
    if (company_id) {
      result = await db.query('SELECT * FROM target_industries WHERE company_id=$1 ORDER BY id', [company_id]);
    } else {
      result = await db.query('SELECT * FROM target_industries ORDER BY id');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM target_industries WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Industry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { industry_name, is_active } = req.body;
    const result = await db.query(
      `UPDATE target_industries SET industry_name=$1, is_active=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *`,
      [industry_name, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Industry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM target_industries WHERE id=$1', [id]);
    res.json({ message: 'Industry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
