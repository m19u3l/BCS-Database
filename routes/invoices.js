// routes/invoices.js (Simplified & Corrected for Promise DB)

import express from 'express';
import db from '../db.js';

const router = express.Router();

// ------------------------------------------------------------------
// GET / - Get all invoices (CORRECTED to use async/await)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM invoices ORDER BY date_of_issue DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ------------------------------------------------------------------
// POST / - Create a new invoice (CORRECTED to use async/await)
// ------------------------------------------------------------------
router.post('/', async (req, res) => { // <-- Must be 'async'
    // Using fields from the database schema: client_id, total
    const { client_id, total, status } = req.body; 

    // Minimal validation
    if (!client_id || !total) {
        return res.status(400).json({ error: 'Missing required fields: client_id and total.' });
    }

    try {
        const sql = `
            INSERT INTO invoices (client_id, total, status, date_of_issue) 
            VALUES (?, ?, ?, CURRENT_DATE)
        `;
        // Use await with the promise-based db.run()
        const result = await db.run(sql, [client_id, total, status || 'draft']); 

        res.status(201).json({ 
            id: result.lastID, // Accesses the last ID from the promise result
            client_id, 
            total, 
            status: status || 'draft' 
        });
    } catch (err) {
        console.error('Error creating invoice:', err);
        res.status(500).json({ error: 'Failed to insert invoice.' });
    }
});

export default router;
