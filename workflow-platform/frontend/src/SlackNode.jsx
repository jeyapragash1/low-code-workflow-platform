// frontend/src/SlackNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

// This is the visual component for our custom Slack node.
const SlackNode = ({ data }) => {
  return (
    <div style={{
      border: '2px solid #4A154B',
      padding: '10px 15px',
      borderRadius: '5px',
      background: 'white',
      width: 150,
    }}>
      {/* Handles are the connection points for edges. */}
      <Handle type="target" position={Position.Top} />
      <div>
        <strong>Send to Slack</strong>
        <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#666' }}>{data.label || 'slack node'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default SlackNode;