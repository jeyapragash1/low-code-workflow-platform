// frontend/src/ExecutionHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ExecutionHistory = ({ workflow, onClose }) => {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/workflows/${workflow.id}/executions`)
      .then(response => {
        setExecutions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching execution history:', error);
        setLoading(false);
      });
  }, [workflow.id]);

  return (
    <div className="history-modal-overlay">
      <div className="history-modal-content">
        <div className="history-modal-header">
          <h2>History: {workflow.name}</h2>
          <button onClick={onClose} className="history-modal-close-btn">×</button>
        </div>

        <div className="history-modal-body">
          {/* Left Panel: List of Executions */}
          <div className="history-list-panel">
            {loading ? <p>Loading history...</p> : (
              executions.length === 0 ? <p>No executions found.</p> : (
                executions.map(exec => {
                  const itemClasses = [
                    'history-item',
                    exec.status, // e.g., 'completed', 'failed'
                    selectedExecution?.id === exec.id ? 'selected' : ''
                  ].join(' ');

                  return (
                    <div
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      className={itemClasses}
                    >
                      <strong>Status: {exec.status}</strong>
                      <p>{new Date(exec.started_at).toLocaleString()}</p>
                    </div>
                  );
                })
              )
            )}
          </div>

          {/* Right Panel: Selected Execution Log */}
          <div className="history-log-panel">
            <h3>Execution Log</h3>
            {selectedExecution ? (
              <pre className="history-log-box">
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