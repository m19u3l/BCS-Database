import express from 'express';
import bodyParser from 'body-parser';
// Assuming your db.js exports an initializeDatabase function
import { initializeDatabase } from './db.js'; 

// --- Import Routers from their respective paths ---
// This handles price list creation, updating, and deactivation (CRUD)
import priceListRouter from './routes/price-list.js'; 
// This handles price list viewing, searching, and quote calculation (Your new file)
import pricingRouter from './routes/pricing.js';     

const app = express();
const PORT = 3000;

// Middleware Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Mount Routers to their API endpoints ---
// Mounts the CRUD router at /api/price-list
app.use('/api/price-list', priceListRouter); 
// Mounts the Pricing/Quote router at /api/pricing
app.use('/api/pricing', pricingRouter);     


// Default Route
app.get('/', (req, res) => {
    res.send('BCS Estimation API is Running');
});

// Start the server and initialize the database
async function startServer() {
    try {
        // Initialize the database connection and schema
        // Note: You must ensure your db.js file exports an async function named initializeDatabase
        await initializeDatabase();
        console.log('Database initialized successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the application
startServer();
