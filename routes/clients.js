import express from 'express';
import db from '../db.js';

const router = express.Router();

// ===============================================
// CLIENTS ENDPOINTS
// ===============================================

/**
 * GET /api/clients - Retrieves all clients, showing their open work orders (active projects).
 */
router.get('/', async (req, res) => {
    try {
        // Fetch all clients
        const clients = await db.all('SELECT * FROM clients ORDER BY name');

        // Augment each client with counts of active projects (Work Orders)
        for (const client of clients) {
            // Note: Assuming a 'work_orders' table exists, linked to 'clients' via the 'client' column.
            const activeProjects = await db.get(`
                SELECT COUNT(id) AS count
                FROM projects
                WHERE client_id = ? AND status NOT IN ('Completed', 'Closed', 'Canceled')
            `, [client.id]);

            client.active_projects_count = activeProjects ? activeProjects.count : 0;
        }

        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients.', details: error.message });
    }
});

/**
 * GET /api/clients/:id - Retrieves a single client and their full project history.
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const client = await db.get('SELECT * FROM clients WHERE id = ?', [id]);

        if (!client) {
            return res.status(404).json({ error: 'Client not found.' });
        }

        // Fetch all projects (work orders) associated with this client
        const projects = await db.all(`
            SELECT
                p.id, p.name, p.status, p.created_at
            FROM projects p
            WHERE p.client_id = ?
            ORDER BY p.created_at DESC
        `, [id]);

        client.projects = projects;

        res.json(client);
    } catch (error) {
        console.error('Error fetching client details:', error);
        res.status(500).json({ error: 'Failed to fetch client details.', details: error.message });
    }
});

/**
 * POST /api/clients - Creates a new client.
 */
router.post('/', async (req, res) => {
    const { name, email, phone, address, city, state, zip, notes } = req.body;

    if (!name || !address) {
        return res.status(400).json({ error: 'Client name and primary address are required.' });
    }

    try {
        const result = await db.run(`
            INSERT INTO clients (name, email, phone, address, city, state, zip, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, email, phone, address, city, state, zip, notes]);

        res.status(201).json({
            message: 'Client created successfully.',
            id: result.lastID
        });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client.', details: error.message });
    }
});

/**
 * PUT /api/clients/:id - Updates client details.
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, city, state, zip, notes } = req.body;

    try {
        const result = await db.run(`
            UPDATE clients
            SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?, notes = ?
            WHERE id = ?
        `, [name, email, phone, address, city, state, zip, notes, id]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Client not found or no changes made.' });
        }

        res.json({ message: 'Client updated successfully.' });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client.', details: error.message });
    }
});

/**
 * DELETE /api/clients/:id - Deletes a client.
 */
router.delete('/:id', async (req, res) => {
    try {
        // In a real app, you would use a transaction to cascade deletes or set project client_id to NULL.
        const result = await db.run('DELETE FROM clients WHERE id = ?', req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
        res.json({ message: 'Client deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
