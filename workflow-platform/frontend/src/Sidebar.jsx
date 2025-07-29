import React from 'react';

// This component represents our sidebar with draggable nodes
const Sidebar = () => {
  // This function is called when a drag operation starts
  const onDragStart = (event, nodeType) => {
    // We store the nodeType in the event's dataTransfer object
    // This allows us to access it in the onDrop event in the main App component
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="sidebar">
      <h2>Nodes Menu</h2>
      <p className="description">Drag these nodes to the canvas on the right.</p>

      {/* A draggable element for the 'input' node type */}
      <div
        className="node-item"
        onDragStart={(event) => onDragStart(event, 'input')}
        draggable
      >
        Input Node
      </div>

      {/* A draggable element for the 'default' node type */}
      <div
        className="node-item"
        onDragStart={(event) => onDragStart(event, 'default')}
        draggable
      >
        Default Node
      </div>

      {/* A draggable element for the 'output' node type */}
      <div
        className="node-item"
        onDragStart={(event) => onDragStart(event, 'output')}
        draggable
      >
        Output Node
      </div>
    </aside>
  );
};

export default Sidebar;