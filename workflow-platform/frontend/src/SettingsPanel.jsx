// frontend/src/SettingsPanel.jsx
import React from 'react';

const SettingsPanel = ({ nodeData, setNodeData }) => {
  if (!nodeData) {
    return <aside className="sidebar settings-panel"><h2>Settings</h2><p className="description">Click on a node to see its properties.</p></aside>;
  }

  // Generic handler for any data field change
  const onDataChange = (field, value) => {
    setNodeData(nodeData.id, { ...nodeData.data, [field]: value });
  };

  return (
    <aside className="sidebar settings-panel">
      <h2>Node Settings: {nodeData.type}</h2>
      <div>
        <label>Label:</label>
        <input type="text" value={nodeData.data.label || ''} onChange={(e) => onDataChange('label', e.target.value)} style={{ width: '100%' }} />
      </div>
      
      {/* --- NEW: Conditional fields for Slack node --- */}
      {nodeData.type === 'slack' && (
        <>
          <div>
            <label>Slack Webhook URL:</label>
            <input type="text" value={nodeData.data.webhookUrl || ''} onChange={(e) => onDataChange('webhookUrl', e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label>Message:</label>
            <textarea value={nodeData.data.message || ''} onChange={(e) => onDataChange('message', e.target.value)} style={{ width: '100%' }} rows="4"></textarea>
          </div>
        </>
      )}
    </aside>
  );
};

export default SettingsPanel;