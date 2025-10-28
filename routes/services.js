import express from 'express';
import db from '../db.js';

const router = express.Router();

// =========================
// GET all services
// =========================
router.get('/', async (req, res) => {
  try {
    const services = await db.all('SELECT * FROM services');
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET service by ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const service = await db.get('SELECT * FROM services WHERE id = ?', req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// CREATE new service
// =========================
router.post('/', async (req, res) => {
  try {
    const { category, description, base_price } = req.body;
    if (!category || !description) return res.status(400).json({ error: 'Category and description are required' });

    const result = await db.run(
      'INSERT INTO services (category, description, base_price) VALUES (?, ?, ?)',
      [category, description, base_price || 0]
    );

    const newService = await db.get('SELECT * FROM services WHERE id = ?', result.lastID);
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// UPDATE service
// =========================
router.put('/:id', async (req, res) => {
  try {
    const { category, description, base_price } = req.body;
    const service = await db.get('SELECT * FROM services WHERE id = ?', req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    await db.run(
      'UPDATE services SET category = ?, description = ?, base_price = ? WHERE id = ?',
      [
        category || service.category,
        description ?? service.description,
        base_price ?? service.base_price,
        req.params.id
      ]
    );

    const updatedService = await db.get('SELECT * FROM services WHERE id = ?', req.params.id);
    res.json(updatedService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE service
// =========================
router.delete('/:id', async (req, res) => {
  try {
    const service = await db.get('SELECT * FROM services WHERE id = ?', req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    await db.run('DELETE FROM services WHERE id = ?', req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
