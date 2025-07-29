// Import the libraries we installed
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Initialize the express app
const app = express();
const port = 5000;

// --- MIDDLEWARE ---
// Enable CORS for all routes
app.use(cors());
// Allow our app to understand JSON
app.use(express.json());

// --- DATABASE CONNECTION ---
// Create a new pool of connections to the database
const pool = new Pool({
  user: 'postgres', // default user
  host: 'localhost',
  database: 'workflow_db',
  password: 'root', // <-- VERY IMPORTANT: REPLACE WITH YOUR PASSWORD
  port: 5432, // default port
});

// --- API ROUTES ---
// A simple test route to make sure the server is running
app.get('/', (req, res) => {
  res.send('Hello from the Workflow Automation Backend!');
});

// The endpoint to create/save a new workflow
app.post('/api/workflows', async (req, res) => {
  try {
    // Get the name and definition from the request body
    const { name, definition } = req.body;

    // A simple validation
    if (!name || !definition) {
      return res.status(400).json({ error: 'Name and definition are required.' });
    }

    // The SQL query to insert a new workflow into our table
    const sql = 'INSERT INTO workflows (name, definition) VALUES ($1, $2) RETURNING *';
    const values = [name, definition];

    // Execute the query
    const result = await pool.query(sql, values);

    // Send the newly created workflow back as a success response
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});