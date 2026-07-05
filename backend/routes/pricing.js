const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  try {
    const { company_id, plan_name, price, features } = req.body;
    const result = await db.query(
      `INSERT INTO pricing_plans (company_id, plan_name, price, features)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [company_id, plan_name, price, features]
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
      result = await db.query('SELECT * FROM pricing_plans WHERE company_id=$1 ORDER BY price', [company_id]);
    } else {
      result = await db.query('SELECT * FROM pricing_plans ORDER BY id');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM pricing_plans WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pricing plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_name, price, features, is_active } = req.body;
    const result = await db.query(
      `UPDATE pricing_plans SET plan_name=$1, price=$2, features=$3, is_active=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *`,
      [plan_name, price, features, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pricing plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM pricing_plans WHERE id=$1', [id]);
    res.json({ message: 'Pricing plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
