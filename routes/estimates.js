import express from 'express';
import db from '../db.js';

const router = express.Router();

// Helper function to generate estimate number
async function generateEstimateNumber() {
    const settings = await db.get('SELECT estimate_prefix FROM settings LIMIT 1');
    const prefix = settings?.estimate_prefix || 'EST-';
    
    const lastEstimate = await db.get(`
        SELECT estimate_number FROM estimates 
        ORDER BY id DESC LIMIT 1
    `);
    
    let nextNumber = 1;
    if (lastEstimate) {
        const match = lastEstimate.estimate_number.match(/\d+$/);
        if (match) {
            nextNumber = parseInt(match[0]) + 1;
        }
    }
    
    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}


// ===============================================
// ESTIMATES ENDPOINTS
// ===============================================

/**
 * POST /api/estimates
 * Creates a new estimate, automatically calculating totals based on line items.
 */
router.post('/', async (req, res) => {
    const { 
        work_order_id, client_id, scope_description, line_items = [], status = 'Draft' 
    } = req.body;

    if (!work_order_id || !client_id || !scope_description) {
        return res.status(400).json({ error: 'Work Order ID, Client ID, and Scope are required.' });
    }

    try {
        // Generate estimate number
        const estimate_number = await generateEstimateNumber();

        // Calculate totals (Estimates are often Net Total, but we use the invoice model for consistency)
        let subtotal = 0;
        line_items.forEach(item => {
            const itemTotal = (item.quantity || 1) * (item.rate || 0);
            subtotal += itemTotal;
        });

        // For simplicity, we can exclude tax calculation on initial estimates unless specified
        const total = subtotal; 

        // Create estimate
        const result = await db.run(`
            INSERT INTO estimates (
                work_order_id, client_id, estimate_number, scope_description,
                subtotal, total, status, date_issued, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), datetime('now'))
        `, [
            work_order_id, client_id, estimate_number, scope_description,
            subtotal, total, status
        ]);

        const estimateId = result.lastID;

        // Insert line items (reusing the line_items table structure)
        for (const item of line_items) {
            const itemTotal = (item.quantity || 1) * (item.rate || 0);
            await db.run(`
                INSERT INTO line_items (estimate, service, category, description, quantity, rate, total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                estimateId,
                item.service || null, // Can link to a specific Dryout/Recon service ID
                item.category,
                item.description,
                item.quantity || 1,
                item.rate || 0,
                itemTotal
            ]);
        }

        const newEstimate = await db.get('SELECT * FROM estimates WHERE id = ?', estimateId);
        res.status(201).json(newEstimate);
    } catch (error) {
        console.error('Error creating estimate:', error);
        res.status(500).json({ error: 'Failed to create estimate.', details: error.message });
    }
});

/**
 * GET /api/estimates/:id
 * Retrieves a single estimate with all its associated line items.
 */
router.get('/:id', async (req, res) => {
    try {
        const estimate = await db.get('SELECT * FROM estimates WHERE id = ?', req.params.id);
        if (!estimate) {
            return res.status(404).json({ error: 'Estimate not found' });
        }

        const lineItems = await db.all('SELECT * FROM line_items WHERE estimate = ?', req.params.id);
        
        res.json({ ...estimate, line_items: lineItems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/estimates/:id
 * Updates an estimate, including recalculating totals if line items are modified.
 */
router.put('/:id', async (req, res) => {
    try {
        const { status, scope_description, line_items, date_approved, date_declined } = req.body;
        
        const estimate = await db.get('SELECT * FROM estimates WHERE id = ?', req.params.id);
        if (!estimate) {
            return res.status(404).json({ error: 'Estimate not found' });
        }

        let totalUpdateFields = [];
        let totalUpdateValues = [];

        // If line items are provided, recalculate totals
        if (line_items && line_items.length > 0) {
            await db.run('DELETE FROM line_items WHERE estimate = ?', req.params.id);

            let subtotal = 0;
            for (const item of line_items) {
                const itemTotal = (item.quantity || 1) * (item.rate || 0);
                subtotal += itemTotal;

                await db.run(`
                    INSERT INTO line_items (estimate, service, category, description, quantity, rate, total)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    req.params.id,
                    item.service || null,
                    item.category,
                    item.description,
                    item.quantity || 1,
                    item.rate || 0,
                    itemTotal
                ]);
            }

            const total = subtotal; // Assuming no tax on estimates for simplicity
            totalUpdateFields.push('subtotal = ?', 'total = ?');
            totalUpdateValues.push(subtotal, total);
        }

        // Build main update query
        const fields = [];
        const values = [];

        if (status) {
            fields.push('status = ?');
            values.push(status);
        }
        if (scope_description) {
            fields.push('scope_description = ?');
            values.push(scope_description);
        }
        if (date_approved) {
            fields.push('date_approved = ?');
            values.push(date_approved);
        }
        if (date_declined) {
            fields.push('date_declined = ?');
            values.push(date_declined);
        }
        
        // Combine fields/values from line item recalculation
        fields.push(...totalUpdateFields);
        values.push(...totalUpdateValues);

        if (fields.length > 0) {
            await db.run(`
                UPDATE estimates SET ${fields.join(', ')} WHERE id = ?
            `, [...values, req.params.id]);
        }
        
        const updatedEstimate = await db.get('SELECT * FROM estimates WHERE id = ?', req.params.id);
        const estimateLineItems = await db.all('SELECT * FROM line_items WHERE estimate = ?', req.params.id);

        res.json({ ...updatedEstimate, line_items: estimateLineItems });
    } catch (err) {
        console.error('Error updating estimate:', err);
        res.status(500).json({ error: 'Failed to update estimate.', details: err.message });
    }
});

// ===============================================
// CHANGE ORDERS (Simple CRUD structure)
// ===============================================

/**
 * POST /api/estimates/:estimateId/change-order
 * Creates a new change order linked to an existing estimate.
 */
router.post('/:estimateId/change-order', async (req, res) => {
    const { 
        description, reason, amount, status = 'Pending' 
    } = req.body;
    const estimate_id = req.params.estimateId;

    if (!description || !amount) {
        return res.status(400).json({ error: 'Description and amount are required for a Change Order.' });
    }

    try {
        const result = await db.run(`
            INSERT INTO change_orders (estimate_id, description, reason, amount, status, date_requested)
            VALUES (?, ?, ?, ?, ?, date('now'))
        `, [estimate_id, description, reason, amount, status]);

        const newChangeOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', result.lastID);
        res.status(201).json(newChangeOrder);
    } catch (error) {
        console.error('Error creating change order:', error);
        res.status(500).json({ error: 'Failed to create change order.', details: error.message });
    }
});


export default router;
