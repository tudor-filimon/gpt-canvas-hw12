import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { boardAPI } from '../utils/api';

export default function SearchBoardsModal({ isOpen, onClose, onBoardSwitch, onCreateBoard, currentBoardId, colorMode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [boards, setBoards] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Fetch boards
  useEffect(() => {
    if (isOpen) {
      const fetchBoards = async () => {
        try {
          const data = await boardAPI.getBoards();
          setBoards(data);
        } catch (error) {
          console.error('Error fetching boards:', error);
        }
      };
      fetchBoards();
    }
  }, [isOpen]);

  // Filter boards based on search query
  const filteredBoards = boards.filter((board) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (board.name || '').toLowerCase();
    return name.includes(query);
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredBoards.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      // Enter to select
      if (e.key === 'Enter' && filteredBoards.length > 0 && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectBoard(filteredBoards[selectedIndex]);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredBoards, selectedIndex, onClose]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectBoard = useCallback((board) => {
    if (board && onBoardSwitch) {
      onBoardSwitch(board.id);
      onClose();
    }
  }, [onBoardSwitch, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute inset-0 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <SearchIcon size={20} className="text-neutral-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards..."
              className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none text-base"
            />
          </div>

          {/* Results */}
          {filteredBoards.length > 0 ? (
            <div 
              ref={resultsRef}
              className="max-h-96 overflow-y-auto"
            >
              <ul className="py-2">
                {filteredBoards.map((board, index) => (
                  <li
                    key={board.id}
                    onClick={() => handleSelectBoard(board)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-neutral-100 dark:bg-neutral-700'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {board.name}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : searchQuery.trim() ? (
            <div className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
              No boards found
            </div>
          ) : null}

          {/* Keyboard Shortcuts */}
          <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">⌘</kbd> F Search</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">↑</kbd><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded ml-0.5">↓</kbd> Navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">Enter</kbd> Select</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

