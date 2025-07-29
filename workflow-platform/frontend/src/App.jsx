// frontend/src/App.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlowProvider
} from 'reactflow';
import axios from 'axios';
import Sidebar from './Sidebar';
import Auth from './Auth';
import SettingsPanel from './SettingsPanel';
import SlackNode from './SlackNode'; // <-- IMPORT THE NEW CUSTOM NODE

import 'reactflow/dist/style.css';
import './App.css';

const API_URL = 'http://localhost:5000/api';
let id = 0;
const getNextId = () => `dnd-node_${id++}`;

// --- NEW: Define our custom node types ---
// The useMemo hook prevents this object from being recreated on every render.
const nodeTypes = {
  slack: SlackNode, // When React Flow sees a node with type 'slack', it will render our SlackNode component.
};


const App = () => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
  
  return (
    <div>
      {token ? (
        <>
          <button onClick={handleLogout} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, cursor: 'pointer', padding: '8px 12px' }}>Logout</button>
          <ReactFlowProvider>
            <WorkflowEditor />
          </ReactFlowProvider>
        </>
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

const WorkflowEditor = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [saveError, setSaveError] = useState('');

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSaveError('');
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
  }, [setNodes]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = { id: getNextId(), type, position, data: { label: `${type} node` } };
      setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance]
  );
  
  const fetchWorkflows = () => {
    axios.get(`${API_URL}/workflows`)
      .then(response => setWorkflows(response.data))
      .catch(error => console.error('Error fetching workflows:', error.response?.data || error.message));
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      setSaveError('Please enter a name for the workflow.');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/workflows`, { name: workflowName, definition: { nodes, edges } });
      alert(`Workflow "${workflowName}" saved successfully!`);
      setWorkflowName('');
      setSaveError('');
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      fetchWorkflows();
    } catch (error) { 
        console.error('Save error:', error);
        setSaveError('Failed to save workflow. See console for details.');
    }
  };

  const runWorkflow = async (workflowId, name) => {
    try {
      await axios.post(`${API_URL}/execute/${workflowId}`);
      alert(`Execution started for "${name}"! Check backend console for logs.`);
    } catch (error) {
        console.error('Run error:', error);
        alert('Failed to execute workflow.');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>My Workflow Dashboard</h1>
      </header>
      
      <div className="main-content">
        <Sidebar />
        
        <div className="designer-container" ref={reactFlowWrapper}>
          <div className="designer-header">
            <h2>Saved Workflows</h2>
            {workflows.length > 0 ? workflows.map(wf => (
              <div key={wf.id} style={{ marginBottom: '10px', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>{wf.name}</span>
                <button onClick={() => runWorkflow(wf.id, wf.name)} style={{ marginLeft: '10px', cursor: 'pointer' }}>▶️ Run</button>
              </div>
            )) : <p>No workflows found. Create one below!</p>}
          </div>

          <div className="designer-controls">
             <h3>Create New Workflow</h3>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => {
                  setWorkflowName(e.target.value);
                  if (saveError) setSaveError('');
              }}
              placeholder="Enter New Workflow Name"
              style={{ padding: '8px' }}
            />
            <button 
              onClick={saveWorkflow}
              style={{ 
                marginLeft: '10px', 
                cursor: 'pointer', 
                padding: '8px 12px'
              }}
            >
              Save Current Design
            </button>
            {saveError && <p style={{ color: 'red', marginTop: '5px' }}>{saveError}</p>}
          </div>
          
          <div className="designer-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes} // <-- REGISTER THE CUSTOM NODE TYPES
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
        
        <SettingsPanel 
          nodeData={selectedNode} 
          setNodeData={updateNodeData} 
        />
      </div>
    </div>
  );
};

export default App;