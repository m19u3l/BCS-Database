import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all work orders
router.get('/', async (req, res) => {
  try {
    const orders = await db.all(`
      SELECT wo.id, wo.client AS client_id, wo.date_created, wo.status,
             c.name AS client_name
      FROM work_orders wo
      LEFT JOIN clients c ON wo.client = c.id
      ORDER BY wo.date_created DESC
    `);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single work order with line items
router.get('/:id', async (req, res) => {
  try {
    const order = await db.get(`
      SELECT wo.id, wo.client AS client_id, wo.date_created, wo.status,
             c.name AS client_name
      FROM work_orders wo
      LEFT JOIN clients c ON wo.client = c.id
      WHERE wo.id = ?
    `, req.params.id);

    if (!order) return res.status(404).json({ error: 'Work order not found' });

    const line_items = await db.all(`
      SELECT li.id, li.work_order AS work_order_id, li.service AS service_id, li.quantity, li.total,
             s.description AS service_description
      FROM line_items li
      LEFT JOIN services s ON li.service = s.id
      WHERE li.work_order = ?
    `, req.params.id);

    res.json({ order, line_items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE work order
router.post('/', async (req, res) => {
  try {
    const { client, status } = req.body;
    if (!client) return res.status(400).json({ error: 'Client ID is required' });

    const result = await db.run(`
      INSERT INTO work_orders (client, status)
      VALUES (?, ?)
    `, [client, status || 'Pending']);

    const newOrder = await db.get('SELECT * FROM work_orders WHERE id = ?', result.lastID);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE work order
router.put('/:id', async (req, res) => {
  try {
    const { client, status } = req.body;
    const order = await db.get('SELECT * FROM work_orders WHERE id = ?', req.params.id);
    if (!order) return res.status(404).json({ error: 'Work order not found' });

    await db.run(`
      UPDATE work_orders
      SET client = ?, status = ?
      WHERE id = ?
    `, [client || order.client, status || order.status, req.params.id]);

    const updatedOrder = await db.get('SELECT * FROM work_orders WHERE id = ?', req.params.id);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE work order with line items
router.delete('/:id', async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM work_orders WHERE id = ?', req.params.id);
    if (!order) return res.status(404).json({ error: 'Work order not found' });

    await db.run('DELETE FROM line_items WHERE work_order = ?', req.params.id);
    await db.run('DELETE FROM work_orders WHERE id = ?', req.params.id);

    res.json({ message: 'Work order and related line items deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
