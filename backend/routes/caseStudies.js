const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  try {
    const { company_id, title, client_name, challenge, solution, results } = req.body;
    const result = await db.query(
      `INSERT INTO case_studies (company_id, title, client_name, challenge, solution, results)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [company_id, title, client_name, challenge, solution, results]
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
      result = await db.query('SELECT * FROM case_studies WHERE company_id=$1 ORDER BY id', [company_id]);
    } else {
      result = await db.query('SELECT * FROM case_studies ORDER BY id');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM case_studies WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Case study not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, client_name, challenge, solution, results, is_active } = req.body;
    const result = await db.query(
      `UPDATE case_studies SET title=$1, client_name=$2, challenge=$3, solution=$4, results=$5, is_active=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *`,
      [title, client_name, challenge, solution, results, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Case study not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM case_studies WHERE id=$1', [id]);
    res.json({ message: 'Case study deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
