import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, onBoardSwitch }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        onBoardSwitch={onBoardSwitch}
      />
      <main className="flex-1 relative h-full w-full">
        {children}
      </main>
    </div>
  );
}

