

CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL
);

CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client INTEGER,
    date_created TEXT,
    total REAL,
    FOREIGN KEY(client) REFERENCES clients(id)
);

CREATE TABLE line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice INTEGER,
    service INTEGER,
    quantity INTEGER,
    total REAL,
    FOREIGN KEY(invoice) REFERENCES invoices(id),
    FOREIGN KEY(service) REFERENCES services(id)
);

-- New tables for your modules

-- Estimates
CREATE TABLE estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client INTEGER,
    date_created TEXT,
    total REAL,
    status TEXT,
    FOREIGN KEY(client) REFERENCES clients(id)
);

CREATE TABLE estimate_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estimate INTEGER,
    service INTEGER,
    quantity INTEGER,
    total REAL,
    FOREIGN KEY(estimate) REFERENCES estimates(id),
    FOREIGN KEY(service) REFERENCES services(id)
);

-- Work Orders
CREATE TABLE work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client INTEGER,
    date_created TEXT,
    total REAL,
    status TEXT,
    FOREIGN KEY(client) REFERENCES clients(id)
);

CREATE TABLE work_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order INTEGER,
    service INTEGER,
    quantity INTEGER,
    total REAL,
    FOREIGN KEY(work_order) REFERENCES work_orders(id),
    FOREIGN KEY(service) REFERENCES services(id)
);

-- Change Orders
CREATE TABLE change_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order INTEGER,
    date_created TEXT,
    description TEXT,
    total REAL,
    FOREIGN KEY(work_order) REFERENCES work_orders(id)
);
-- =========================
-- Job Tracking Table
-- =========================
CREATE TABLE IF NOT EXISTS job_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT NOT NULL,
    phase_name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'Pending',
    client_id INTEGER NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);


-- ===================================
-- Materials Table
-- ===================================
CREATE TABLE materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit_cost REAL DEFAULT 0,
    total_cost REAL GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    vendor INTEGER,
    store_link TEXT DEFAULT 'https://www.homedepot.com/',
    FOREIGN KEY (vendor) REFERENCES vendors(id)
);


-- Equipment Log
CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    condition TEXT,
    last_maintenance TEXT
);

-- Hand Tools
CREATE TABLE hand_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    assigned_to TEXT,
    condition TEXT
);

-- Employee Hours
CREATE TABLE employee_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT,
    date TEXT,
    hours REAL,
    job_id INTEGER,
    FOREIGN KEY(job_id) REFERENCES jobs(id)
);

-- Vendors/Subs
CREATE TABLE vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT,
    service_type TEXT
);

-- Water Remediation Dry-Out
CREATE TABLE dry_out_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client INTEGER,
    job_date TEXT,
    status TEXT,
    notes TEXT,
    FOREIGN KEY(client) REFERENCES clients(id)
);

-- Reconstruction
CREATE TABLE reconstruction_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client INTEGER,
    job_date TEXT,
    status TEXT,
    notes TEXT,
    FOREIGN KEY(client) REFERENCES clients(id)
);

-- Reports (basic)
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    created_at TEXT,
    content TEXT
);

-- Settings (key-value)
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT,
    value TEXT
);

