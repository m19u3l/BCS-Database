// routes/xactimate.js

import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all price list items
router.get('/', async (req, res) => {
    try {
        const items = await db.all("SELECT * FROM xactimate_price_list ORDER BY code");
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new price list item
router.post('/', async (req, res) => {
    const { code, category, description, unit, unit_cost, labor_cost, material_cost, equipment_cost, overhead_profit_percentage } = req.body;
    
    if (!code || !description || !unit) {
        return res.status(400).json({ error: 'Missing required fields: code, description, and unit.' });
    }

    try {
        const sql = `
            INSERT INTO xactimate_price_list 
            (code, category, description, unit, unit_cost, labor_cost, material_cost, equipment_cost, overhead_profit_percentage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.run(sql, [
            code.toUpperCase(), category, description, unit, unit_cost || 0, 
            labor_cost || 0, material_cost || 0, equipment_cost || 0, overhead_profit_percentage || 20
        ]);

        res.status(201).json({ 
            id: result.lastID, 
            code: code.toUpperCase(),
            message: 'Price list item created successfully.'
        });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `Code ${code.toUpperCase()} already exists.` });
        }
        res.status(500).json({ error: err.message });
    }
});

// GET, PUT, and DELETE routes by code (omitted for brevity, but they should be added for a complete CRUD)

export default router;

