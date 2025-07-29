// Import necessary tools from React and React Flow
import { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';
import axios from 'axios'; // For making API calls

// We need to import the React Flow CSS for it to work
import 'reactflow/dist/style.css';

// Define the initial nodes for our workflow
const initialNodes = [
  {
    id: '1',
    type: 'input', // Special type for start nodes
    data: { label: 'Start Workflow' },
    position: { x: 250, y: 5 },
  },
];

function App() {
  // State to hold our nodes and edges (the lines connecting nodes)
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [workflowName, setWorkflowName] = useState('My New Workflow');

  // These functions are called by React Flow when you drag nodes or create edges
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // --- Our custom functions ---

  // Function to add a new node to the canvas
  const addNode = () => {
    const newNode = {
      id: `${nodes.length + 1}`, // Generate a simple unique ID
      data: { label: `New Node ${nodes.length + 1}` },
      position: {
        x: Math.random() * 400, // Place it randomly
        y: Math.random() * 400,
      },
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
  };

  // Function to save the workflow
  const saveWorkflow = async () => {
    if (!workflowName) {
      alert('Please enter a name for the workflow.');
      return;
    }

    // Create the workflow definition object as designed in our plan
    const workflowDefinition = {
      nodes: nodes,
      edges: edges,
    };

    try {
      // Use axios to send a POST request to our backend
      const response = await axios.post('http://localhost:5000/api/workflows', {
        name: workflowName,
        definition: workflowDefinition,
      });
      alert(`Workflow "${response.data.name}" saved successfully!`);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Error: Could not save the workflow. Check the console for details.');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1>Low-Code Workflow Designer</h1>

      {/* --- Control Panel --- */}
      <div style={{ padding: '10px' }}>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Enter Workflow Name"
          style={{ marginRight: '10px' }}
        />
        <button onClick={addNode} style={{ marginRight: '10px' }}>
          Add Node
        </button>
        <button onClick={saveWorkflow}>Save Workflow</button>
      </div>

      {/* --- The Workflow Canvas --- */}
      <div style={{ width: '100%', height: '80%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;