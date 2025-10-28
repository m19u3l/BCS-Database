// routes/remediation-dryout.js

import express from 'express';
// 🔑 Import the database module from your project root
import db from '../db.js'; 

const router = express.Router();

// ➡️ GET /remediation-dryout/ - Get all remediation dryout projects
router.get('/', async (req, res) => {
    try {
        // Query the remediation_dryout table you created
        const sql = 'SELECT * FROM remediation_dryout ORDER BY date_started DESC';
        
        // Await the asynchronous database call
        const data = await db.all(sql, []); 

        res.json({
            message: 'All dryout projects retrieved successfully',
            data: data
        });

    } catch (error) {
        console.error('Error fetching dryout records:', error.message);
        res.status(500).json({ error: 'Failed to fetch dryout records from database.' });
    }
});

// ➕ POST /remediation-dryout/ - Create a new dryout record
router.post('/', async (req, res) => {
    // Note: You must include all NOT NULL columns. Adjust body destructing as needed.
    const { work_order_id, project_number, loss_date, loss_type } = req.body;
    
    if (!work_order_id || !project_number) {
        return res.status(400).json({ error: 'Missing required fields: work_order_id and project_number.' });
    }

    try {
        const sql = `
            INSERT INTO remediation_dryout 
            (work_order_id, project_number, loss_date, loss_type) 
            VALUES (?, ?, ?, ?)
        `;
        
        // Await the run command for inserting data
        const result = await db.run(sql, [work_order_id, project_number, loss_date, loss_type]);

        res.status(201).json({
            message: 'Dryout project created successfully',
            id: result.lastID, // Get the ID of the new row
            data: req.body
        });
    } catch (error) {
        console.error('Error creating dryout record:', error.message);
        res.status(500).json({ error: 'Failed to insert dryout record into database.' });
    }
});

// Export the router for use in server.js
export default router;