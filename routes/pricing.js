import express from 'express';
import db from '../db.js';

// Initializes the router
const router = express.Router();

/**
 * GET /api/pricing
 * Fetches the entire price list, supports filtering and searching.
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, active = 'true' } = req.query;
    let sql = `
      SELECT id, line_code, description, category, unit_of_measure, unit_price, labor_cost, material_cost, equipment_cost
      FROM price_list
      WHERE active = ?
    `;
    const params = [active === 'true' ? 1 : 0];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      // Search across line code and description
      sql += ` AND (line_code LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY line_code`;

    const priceList = await db.all(sql, params);
    res.json(priceList);
  } catch (err) {
    console.error('Error fetching price list:', err.message);
    res.status(500).json({ error: 'Failed to retrieve price list' });
  }
});

/**
 * GET /api/pricing/:lineCode
 * Fetches a single price list item by its unique line code.
 */
router.get('/:lineCode', async (req, res) => {
  try {
    const { lineCode } = req.params;
    const item = await db.get(`
      SELECT id, line_code, description, category, subcategory, unit_of_measure, labor_cost, material_cost, equipment_cost, unit_price, notes
      FROM price_list
      WHERE line_code = ? AND active = 1
    `, lineCode.toUpperCase());

    if (!item) {
      return res.status(404).json({ error: 'Price item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error(`Error fetching price item ${req.params.lineCode}:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve price item' });
  }
});

/**
 * POST /api/pricing/calculate-quote
 * Takes a list of items and project markups, and returns a detailed quote breakdown.
 * This is the core logic for the Xactimate-style calculation.
 */
router.post('/calculate-quote', async (req, res) => {
  try {
    const { items, markups = {} } = req.body;
    const {
      overhead_percent = 15,
      profit_percent = 15,
      tool_depreciation_percent = 5
    } = markups;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items list is required for quote calculation.' });
    }

    // Safely construct the IN clause for the SQL query
    const itemCodes = items.map(i => `'${i.line_code.toUpperCase()}'`).join(',');
    const priceData = await db.all(`
      SELECT line_code, description, unit_of_measure, labor_cost, material_cost, equipment_cost, unit_price
      FROM price_list
      WHERE line_code IN (${itemCodes}) AND active = 1
    `);

    // Map the fetched price data to a key-value object for easy lookup
    const priceMap = new Map();
    priceData.forEach(item => priceMap.set(item.line_code, item));

    let totalLabor = 0;
    let totalMaterial = 0;
    let totalEquipment = 0;
    let totalSubtotal = 0;

    const detailedItems = items.map(inputItem => {
      const priceItem = priceMap.get(inputItem.line_code.toUpperCase());

      if (!priceItem) {
        return { ...inputItem, error: 'Line item code not found in price list.' };
      }

      // Calculate costs based on quantity
      const quantity = inputItem.quantity || 0;
      const laborCost = priceItem.labor_cost * quantity;
      const materialCost = priceItem.material_cost * quantity;
      const equipmentCost = priceItem.equipment_cost * quantity;
      // unit_price is labor + material + equipment
      const lineSubtotal = priceItem.unit_price * quantity;

      totalLabor += laborCost;
      totalMaterial += materialCost;
      totalEquipment += equipmentCost;
      totalSubtotal += lineSubtotal;

      return {
        ...inputItem,
        description: priceItem.description,
        unit_of_measure: priceItem.unit_of_measure,
        unit_price: priceItem.unit_price,
        labor_cost: parseFloat(laborCost.toFixed(2)),
        material_cost: parseFloat(materialCost.toFixed(2)),
        equipment_cost: parseFloat(equipmentCost.toFixed(2)),
        line_subtotal: parseFloat(lineSubtotal.toFixed(2)),
      };
    }).filter(item => !item.error); // Filter out items not found

    // --- Markup Calculations ---
    // The base for all markups is the total subtotal of all line items
    // Tool Depreciation is a fixed cost applied to total labor
    const toolDepreciationCost = totalLabor * (tool_depreciation_percent / 100);
    const subtotalWithDepreciation = totalSubtotal + toolDepreciationCost;

    // Overhead is applied to the base cost (Subtotal + Depreciation)
    const overheadCost = subtotalWithDepreciation * (overhead_percent / 100);
    const subtotalWithOH = subtotalWithDepreciation + overheadCost;

    // Profit is applied to the result after Overhead
    const profitCost = subtotalWithOH * (profit_percent / 100);
    const finalTotal = subtotalWithOH + profitCost;

    const quoteSummary = {
      subtotal_before_markups: parseFloat(totalSubtotal.toFixed(2)),
      total_labor: parseFloat(totalLabor.toFixed(2)),
      total_material: parseFloat(totalMaterial.toFixed(2)),
      total_equipment: parseFloat(totalEquipment.toFixed(2)),
      markups: {
        tool_depreciation: {
          percent: tool_depreciation_percent,
          cost: parseFloat(toolDepreciationCost.toFixed(2)),
          notes: "Applied to total labor cost."
        },
        overhead: {
          percent: overhead_percent,
          cost: parseFloat(overheadCost.toFixed(2)),
          notes: "Applied to Subtotal + Tool Depreciation."
        },
        profit: {
          percent: profit_percent,
          cost: parseFloat(profitCost.toFixed(2)),
          notes: "Applied to Subtotal + Tool Depreciation + Overhead."
        }
      },
      final_total: parseFloat(finalTotal.toFixed(2))
    };

    res.json({
      summary: quoteSummary,
      detailed_items: detailedItems,
    });

  } catch (err) {
    console.error('Error calculating quote:', err.message);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
});

// GET endpoint for price categories (useful for filtering/UI)
router.get('/categories', async (req, res) => {
    try {
        // Assuming a table named 'price_categories' exists
        const categories = await db.all('SELECT category_code, category_name FROM price_categories ORDER BY sort_order');
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({ error: 'Failed to retrieve price categories' });
    }
});


export default router;
