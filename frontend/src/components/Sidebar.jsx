import React from 'react';

export default function Sidebar() {
  const canvases = [
    { id: 1, name: 'Brainstorming Session' },
    { id: 2, name: 'Project Architecture' },
    { id: 3, name: 'Marketing Plan' },
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">bn.ai</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
          Saved Canvases
        </div>
        <ul className="space-y-1">
          {canvases.map((canvas) => (
            <li key={canvas.id}>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {canvas.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          New Canvas
        </button>
      </div>
    </aside>
  );
}

