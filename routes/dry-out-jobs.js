
// routes/dry-out-jobs.js
import express from "express";
import db from "../db.js"; // make sure this path is correct relative to server.js

const router = express.Router();

/**
 * POST /api/dry-out-jobs
 * Add a new dry-out job record.
 */
router.post("/", async (req, res) => {
  try {
    const {
      job_name,
      client_id,
      start_date,
      end_date,
      affected_area,
      notes
    } = req.body;

    // Validate required fields
    if (!job_name || !client_id) {
      return res.status(400).json({ error: "Missing required fields: job_name or client_id" });
    }

    // Insert into database
    const result = await db.run(
      `INSERT INTO dry_out_jobs (job_name, client_id, start_date, end_date, affected_area, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [job_name, client_id, start_date, end_date, affected_area, notes]
    );

    res.status(201).json({
      message: "Dry-out job created successfully",
      id: result.lastID,
      data: { job_name, client_id, start_date, end_date, affected_area, notes }
    });
  } catch (err) {
    console.error("❌ Error creating dry-out job:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/dry-out-jobs
 * Fetch all dry-out jobs.
 */
router.get("/", async (req, res) => {
  try {
    const jobs = await db.all(`SELECT * FROM dry_out_jobs ORDER BY id DESC`);
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error fetching dry-out jobs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

