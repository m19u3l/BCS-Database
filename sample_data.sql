-- Clients
INSERT INTO clients (name, email, address) VALUES
('John Smith','john.smith@example.com','123 Main St, San Diego, CA'),
('Mary Johnson','mary.johnson@example.com','456 Elm St, La Jolla, CA');

-- Services
INSERT INTO services (name, description, price) VALUES
('Water Remediation','Extraction and drying of water-damaged areas',250),
('Mold Remediation','Mold inspection and removal',350);

-- Invoices
INSERT INTO invoices (client, date_created, total) VALUES
(1,'2025-10-01 10:00:00',1000),
(2,'2025-10-05 14:30:00',750);

-- Line Items
INSERT INTO line_items (invoice, service, quantity, total) VALUES
(1,1,2,500),
(1,2,1,350),
(2,1,1,250);

-- Add similar INSERTs for jobs, materials, equipment, etc.

