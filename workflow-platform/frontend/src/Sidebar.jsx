// frontend/src/Sidebar.jsx
import React from 'react';

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="sidebar">
      <h2>Nodes Menu</h2>
      <p className="description">Drag these nodes to the canvas on the right.</p>

      <div className="node-item" onDragStart={(event) => onDragStart(event, 'input')} draggable>Input Node</div>
      <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>Default Node</div>
      
      {/* --- NEW: Draggable Slack Node --- */}
      <div className="node-item" style={{borderColor: '#4A154B', color: '#4A154B'}} onDragStart={(event) => onDragStart(event, 'slack')} draggable>
        Send Slack Message
      </div>

      <div className="node-item" onDragStart={(event) => onDragStart(event, 'output')} draggable>Output Node</div>
    </aside>
  );
};

export default Sidebar;