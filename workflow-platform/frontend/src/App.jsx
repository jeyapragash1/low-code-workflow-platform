// Import React tools, React Flow, and other components/libraries
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  ReactFlowProvider, // Provider is needed for hooks like useReactFlow
} from 'reactflow';
import axios from 'axios';
import Sidebar from './Sidebar'; // Import our new Sidebar component

// Import our new CSS files
import 'reactflow/dist/style.css';
import './App.css';

const API_URL = 'http://localhost:5000/api';
let id = 0; // Simple ID counter for new nodes
const getNextId = () => `dnd-node_${id++}`;

// The main App component is now wrapped in ReactFlowProvider
const App = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
};

const WorkflowEditor = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // State for saved workflows and the current workflow name
  const [workflows, setWorkflows] = useState([]);
  const [workflowName, setWorkflowName] = useState('');

  // --- React Flow handlers ---
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  
  // Handlers for drag-and-drop from sidebar
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: getNextId(),
        type,
        position,
        data: { label: `${type} node` },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );
  
  // --- API Functions ---
  const fetchWorkflows = () => {
    axios.get(`${API_URL}/workflows`)
      .then(response => setWorkflows(response.data))
      .catch(error => console.error('Error fetching workflows:', error));
  };

  useEffect(() => { fetchWorkflows(); }, []); // Fetch on initial load

  const saveWorkflow = async () => {
    if (!workflowName) {
      alert('Please enter a name for the workflow.');
      return;
    }
    const definition = { nodes, edges };
    try {
      await axios.post(`${API_URL}/workflows`, { name: workflowName, definition });
      alert(`Workflow "${workflowName}" saved successfully!`);
      fetchWorkflows(); // Refresh list
    } catch (error) {
      alert('Failed to save workflow.');
    }
  };

  const runWorkflow = async (workflowId, name) => {
    try {
      await axios.post(`${API_URL}/execute/${workflowId}`);
      alert(`Execution started for "${name}"! Check backend console for logs.`);
    } catch (error) {
      alert('Failed to execute workflow.');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Low-Code Workflow Platform</h1>
      </header>
      
      {/* List of saved workflows */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #eee' }}>
        <h2>Saved Workflows</h2>
        {workflows.map(wf => (
          <div key={wf.id}>
            {wf.name} <button onClick={() => runWorkflow(wf.id, wf.name)}>▶️ Run</button>
          </div>
        ))}
      </div>

      {/* Main content area with sidebar and designer */}
      <div className="main-content">
        <Sidebar />
        <div className="designer-container" ref={reactFlowWrapper}>
          <div className="designer-controls">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter Workflow Name"
            />
            <button onClick={saveWorkflow} style={{ marginLeft: '10px' }}>Save Current Design</button>
          </div>
          <div className="designer-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;