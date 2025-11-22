import React from 'react';
import { Plus, Trash2, Maximize, Search, Sun, Moon } from 'lucide-react';

export default function Hotbar({ onAddNode, onClear, onFitView, onSearch, onToggleTheme, colorMode }) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-neutral-800 rounded-full shadow-xl border border-neutral-200 dark:border-neutral-700 p-1.5 flex items-center gap-1 z-10 transition-colors duration-200">
      <button
        onClick={onAddNode}
        className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        title="Add Node"
      >
        <Plus size={20} />
      </button>
      
      <button
        onClick={onSearch}
        className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        title="Search Nodes"
      >
        <Search size={20} />
      </button>

      <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={onClear}
        className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        title="Clear Canvas"
      >
        <Trash2 size={20} />
      </button>
      
      <button
        onClick={onFitView}
        className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        title="Fit View"
      >
        <Maximize size={20} />
      </button>

      <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={onToggleTheme}
        className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        title="Toggle Theme"
      >
        {colorMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}
