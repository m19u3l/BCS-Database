import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const router = express.Router();

// Connect to SQLite database
const dbPromise = open({
  filename: './invoice.db', // ← correct path to your database
  driver: sqlite3.Database
});


// =========================
// GET line items for a specific job (Labor/Materials/Equipment)
// =========================
router.get('/:id/line-items', async (req, res) => {
  try {
    const db = await dbPromise;

    const items = await db.all(`
      SELECT li.id, li.invoice AS invoice_id, li.service AS service_id, li.quantity, li.total,
             s.description AS service_description
      FROM line_items li
      LEFT JOIN services s ON li.service = s.id
      LEFT JOIN invoices i ON li.invoice = i.id
      WHERE i.client = (SELECT client_id FROM job_tracking WHERE id = ?)
    `, req.params.id);

    res.json(items);
  } catch (err) {
    console.error('Error fetching line items:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
