# 🧾 Invoice Generator - SD-BCS

A comprehensive invoice and business management system built with Node.js, Express, and SQLite.

## Features

- ✅ Client Management
- ✅ Invoice Generation & PDF Export
- ✅ Email Invoices via IONOS SMTP
- ✅ Estimates & Work Orders
- ✅ Materials & Equipment Tracking
- ✅ Employee Management
- ✅ Services Catalog
- ✅ Line Items Management
- ✅ Change Orders
- ✅ Dashboard with Statistics

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/m19u3l/Venicwe-Bcs-ig.git
   cd Venicwe-Bcs-ig
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   Edit `.env` and add your IONOS email password:
   ```env
   PORT=3000
   SMTP_HOST=smtp.ionos.com
   SMTP_PORT=587
   SMTP_USER=m19u3l@sd-bcs.com
   SMTP_PASS=YOUR_ACTUAL_PASSWORD_HERE
   EMAIL_FROM_NAME=Miguel
   EMAIL_FROM_ADDRESS=m19u3l@sd-bcs.com
   ```

5. **Initialize the database:**
   The database will be automatically created when you start the server for the first time. Sample data will be populated automatically.

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice with line items
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/pdf` - Download invoice as PDF
- `POST /api/invoices/:id/email` - Email invoice to client

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Line Items
- `GET /api/line-items` - Get all line items
- `GET /api/line-items/:id` - Get single line item
- `GET /api/line-items/invoice/:id` - Get line items by invoice
- `POST /api/line-items` - Create new line item
- `PUT /api/line-items/:id` - Update line item
- `DELETE /api/line-items/:id` - Delete line item

### Estimates
- `GET /api/estimates` - Get all estimates
- `GET /api/estimates/:id` - Get single estimate
- `POST /api/estimates` - Create new estimate
- `PUT /api/estimates/:id` - Update estimate
- `DELETE /api/estimates/:id` - Delete estimate

### Work Orders
- `GET /api/work-orders` - Get all work orders
- `GET /api/work-orders/:id` - Get single work order
- `POST /api/work-orders` - Create new work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

### Change Orders
- `GET /api/change-orders` - Get all change orders
- `GET /api/change-orders/:id` - Get single change order
- `GET /api/change-orders/work-order/:id` - Get change orders by work order
- `POST /api/change-orders` - Create new change order
- `PUT /api/change-orders/:id` - Update change order
- `DELETE /api/change-orders/:id` - Delete change order

### Materials
- `GET /api/materials` - Get all materials
- `GET /api/materials/:id` - Get single material
- `POST /api/materials` - Create new material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Equipment
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get single equipment
- `POST /api/equipment` - Create new equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Project Structure

```
Venicwe-Bcs-ig/
├── server.js              # Main server file
├── db.js                  # Database initialization
├── package.json           # Dependencies
├── .env                   # Environment variables (create this)
├── .env.example          # Environment template
├── invoice.db            # SQLite database (auto-created)
├── routes/               # API route handlers
│   ├── clients.js
│   ├── invoices.js
│   ├── services.js
│   ├── line_items.js
│   ├── estimates.js
│   ├── work-orders.js
│   ├── change-orders.js
│   ├── materials.js
│   ├── equipment.js
│   ├── employees.js
│   ├── vendors.js
│   ├── dashboard.js
│   └── ...
└── client/               # Frontend files
    └── index.html
```

## Creating an Invoice Example

```bash
# 1. Create a client
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "email": "test@example.com",
    "phone": "(555) 123-4567",
    "address": "123 Test St",
    "city": "San Diego",
    "state": "CA",
    "zip": "92101"
  }'

# 2. Create an invoice
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "due_date": "2025-11-30",
    "line_items": [
      {
        "category": "Labor",
        "description": "Water extraction",
        "quantity": 2,
        "rate": 250
      },
      {
        "category": "Materials",
        "description": "Drywall repair",
        "quantity": 1,
        "rate": 150
      }
    ],
    "notes": "Payment due within 30 days"
  }'

# 3. Download PDF
curl http://localhost:3000/api/invoices/1/pdf --output invoice.pdf

# 4. Email invoice
curl -X POST http://localhost:3000/api/invoices/1/email \
  -H "Content-Type: application/json" \
  -d '{"clientEmail": "client@example.com"}'
```

## Database Schema

The system uses SQLite with the following main tables:
- **clients** - Customer information
- **services** - Service catalog
- **invoices** - Invoice records
- **line_items** - Invoice line items
- **estimates** - Project estimates
- **work_orders** - Work order management
- **change_orders** - Change order tracking
- **materials** - Material inventory
- **equipment** - Equipment tracking
- **employees** - Employee records
- **vendors** - Vendor/subcontractor info
- **settings** - System settings

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- Keep your IONOS email password secure
- Consider using environment-specific `.env` files
- Update default passwords before deployment

## Troubleshooting

### Database not creating
- Check file permissions in project directory
- Ensure SQLite3 is properly installed

### Email not sending
- Verify IONOS SMTP credentials in `.env`
- Check port 587 is not blocked by firewall
- Ensure email address is verified with IONOS

### PDF generation errors
- Make sure PDFKit is properly installed
- Check for sufficient disk space

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Payment processing integration
- [ ] Advanced reporting features
- [ ] Mobile app
- [ ] Multi-company support
- [ ] Automated backup system

## License

ISC

## Author

Miguel - SD-BCS

## Support

For support, email m19u3l@sd-bcs.com
