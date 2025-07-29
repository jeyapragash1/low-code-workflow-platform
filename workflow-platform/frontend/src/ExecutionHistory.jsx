// frontend/src/ExecutionHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ExecutionHistory = ({ workflow, onClose }) => {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the execution history when the component mounts
    axios.get(`${API_URL}/workflows/${workflow.id}/executions`)
      .then(response => {
        setExecutions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching execution history:', error);
        setLoading(false);
      });
  }, [workflow.id]); // Re-run if the workflow ID changes

  return (
    // This div acts as a modal overlay
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0, 0, 0, 0.5)', zIndex: 1001, display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', padding: '20px', borderRadius: '8px',
        width: '80%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Execution History for: {workflow.name}</h2>
          <button onClick={onClose} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ flexGrow: 1, display: 'flex', gap: '20px', overflow: 'hidden', marginTop: '10px' }}>
          {/* Left Panel: List of Executions */}
          <div style={{ width: '40%', borderRight: '1px solid #eee', overflowY: 'auto', paddingRight: '10px' }}>
            {loading ? <p>Loading history...</p> : (
              executions.length === 0 ? <p>No executions found.</p> : (
                executions.map(exec => (
                  <div
                    key={exec.id}
                    onClick={() => setSelectedExecution(exec)}
                    style={{
                      padding: '10px',
                      marginBottom: '5px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: selectedExecution?.id === exec.id ? '#e0f7fa' : '#f9f9f9',
                      border: `2px solid ${exec.status === 'completed' ? '#4caf50' : '#f44336'}`
                    }}
                  >
                    <strong>Status: {exec.status}</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '12px' }}>
                      {new Date(exec.started_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )
            )}
          </div>

          {/* Right Panel: Selected Execution Log */}
          <div style={{ width: '60%', overflowY: 'auto' }}>
            <h3>Execution Log</h3>
            {selectedExecution ? (
              <pre style={{
                background: '#2d2d2d', color: '#f8f8f2', padding: '15px',
                borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
              }}>
                {selectedExecution.log}
              </pre>
            ) : (
              <p>Select an execution from the left to see its log.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionHistory;