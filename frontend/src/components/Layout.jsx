import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, onBoardSwitch, currentBoardId, isSidebarCollapsed, onSidebarCollapseChange, colorMode = 'dark' }) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const isCollapsed = isSidebarCollapsed !== undefined ? isSidebarCollapsed : internalCollapsed;
  const handleToggle = () => {
    const newState = !isCollapsed;
    if (isSidebarCollapsed === undefined) {
      setInternalCollapsed(newState);
    }
    if (onSidebarCollapseChange) {
      onSidebarCollapseChange(newState);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleCollapse={handleToggle} 
        onBoardSwitch={onBoardSwitch}
        currentBoardId={currentBoardId}
        colorMode={colorMode}
      />
      <main className="flex-1 relative h-full w-full">
        {children}
      </main>
    </div>
  );
}

