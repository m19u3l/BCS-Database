import express from 'express';
import db from '../db.js';

const router = express.Router();

// =========================
// GET all line items
// =========================
router.get('/', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT li.id, li.invoice AS invoice_id, li.service AS service_id, li.quantity, li.total,
             s.description AS service_description
      FROM line_items li
      LEFT JOIN services s ON li.service = s.id
    `);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET line item by ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get(`
      SELECT li.id, li.invoice AS invoice_id, li.service AS service_id, li.quantity, li.total,
             s.description AS service_description
      FROM line_items li
      LEFT JOIN services s ON li.service = s.id
      WHERE li.id = ?
    `, req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET line items by invoice
// =========================
router.get('/invoice/:id', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT li.id, li.invoice AS invoice_id, li.service AS service_id, li.quantity, li.total,
             s.description AS service_description
      FROM line_items li
      LEFT JOIN services s ON li.service = s.id
      WHERE li.invoice = ?
    `, req.params.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// CREATE a new line item
// =========================
router.post('/', async (req, res) => {
  try {
    const { invoice, service, quantity, total } = req.body;

    if (!invoice || !service) {
      return res.status(400).json({ error: 'Invoice ID and Service ID are required' });
    }

    const result = await db.run(`
      INSERT INTO line_items (invoice, service, quantity, total)
      VALUES (?, ?, ?, ?)
    `, [invoice, service, quantity || 1, total || 0]);

    const newItem = await db.get('SELECT * FROM line_items WHERE id = ?', result.lastID);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// UPDATE a line item
// =========================
router.put('/:id', async (req, res) => {
  try {
    const { invoice, service, quantity, total } = req.body;

    const item = await db.get('SELECT * FROM line_items WHERE id = ?', req.params.id);
    if (!item) return res.status(404).json({ error: 'Line item not found' });

    await db.run(`
      UPDATE line_items
      SET invoice = ?, service = ?, quantity = ?, total = ?
      WHERE id = ?
    `, [
      invoice || item.invoice,
      service || item.service,
      quantity ?? item.quantity,
      total ?? item.total,
      req.params.id
    ]);

    const updatedItem = await db.get('SELECT * FROM line_items WHERE id = ?', req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE a line item
// =========================
router.delete('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM line_items WHERE id = ?', req.params.id);
    if (!item) return res.status(404).json({ error: 'Line item not found' });

    await db.run('DELETE FROM line_items WHERE id = ?', req.params.id);
    res.json({ message: 'Line item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
