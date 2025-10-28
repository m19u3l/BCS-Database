import express from 'express';
import db from '../db.js';

const router = express.Router();

// =========================
// GET all materials
// =========================
router.get('/', async (req, res) => {
  try {
    const materials = await db.all('SELECT * FROM materials');
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET material by ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const material = await db.get('SELECT * FROM materials WHERE id = ?', req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// CREATE a new material
// =========================
router.post('/', async (req, res) => {
  try {
    const { name, quantity, unit_cost, vendor, store_link } = req.body;
    if (!name) return res.status(400).json({ error: 'Material name is required' });

    const result = await db.run(
      'INSERT INTO materials (name, quantity, unit_cost, vendor, store_link) VALUES (?, ?, ?, ?, ?)',
      [name, quantity || 0, unit_cost || 0, vendor || null, store_link || '']
    );

    const newMaterial = await db.get('SELECT * FROM materials WHERE id = ?', result.lastID);
    res.status(201).json(newMaterial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// UPDATE a material
// =========================
router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, unit_cost, vendor, store_link } = req.body;
    const material = await db.get('SELECT * FROM materials WHERE id = ?', req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    await db.run(
      'UPDATE materials SET name = ?, quantity = ?, unit_cost = ?, vendor = ?, store_link = ? WHERE id = ?',
      [
        name || material.name,
        quantity ?? material.quantity,
        unit_cost ?? material.unit_cost,
        vendor ?? material.vendor,
        store_link ?? material.store_link,
        req.params.id
      ]
    );

    const updatedMaterial = await db.get('SELECT * FROM materials WHERE id = ?', req.params.id);
    res.json(updatedMaterial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE a material
// =========================
router.delete('/:id', async (req, res) => {
  try {
    const material = await db.get('SELECT * FROM materials WHERE id = ?', req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    await db.run('DELETE FROM materials WHERE id = ?', req.params.id);
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
