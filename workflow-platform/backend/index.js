// Import the libraries we installed
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Initialize the express app
const app = express();
const port = 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'workflow_db',
  password: 'root', // <-- VERY IMPORTANT: REPLACE WITH YOUR PASSWORD
  port: 5432,
});

// --- API ROUTES ---

// GET all workflows from the database
app.get('/api/workflows', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workflows ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST a new workflow to save it in the database
app.post('/api/workflows', async (req, res) => {
  try {
    const { name, definition } = req.body;
    if (!name || !definition) {
      return res.status(400).json({ error: 'Name and definition are required.' });
    }
    const sql = 'INSERT INTO workflows (name, definition) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(sql, [name, definition]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// =================================================================
// === NEW: INTELLIGENT WORKFLOW EXECUTION ENGINE ===
// =================================================================
app.post('/api/execute/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  let executionId; // To track the execution log entry

  try {
    // 1. Fetch workflow definition
    console.log(`--- [Engine] Starting execution for workflow ${workflowId} ---`);
    const workflowRes = await pool.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
    if (workflowRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found.' });
    }
    const { nodes, edges } = workflowRes.rows[0].definition;

    // 2. Create a new execution record
    const logRes = await pool.query(
      "INSERT INTO executions (workflow_id, status, log) VALUES ($1, 'running', $2) RETURNING id",
      [workflowId, 'Execution started...']
    );
    executionId = logRes.rows[0].id;

    // 3. Prepare for execution by organizing data
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const edgeMap = new Map(edges.map(edge => [edge.source, edge.target]));
    let fullLog = 'Execution started...\n';

    // 4. Find the starting node
    let currentNode = nodes.find(node => node.type === 'input');
    if (!currentNode) {
      throw new Error('Workflow has no "input" (start) node.');
    }

    // 5. Traverse the workflow using the edges
    console.log(`[Engine] Found start node: ${currentNode.id}`);
    while (currentNode) {
      // "Execute" the current node
      const nodeLog = `[Step] Executing Node ID: ${currentNode.id}, Label: ${currentNode.data.label}`;
      console.log(nodeLog);
      fullLog += `${nodeLog}\n`;

      // Find the next node by looking for an edge starting from the current node
      const nextNodeId = edgeMap.get(currentNode.id);
      
      if (nextNodeId) {
        currentNode = nodeMap.get(nextNodeId);
        if (!currentNode) throw new Error(`Workflow is broken. Edge points to non-existent node ID: ${nextNodeId}`);
        console.log(`[Engine] Moving to next node: ${currentNode.id}`);
      } else {
        // If there's no outgoing edge, we've reached the end of this path
        console.log('[Engine] Reached end of path.');
        currentNode = null;
      }
    }

    // 6. Finalize execution
    fullLog += 'Execution finished successfully.';
    console.log(`--- [Engine] Finished execution for workflow ${workflowId} ---`);
    await pool.query(
      "UPDATE executions SET status = 'completed', ended_at = CURRENT_TIMESTAMP, log = $1 WHERE id = $2",
      [fullLog, executionId]
    );

    res.status(200).json({ message: 'Workflow executed successfully.', executionId });

  } catch (error) {
    console.error(`[Engine] CRITICAL ERROR during execution for workflow ${workflowId}:`, error);
    // If an error occurs, update the log with a 'failed' status
    if (executionId) {
      const errorLog = `Execution failed: ${error.message}`;
      await pool.query(
        "UPDATE executions SET status = 'failed', ended_at = CURRENT_TIMESTAMP, log = log || '\n' || $1 WHERE id = $2",
        [errorLog, executionId]
      );
    }
    res.status(500).json({ error: 'Internal Server Error during execution.' });
  }
});
// =================================================================
// === END OF WORKFLOW EXECUTION ENGINE ===
// =================================================================


// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});