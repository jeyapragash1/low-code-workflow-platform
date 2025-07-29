// frontend/src/App.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlowProvider
} from 'reactflow';
import axios from 'axios';
import Sidebar from './Sidebar';
import Auth from './Auth';
import SettingsPanel from './SettingsPanel';
import SlackNode from './SlackNode';
import ExecutionHistory from './ExecutionHistory'; // <-- IMPORT THE NEW COMPONENT

import 'reactflow/dist/style.css';
import './App.css';

const API_URL = 'http://localhost:5000/api';
let id = 0;
const getNextId = () => `dnd-node_${id++}`;

const nodeTypes = {
  slack: SlackNode,
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
          <button onClick={handleLogout} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1001, cursor: 'pointer', padding: '8px 12px' }}>Logout</button>
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
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [saveError, setSaveError] = useState('');
  
  // --- NEW: State to manage the Execution History modal ---
  const [historyWorkflow, setHistoryWorkflow] = useState(null);

  const onNodeClick = useCallback((event, node) => { setSelectedNode(node); setSaveError(''); }, []);
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node));
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
    axios.get(`${API_URL}/workflows`).then(response => setWorkflows(response.data));
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const saveWorkflow = async () => {
    if (!workflowName.trim()) { setSaveError('Please enter a name for the workflow.'); return; }
    try {
      await axios.post(`${API_URL}/workflows`, { name: workflowName, definition: { nodes, edges } });
      alert(`Workflow "${workflowName}" saved successfully!`);
      setWorkflowName(''); setSaveError(''); setNodes([]); setEdges([]); setSelectedNode(null);
      fetchWorkflows();
    } catch (error) { setSaveError('Failed to save workflow.'); }
  };

  const runWorkflow = async (workflowId, name) => {
    try {
      await axios.post(`${API_URL}/execute/${workflowId}`);
      alert(`Execution started for "${name}"!`);
      // Optional: auto-refresh history if it's open
      if(historyWorkflow && historyWorkflow.id === workflowId) {
        setHistoryWorkflow(null); // Close and re-open to refresh
        setTimeout(() => setHistoryWorkflow({ id: workflowId, name }), 100);
      }
    } catch (error) { alert('Failed to execute workflow.'); }
  };

  return (
    <>
      {/* --- NEW: Render the history modal if a workflow is selected --- */}
      {historyWorkflow && (
        <ExecutionHistory 
          workflow={historyWorkflow} 
          onClose={() => setHistoryWorkflow(null)} 
        />
      )}

      <div className="app-container">
        <header className="header"><h1>My Workflow Dashboard</h1></header>
        <div className="main-content">
          <Sidebar />
          <div className="designer-container">
            <div className="designer-header">
              <h2>Saved Workflows</h2>
              {workflows.map(wf => (
                <div key={wf.id} style={{ marginBottom: '10px', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>{wf.name}</span>
                  <button onClick={() => runWorkflow(wf.id, wf.name)} style={{ marginLeft: '10px' }}>▶️ Run</button>
                  {/* --- NEW: History Button --- */}
                  <button onClick={() => setHistoryWorkflow(wf)} style={{ marginLeft: '5px' }}>📜 History</button>
                </div>
              ))}
            </div>
            <div className="designer-controls">
              <h3>Create New Workflow</h3>
              <input type="text" value={workflowName} onChange={(e) => { setWorkflowName(e.target.value); if (saveError) setSaveError(''); }} placeholder="Enter New Workflow Name" />
              <button onClick={saveWorkflow}>Save Current Design</button>
              {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
            </div>
            <div className="designer-canvas">
              <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} onNodeClick={onNodeClick} fitView>
                <Controls /><Background />
              </ReactFlow>
            </div>
          </div>
          <SettingsPanel nodeData={selectedNode} setNodeData={updateNodeData} />
        </div>
      </div>
    </>
  );
};

export default App;