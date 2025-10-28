import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

/**
 * Initializes the SQLite database, creating all necessary tables
 * and inserting default settings and sample data if they don't exist.
 */
async function initDatabase() {
  db = await open({
    // The filename is set relative to the project root in the .env file,
    // but here we use a hardcoded name for this example.
    filename: path.join(__dirname, 'invoice.db'),
    driver: sqlite3.Database
  });

  // Create all database tables
  await db.exec(`
    -- Clients table
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Services table (Catalog of repair/remediation services)
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      base_price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Invoices table
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id INTEGER,
      client_name TEXT,
      project_name TEXT,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Invoice Line Items table
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL,
      unit_price REAL,
      total REAL,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );

    -- Employees table
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      hourly_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Work Orders table (Projects)
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_number TEXT UNIQUE NOT NULL,
      client INTEGER,
      project_name TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled', -- scheduled, in-progress, completed, cancelled
      start_date DATE,
      end_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client) REFERENCES clients(id)
    );

    -- Change Orders table (Updates to work orders)
    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order INTEGER NOT NULL,
      description TEXT NOT NULL,
      cost_change REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, approved, declined
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(work_order) REFERENCES work_orders(id)
    );

    -- Price List Items table (Detailed line items/costs, similar to Xactimate)
    CREATE TABLE IF NOT EXISTS price_list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT, -- e.g., DEMO, DRWL, FRMG, WDR
      unit TEXT,     -- e.g., SF (Square Foot), LF (Linear Foot), Day
      labor_unit_cost REAL DEFAULT 0,
      material_unit_cost REAL DEFAULT 0,
      equipment_unit_cost REAL DEFAULT 0,
      total_unit_cost REAL GENERATED ALWAYS AS (labor_unit_cost + material_unit_cost + equipment_unit_cost) VIRTUAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings table for company info
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      logo_url TEXT,
      tax_rate REAL DEFAULT 0.08,
      currency_symbol TEXT DEFAULT '$'
    );
  `);

  console.log('✅ Database schema initialized');


  // --- Insert Sample Data (Only if tables are empty, for development) ---

  const count = await db.get('SELECT COUNT(*) as count FROM clients');
  if (count.count === 0) {
    console.log('--- Inserting Sample Data ---');

    // Insert company settings
    await db.run(`
      INSERT INTO settings (company_name, logo_url) VALUES 
      ('BCS Restoration & Repair', 'https://placehold.co/150x50/3b82f6/ffffff?text=BCS')`);

    // Insert sample client
    const clientResult = await db.run(`
      INSERT INTO clients (name, email, phone, address, city, state, zip) VALUES 
      ('Smith Residence', 'smith@example.com', '555-0101', '123 Main St', 'Anytown', 'CA', '90210')`);
    const clientId = clientResult.lastID;

    // Insert sample employees
    await db.run(`
      INSERT INTO employees (name, role, hourly_rate) VALUES
      ('Mike Rodriguez', 'Technician III', 45.00),
      ('Sarah Chen', 'Lead Estimator', 55.00)`);

    // Insert a sample work order
    const workOrderResult = await db.run(`
      INSERT INTO work_orders (work_order_number, client, project_name, status, start_date, end_date, notes) VALUES 
      (?, ?, ?, ?, ?, ?, ?)`, 
      ['WO-2025-001', clientId, 'Smith Residence Water Loss', 'in-progress', '2025-10-20', '2025-10-28', 'Category 3 water loss in kitchen and laundry room. Full dryout required.']);
    const workOrderId = workOrderResult.lastID;

    // Insert a sample change order
    await db.run(`
      INSERT INTO change_orders (work_order, description, cost_change, status) VALUES 
      (?, ?, ?, ?)`, 
      [workOrderId, 'Add 5ft of affected drywall removal in hallway.', 500.00, 'approved']);

    // Insert sample price list items
    await db.run(`
      INSERT INTO price_list_items (item_code, description, category, unit, labor_unit_cost, material_unit_cost, equipment_unit_cost) VALUES
      ('DRW-RMO', 'Remove & dispose of drywall (0-2 ft cut)', 'DEMO', 'LF', 0.75, 0.05, 0.05),
      ('BBD-RMO', 'Remove & dispose of baseboard/trim', 'DEMO', 'LF', 0.45, 0.03, 0.02),
      ('DEHU-L', 'Dehumidifier, Large (Rental, 24HR)', 'WDR', 'Day', 0.00, 0.00, 65.00),
      ('FAN-AXL', 'Air Mover, Axial (Rental, 24HR)', 'WDR', 'Day', 0.00, 0.00, 18.00),
      ('DRW-HNG', 'Hang 1/2" drywall', 'DRWL', 'SF', 1.20, 0.50, 0.00),
      ('DRW-FIN3', 'Drywall Finish (Level 3)', 'DRWL', 'SF', 0.80, 0.10, 0.00),
      ('FRM-WALL', 'Wall framing (studs, plates, blocking)', 'FRMG', 'LF', 8.50, 4.00, 0.50)
    `);

    console.log('✅ Sample data inserted');
  }


  // Initialize database promise to be used by all route files
  return db;
}
const dbPromise = initDatabase();

// Export helper functions to query the database
export default {
  get: async (sql, params) => {
    const database = await dbPromise;
    return database.get(sql, params);
  },
  all: async (sql, params) => {
    const database = await dbPromise;
    return database.all(sql, params);
  },
  run: async (sql, params) => {
    const database = await dbPromise;
    return database.run(sql, params);
  },
};
