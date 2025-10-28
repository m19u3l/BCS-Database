import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all change orders
router.get('/', async (req, res) => {
  try {
    const changeOrders = await db.all(`
      SELECT co.*, wo.client AS client_id, c.name AS client_name
      FROM change_orders co
      JOIN work_orders wo ON co.work_order_id = wo.id
      JOIN clients c ON wo.client = c.id
      ORDER BY co.date_issued DESC
    `);
    res.json(changeOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single change order by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', id);
    if (!changeOrder) {
      return res.status(404).json({ error: 'Change Order not found' });
    }
    res.json(changeOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new change order
router.post('/', async (req, res) => {
  const { work_order_id, description, amount, status, date_issued, date_approved } = req.body;
  if (!work_order_id || !description || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await db.run(
      `INSERT INTO change_orders (work_order_id, description, amount, status, date_issued, date_approved)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [work_order_id, description, amount, status || 'Pending', date_issued || new Date().toISOString(), date_approved]
    );
    const newChangeOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', result.lastID);
    res.status(201).json(newChangeOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a change order
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, status, date_approved } = req.body;

  try {
    const existing = await db.get('SELECT * FROM change_orders WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ error: 'Change Order not found' });
    }

    await db.run(
      `UPDATE change_orders SET description = ?, amount = ?, status = ?, date_approved = ? WHERE id = ?`,
      [
        description || existing.description,
        amount !== undefined ? amount : existing.amount,
        status || existing.status,
        date_approved || existing.date_approved,
        id
      ]
    );

    const updatedChangeOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', id);
    res.json(updatedChangeOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a change order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.run('DELETE FROM change_orders WHERE id = ?', id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Change Order not found' });
    }
    res.json({ message: 'Change Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;