import express from 'express';
import db from '../db.js';

const router = express.Router();

// ===============================================
// EMPLOYEES ENDPOINTS (CRUD operations)
// ===============================================

/**
 * POST /api/resources/employees
 * Creates a new employee record.
 */
router.post('/employees', async (req, res) => {
    const { name, phone, email, role, status = 'Active' } = req.body;

    if (!name || !role) {
        return res.status(400).json({ error: 'Employee name and role are required.' });
    }

    try {
        const result = await db.run(`
            INSERT INTO employees (name, phone, email, role, status)
            VALUES (?, ?, ?, ?, ?)
        `, [name, phone, email, role, status]);

        res.status(201).json({ 
            message: 'Employee created successfully.', 
            id: result.lastID 
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Failed to create employee.', details: error.message });
    }
});

/**
 * GET /api/resources/employees
 * Retrieves all employees.
 */
router.get('/employees', async (req, res) => {
    try {
        const employees = await db.all('SELECT * FROM employees ORDER BY name');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees.', details: error.message });
    }
});


// ===============================================
// VENDORS / SUBCONTRACTORS ENDPOINTS (CRUD operations)
// ===============================================

/**
 * POST /api/resources/vendors
 * Creates a new vendor or subcontractor record.
 */
router.post('/vendors', async (req, res) => {
    const { name, contact_person, phone, email, service_type, license_number } = req.body;

    if (!name || !service_type) {
        return res.status(400).json({ error: 'Vendor name and service type are required.' });
    }

    try {
        const result = await db.run(`
            INSERT INTO vendors (name, contact_person, phone, email, service_type, license_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, contact_person, phone, email, service_type, license_number]);

        res.status(201).json({ 
            message: 'Vendor created successfully.', 
            id: result.lastID 
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor.', details: error.message });
    }
});

/**
 * GET /api/resources/vendors
 * Retrieves all vendors/subcontractors.
 */
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await db.all('SELECT * FROM vendors ORDER BY name');
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vendors.', details: error.message });
    }
});


// ===============================================
// EQUIPMENT / TOOLS ENDPOINTS (CRUD operations)
// ===============================================

/**
 * POST /api/resources/equipment
 * Creates a new equipment item.
 */
router.post('/equipment', async (req, res) => {
    const { name, serial_number, current_status = 'Available', last_calibration_date } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Equipment name is required.' });
    }

    try {
        const result = await db.run(`
            INSERT INTO equipment (name, serial_number, current_status, last_calibration_date)
            VALUES (?, ?, ?, ?)
        `, [name, serial_number, current_status, last_calibration_date]);

        res.status(201).json({ 
            message: 'Equipment created successfully.', 
            id: result.lastID 
        });
    } catch (error) {
        console.error('Error creating equipment:', error);
        res.status(500).json({ error: 'Failed to create equipment.', details: error.message });
    }
});

/**
 * GET /api/resources/equipment
 * Retrieves all equipment items.
 */
router.get('/equipment', async (req, res) => {
    try {
        const equipment = await db.all('SELECT * FROM equipment ORDER BY name');
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch equipment.', details: error.message });
    }
});

export default router;
