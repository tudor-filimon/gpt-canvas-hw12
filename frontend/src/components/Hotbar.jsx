import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Maximize, Search, Sun, Moon, Undo2, Redo2, AlertTriangle } from 'lucide-react';

export default function Hotbar({ onAddNode, onClear, onFitView, onSearch, onToggleTheme, onUndo, onRedo, canUndo, canRedo, colorMode }) {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Reset confirmation state after 3 seconds if user doesn't click again
  useEffect(() => {
    if (isConfirmingClear) {
      const timer = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingClear]);

  const handleClearClick = () => {
    if (isConfirmingClear) {
      // Second click - actually clear
      onClear();
      setIsConfirmingClear(false);
    } else {
      // First click - show confirmation
      setIsConfirmingClear(true);
    }
  };

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
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-full transition-colors ${
          canUndo 
            ? 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700' 
            : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed opacity-50'
        }`}
        title="Undo (⌘Z)"
      >
        <Undo2 size={20} />
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-full transition-colors ${
          canRedo 
            ? 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700' 
            : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed opacity-50'
        }`}
        title="Redo (⌘Y)"
      >
        <Redo2 size={20} />
      </button>

      <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={handleClearClick}
        className={`p-2 rounded-full transition-colors relative ${
          isConfirmingClear
            ? 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
        title={isConfirmingClear ? "Click again to confirm clear" : "Clear Canvas"}
      >
        {isConfirmingClear ? (
          <AlertTriangle size={20} />
        ) : (
          <Trash2 size={20} />
        )}
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
