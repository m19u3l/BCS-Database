# 🚀 Quick Start Guide

Get your Invoice Generator up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

# IONOS SMTP Configuration
SMTP_HOST=smtp.ionos.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=m19u3l@sd-bcs.com
SMTP_PASS=Psswrd2025!

# Email Settings
EMAIL_FROM_NAME=Miguel
EMAIL_FROM_ADDRESS=m19u3l@sd-bcs.com

# Database
DATABASE_PATH=./invoice.db

# Company Info
COMPANY_NAME=SD-BCS
COMPANY_EMAIL=m19u3l@sd-bcs.com
```

## Step 3: Start the Server

### For Development (with auto-reload):
```bash
npm run dev
```

### For Production:
```bash
npm start
```

## Step 4: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see:
✅ Server running on port 3000
✅ Database initialized successfully
✅ Sample data inserted

## Step 5: Test the API

### View all clients:
```bash
curl http://localhost:3000/api/clients
```

### View dashboard stats:
```bash
curl http://localhost:3000/api/dashboard/stats
```

### Create a new client:
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Client",
    "email": "new@example.com",
    "phone": "(555) 000-0000"
  }'
```

## What's Included (Sample Data)

The database comes pre-populated with:
- ✅ 3 sample clients
- ✅ 8 service types
- ✅ Company settings configured

## Next Steps

1. **Customize Company Info**: Edit settings via `/api/settings`
2. **Add Your Services**: Create services via `/api/services`
3. **Create Invoices**: Use `/api/invoices` endpoint
4. **Generate PDFs**: Access `/api/invoices/:id/pdf`
5. **Send Emails**: POST to `/api/invoices/:id/email`

## Common Tasks

### Create an Invoice
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "due_date": "2025-12-31",
    "line_items": [
      {
        "description": "Water Extraction",
        "quantity": 2,
        "rate": 250
      }
    ]
  }'
```

### Download Invoice PDF
```bash
curl http://localhost:3000/api/invoices/1/pdf --output my_invoice.pdf
```

### Email an Invoice
```bash
curl -X POST http://localhost:3000/api/invoices/1/email \
  -H "Content-Type: application/json" \
  -d '{"clientEmail": "client@example.com"}'
```

## File Structure Overview

```
Your Project/
├── server.js          ← Main server (already complete)
├── db.js             ← Create this file (see artifact)
├── package.json      ← Already exists
├── .env              ← Create this (see Step 2)
├── routes/           ← API routes (mostly complete)
│   ├── clients.js
│   ├── invoices.js
│   ├── services.js
│   └── ... (all others)
└── client/
    └── index.html    ← Frontend (create optional)
```

## Troubleshooting

### "Cannot find module './db.js'"
→ Make sure you created the `db.js` file from the artifact provided

### "SMTP connection failed"
→ Check your email password in `.env` file
→ Verify IONOS SMTP is enabled for your account

### "Database locked"
→ Close any other connections to `invoice.db`
→ Restart the server

### Port 3000 already in use
→ Change PORT in `.env` to another port (e.g., 3001)

## Need Help?

- Check the full README.md for detailed documentation
- Review API endpoints in the main documentation
- Contact: m19u3l@sd-bcs.com

---

**You're all set! 🎉**

Your invoice generator is ready to use. Start creating clients, invoices, and generating professional PDFs!
