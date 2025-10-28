import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// --- ESM __dirname hack ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SQLite Setup ---
const dbPromise = open({
  filename: path.join(__dirname, "../invoice.db"),
  driver: sqlite3.Database,
});

// --- Dashboard Stats ---
router.get("/stats", async (req, res) => {
  try {
    const db = await dbPromise;

    const totalInvoices = await db.get("SELECT COUNT(*) AS count FROM invoices");
    const totalClients = await db.get("SELECT COUNT(*) AS count FROM clients");
    const totalLineItems = await db.get("SELECT COUNT(*) AS count FROM line_items");
    const totalWorkOrders = await db.get("SELECT COUNT(*) AS count FROM work_orders");
    const totalEstimates = await db.get("SELECT COUNT(*) AS count FROM estimates");
    const totalChangeOrders = await db.get("SELECT COUNT(*) AS count FROM change_orders");
    const totalMaterials = await db.get("SELECT COUNT(*) AS count FROM materials");
    const totalEquipment = await db.get("SELECT COUNT(*) AS count FROM equipment");
    const totalEmployees = await db.get("SELECT COUNT(*) AS count FROM employees");
    const totalVendors = await db.get("SELECT COUNT(*) AS count FROM vendors");

    const totalInvoiceAmount = await db.get("SELECT SUM(total) AS sum FROM invoices");

    res.json({
      totalInvoices: totalInvoices.count || 0,
      totalClients: totalClients.count || 0,
      totalLineItems: totalLineItems.count || 0,
      totalWorkOrders: totalWorkOrders.count || 0,
      totalEstimates: totalEstimates.count || 0,
      totalChangeOrders: totalChangeOrders.count || 0,
      totalMaterials: totalMaterials.count || 0,
      totalEquipment: totalEquipment.count || 0,
      totalEmployees: totalEmployees.count || 0,
      totalVendors: totalVendors.count || 0,
      totalInvoiceAmount: totalInvoiceAmount.sum || 0,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
