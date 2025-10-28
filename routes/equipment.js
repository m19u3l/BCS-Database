import express from 'express';
import db from '../db.js';

const router = express.Router();

// =========================
// GET all equipment
// =========================
router.get('/', async (req, res) => {
  try {
    const equipment = await db.all('SELECT * FROM equipment');
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET equipment by ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// CREATE new equipment
// =========================
router.post('/', async (req, res) => {
  try {
    const { name, quantity, rental_rate, vendor, store_link } = req.body;
    if (!name) return res.status(400).json({ error: 'Equipment name is required' });

    const result = await db.run(
      'INSERT INTO equipment (name, quantity, rental_rate, vendor, store_link) VALUES (?, ?, ?, ?, ?)',
      [name, quantity || 0, rental_rate || 0, vendor || null, store_link || '']
    );

    const newItem = await db.get('SELECT * FROM equipment WHERE id = ?', result.lastID);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// UPDATE equipment
// =========================
router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, rental_rate, vendor, store_link } = req.body;
    const item = await db.get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    await db.run(
      'UPDATE equipment SET name = ?, quantity = ?, rental_rate = ?, vendor = ?, store_link = ? WHERE id = ?',
      [
        name || item.name,
        quantity ?? item.quantity,
        rental_rate ?? item.rental_rate,
        vendor ?? item.vendor,
        store_link ?? item.store_link,
        req.params.id
      ]
    );

    const updatedItem = await db.get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE equipment
// =========================
router.delete('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    await db.run('DELETE FROM equipment WHERE id = ?', req.params.id);
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
