const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  try {
    const { company_id, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO services (company_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [company_id, name, description]
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
      result = await db.query('SELECT * FROM services WHERE company_id=$1 ORDER BY id', [company_id]);
    } else {
      result = await db.query('SELECT * FROM services ORDER BY id');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM services WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const result = await db.query(
      `UPDATE services SET name=$1, description=$2, is_active=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *`,
      [name, description, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM services WHERE id=$1', [id]);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
