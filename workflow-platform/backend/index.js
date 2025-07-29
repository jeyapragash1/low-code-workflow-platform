// backend/index.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const axios = require('axios'); // Import axios for the backend
const authenticateToken = require('./authMiddleware');

const app = express();
const port = 5000;
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'workflow_db',
  password: 'root', // Remember to replace this!
  port: 5432,
});

// =================================================================
// === AUTHENTICATION ROUTES (Complete and Correct) ===
// =================================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, role',
      [username, passwordHash]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Username may already be taken.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// =================================================================
// === WORKFLOW MANAGEMENT ROUTES (Complete and Correct) ===
// =================================================================

app.get('/api/workflows', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workflows WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/workflows', authenticateToken, async (req, res) => {
  try {
    const { name, definition } = req.body;
    const userId = req.user.id;
    if (!name || !definition) {
      return res.status(400).json({ error: 'Name and definition are required.' });
    }
    const sql = 'INSERT INTO workflows (name, definition, user_id) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(sql, [name, definition, userId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// =================================================================
// === UPGRADED WORKFLOW EXECUTION ENGINE (Complete and Correct) ===
// =================================================================
app.post('/api/execute/:workflowId', authenticateToken, async (req, res) => {
  const { workflowId } = req.params;
  const userId = req.user.id;
  let executionId;

  try {
    const workflowRes = await pool.query('SELECT * FROM workflows WHERE id = $1 AND user_id = $2', [workflowId, userId]);
    if (workflowRes.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { nodes, edges } = workflowRes.rows[0].definition;
    const logRes = await pool.query("INSERT INTO executions (workflow_id, status, log) VALUES ($1, 'running', $2) RETURNING id", [workflowId, 'Execution started...']);
    executionId = logRes.rows[0].id;

    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const edgeMap = new Map(edges.map(edge => [edge.source, edge.target]));
    let fullLog = 'Execution started...\n';
    let currentNode = nodes.find(node => node.type === 'input');
    if (!currentNode) throw new Error('Workflow has no "input" (start) node.');

    while (currentNode) {
      const nodeLog = `[Step] Executing Node ID: ${currentNode.id}, Type: ${currentNode.type}`;
      console.log(nodeLog);
      fullLog += `${nodeLog}\n`;

      switch (currentNode.type) {
        case 'slack':
          const webhookUrl = currentNode.data.webhookUrl;
          const message = currentNode.data.message;
          if (webhookUrl && message) {
            try {
              console.log(`[Integration] Sending message to Slack: "${message}"`);
              fullLog += `  - Sending message to Slack: "${message}"\n`;
              await axios.post(webhookUrl, { text: message });
            } catch (integrationError) {
              console.error('[Integration] Slack API call failed:', integrationError.message);
              fullLog += `  - ERROR: Slack integration failed. ${integrationError.message}\n`;
            }
          } else {
            fullLog += `  - WARNING: Slack node is not configured correctly.\n`;
          }
          break;
        default:
          console.log(`[Step] Standard node. No special action.`);
          fullLog += `  - Standard node. No special action.\n`;
          break;
      }

      const nextNodeId = edgeMap.get(currentNode.id);
      currentNode = nextNodeId ? nodeMap.get(nextNodeId) : null;
    }

    fullLog += 'Execution finished successfully.';
    await pool.query("UPDATE executions SET status = 'completed', ended_at = CURRENT_TIMESTAMP, log = $1 WHERE id = $2", [fullLog, executionId]);
    res.status(200).json({ message: 'Workflow executed successfully.', executionId });
  } catch (error) {
    console.error(`[Engine] CRITICAL ERROR for workflow ${workflowId}:`, error);
    if (executionId) {
      await pool.query("UPDATE executions SET status = 'failed', ended_at = CURRENT_TIMESTAMP, log = log || '\nError: ' || $1 WHERE id = $2", [error.message, executionId]);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:5000`);
});