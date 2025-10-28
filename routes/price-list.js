import express from 'express';
// Assumed path to your database connection utility
import db from '../db.js'; 

// Initialize the router for this file, which will handle all routes starting with /
const priceListRouter = express.Router();

// GET all price list items (optional filter by pricing_tier)
// Example: GET /api/price-list?tier=INSURANCE
priceListRouter.get('/', async (req, res) => {
    const { tier } = req.query;
    let sql = 'SELECT * FROM price_list WHERE is_active = 1';
    const params = [];

    if (tier) {
        // Sanitize tier input to prevent injection
        const sanitizedTier = tier.toUpperCase();
        if (sanitizedTier === 'INSURANCE' || sanitizedTier === 'HOMEOWNER') {
            sql += ' AND pricing_tier = ?';
            params.push(sanitizedTier);
        } else {
            console.warn(`Invalid pricing tier provided: ${tier}. Returning all active prices.`);
        }
    }

    sql += ' ORDER BY category, line_code';

    try {
        const prices = await db.all(sql, params);
        res.json(prices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve price list: ' + err.message });
    }
});

// GET a single price list item by line_code/tier
// Example: GET /api/price-list/search?code=WTR%20EXT&tier=INSURANCE
priceListRouter.get('/search', async (req, res) => {
    const { code, tier } = req.query;

    if (!code || !tier) {
        return res.status(400).json({ error: 'Missing required query parameters: code and tier.' });
    }

    try {
        const priceItem = await db.get(
            'SELECT * FROM price_list WHERE line_code = ? AND pricing_tier = ? AND is_active = 1',
            [code, tier.toUpperCase()]
        );

        if (!priceItem) {
            return res.status(404).json({ error: `Price item not found for code '${code}' and tier '${tier}'` });
        }
        res.json(priceItem);
    } catch (err) {
        res.status(500).json({ error: 'Failed to search price list: ' + err.message });
    }
});


// POST (CREATE) a new price list item
priceListRouter.post('/', async (req, res) => {
    const {
        line_code, description, category, unit_of_measure, unit_price, pricing_tier,
        labor_rate, material_rate, equipment_rate, overhead_percent, profit_percent
    } = req.body;

    if (!line_code || !description || !unit_price || !pricing_tier) {
        return res.status(400).json({ error: 'Missing required fields: line_code, description, unit_price, and pricing_tier.' });
    }

    const tier = pricing_tier.toUpperCase();

    try {
        const result = await db.run(
            `INSERT INTO price_list (
                line_code, description, category, unit_of_measure, unit_price, pricing_tier,
                labor_rate, material_rate, equipment_rate, overhead_percent, profit_percent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                line_code, description, category, unit_of_measure, unit_price, tier,
                labor_rate || 0, material_rate || 0, equipment_rate || 0, overhead_percent || 0.10, profit_percent || 0.10
            ]
        );
        const newPrice = await db.get('SELECT * FROM price_list WHERE id = ?', result.lastID);
        res.status(201).json(newPrice);
    } catch (err) {
        // Handle unique constraint error
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
             return res.status(409).json({ error: `A price item with line code '${line_code}' already exists for the '${tier}' tier.` });
        }
        res.status(500).json({ error: 'Failed to create price list item: ' + err.message });
    }
});

// PUT (UPDATE) a price list item
priceListRouter.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        line_code, description, category, unit_of_measure, unit_price,
        labor_rate, material_rate, equipment_rate, overhead_percent, profit_percent, is_active
    } = req.body;

    try {
        const result = await db.run(
            `UPDATE price_list SET
                line_code = COALESCE(?, line_code),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                unit_of_measure = COALESCE(?, unit_of_measure),
                unit_price = COALESCE(?, unit_price),
                labor_rate = COALESCE(?, labor_rate),
                material_rate = COALESCE(?, material_rate),
                equipment_rate = COALESCE(?, equipment_rate),
                overhead_percent = COALESCE(?, overhead_percent),
                profit_percent = COALESCE(?, profit_percent),
                is_active = COALESCE(?, is_active),
                last_updated = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                line_code, description, category, unit_of_measure, unit_price,
                labor_rate, material_rate, equipment_rate, overhead_percent, profit_percent, is_active,
                id
            ]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Price list item not found or no changes made.' });
        }
        const updatedPrice = await db.get('SELECT * FROM price_list WHERE id = ?', id);
        res.json(updatedPrice);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update price list item: ' + err.message });
    }
});

// DELETE a price list item (sets is_active to 0 instead of hard delete)
priceListRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run('UPDATE price_list SET is_active = 0, last_updated = CURRENT_TIMESTAMP WHERE id = ?', id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Price list item not found' });
        }
        res.json({ message: 'Price list item deactivated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to deactivate price list item: ' + err.message });
    }
});

export default priceListRouter;
