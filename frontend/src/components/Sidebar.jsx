import React from 'react';
import { SquarePen, Search, PanelLeftClose, PanelRightOpen } from 'lucide-react';

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const canvases = [
    { id: 1, name: 'Brainstorming Session' },
    { id: 2, name: 'Project Architecture' },
    { id: 3, name: 'Marketing Plan' },
  ];

  if (isCollapsed) {
    return (
      <aside className="group/sidebar w-16 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200">
        {/* Logo / Expand Button - Replaces on hover */}
        <div className="relative p-4 flex items-center justify-center">
          {/* Logo - Hidden on hover */}
          <img 
            src="/bnlogo.svg" 
            alt="bn.ai logo" 
            className="w-6 h-6 brightness-0 dark:brightness-0 dark:invert opacity-100 group-hover/sidebar:opacity-0 transition-opacity duration-200" 
          />
          {/* Expand Button - Shown on hover, only covers logo area */}
          <button
            onClick={onToggleCollapse}
            className="absolute flex items-center justify-center w-6 h-6 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200"
            title="Expand sidebar"
          >
            <PanelRightOpen size={16} />
          </button>
        </div>

        {/* Top Section - Icon Only */}
        <div className="px-3 space-y-0.5">
          {/* New Canvas Button */}
          <button className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <SquarePen size={16} className="text-neutral-500 dark:text-neutral-400" />
          </button>

          {/* Search Button */}
          <button className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Search size={16} className="text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200">
      {/* Logo and Collapse Button */}
      <div className="relative p-4">
        <img 
          src="/bnlogo.svg" 
          alt="bn.ai logo" 
          className="w-6 h-6 brightness-0 dark:brightness-0 dark:invert" 
        />
        {/* Collapse Button - Top Right */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-4 right-4 p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Top Section */}
      <div className="px-4 space-y-0.5">
        {/* New Canvas Button */}
        <button className="w-full flex items-center gap-2 py-2 rounded-lg text-base text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <SquarePen size={16} className="text-neutral-500 dark:text-neutral-400" />
          <span>New canvas</span>
        </button>

        {/* Search Button */}
        <button className="w-full flex items-center gap-2 py-2 rounded-lg text-base text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <Search size={16} className="text-neutral-500 dark:text-neutral-400" />
          <span>Search canvases</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-2">
        {/* Saved Canvases Section */}
        <div className="px-4 py-2">
          <div className="text-sm text-neutral-500 dark:text-neutral-500 mb-2">
            Saved canvases
          </div>
          <ul className="space-y-0.5">
            {canvases.map((canvas) => (
              <li key={canvas.id}>
                <button className="w-full py-1.5 rounded-lg text-base text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left">
                  <span className="truncate">{canvas.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

