import express from 'express';
import db from '../db.js';

const router = express.Router();

// ===============================================
// DAILY PROJECT LOGS (Used by Dryout and Reconstruction)
// ===============================================

/**
 * POST /api/logs/daily
 * Creates a new daily log entry for any project type.
 * Body requires: project_id, project_type ('dryout' or 'reconstruction'), log_entry, employee_id
 */
router.post('/daily', async (req, res) => {
    const { project_id, project_type, log_entry, employee_id } = req.body;

    if (!project_id || !project_type || !log_entry) {
        return res.status(400).json({ error: 'Missing required fields: project_id, project_type, and log_entry.' });
    }
    
    // Simple validation for project type
    if (project_type !== 'dryout' && project_type !== 'reconstruction') {
         return res.status(400).json({ error: 'Invalid project_type. Must be "dryout" or "reconstruction".' });
    }

    try {
        const result = await db.run(`
            INSERT INTO daily_project_logs (project_id, project_type, log_date, log_entry, employee_id)
            VALUES (?, ?, date('now'), ?, ?)
        `, [project_id, project_type, log_entry, employee_id]);

        res.status(201).json({ 
            message: 'Daily log entry created successfully.', 
            id: result.lastID 
        });
    } catch (error) {
        console.error('Error creating daily log:', error);
        res.status(500).json({ error: 'Failed to create daily log entry.', details: error.message });
    }
});


// ===============================================
// PROJECT PHOTOS (Used by Dryout and Reconstruction)
// ===============================================

/**
 * POST /api/logs/photo
 * Records a new photo taken for any project type.
 * NOTE: This assumes the actual photo file is handled by another service (e.g., S3)
 * and we only store the reference/metadata.
 * Body requires: project_id, project_type, url, description, taken_by
 */
router.post('/photo', async (req, res) => {
    const { project_id, project_type, url, description, taken_by } = req.body;

    if (!project_id || !project_type || !url) {
        return res.status(400).json({ error: 'Missing required fields: project_id, project_type, and url.' });
    }

    // Simple validation for project type
    if (project_type !== 'dryout' && project_type !== 'reconstruction') {
         return res.status(400).json({ error: 'Invalid project_type. Must be "dryout" or "reconstruction".' });
    }

    try {
        const result = await db.run(`
            INSERT INTO project_photos (project_id, project_type, taken_date, url, description, taken_by)
            VALUES (?, ?, datetime('now'), ?, ?, ?)
        `, [project_id, project_type, url, description, taken_by]);

        res.status(201).json({ 
            message: 'Photo metadata saved successfully.', 
            id: result.lastID 
        });
    } catch (error) {
        console.error('Error saving photo metadata:', error);
        res.status(500).json({ error: 'Failed to save photo metadata.', details: error.message });
    }
});


// ===============================================
// GENERAL RETRIEVALS (Utility functions for front-end)
// ===============================================

/**
 * GET /api/logs/equipment/:projectType/:projectId
 * Retrieves equipment logs for a specific project type and ID.
 */
router.get('/equipment/:projectType/:projectId', async (req, res) => {
    const { projectType, projectId } = req.params;

    if (projectType !== 'dryout' && projectType !== 'reconstruction') {
         return res.status(400).json({ error: 'Invalid projectType.' });
    }

    try {
        const logs = await db.all(`
            SELECT * FROM equipment_usage_log 
            WHERE project_id = ? AND project_type = ? 
            ORDER BY date_deployed DESC
        `, [projectId, projectType]);

        res.json(logs);
    } catch (error) {
        console.error('Error fetching equipment logs:', error);
        res.status(500).json({ error: 'Failed to fetch equipment logs.', details: error.message });
    }
});


export default router;

