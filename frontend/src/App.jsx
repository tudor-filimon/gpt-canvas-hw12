import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { boardAPI, nodeAPI, edgeAPI } from './utils/api'; // ********** NEW CODE HERE **********

import ChatNode from './components/ChatNode.jsx';
import Layout from './components/Layout.jsx';
import Hotbar from './components/Hotbar.jsx';
import SearchModal from './components/SearchModal.jsx';

const nodeTypes = { chat: ChatNode };

function Flow() {
  // Define handlers first so we can pass them to initial state if needed, 
  // but typically we inject them via effects or map over state.
  
  const { fitView, getNode, getViewport, setCenter } = useReactFlow();
  const [edges, setEdges] = useState([]);
  const [colorMode, setColorMode] = useState('dark');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Undo/Redo history
  const [history, setHistory] = useState([{ nodes: [], edges: [] }]); // Initial state
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Refs to track latest state for history (avoid stale closures)
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const saveTimeoutRef = useRef(null);
  const isRestoringHistoryRef = useRef(false);
  const historyIndexRef = useRef(0);
  const isAddingConnectedNodeRef = useRef(false); // Flag to prevent duplicate history saves
  const isAddingFloatingNodeRef = useRef(false); // Flag to prevent duplicate history saves for floating nodes

  // ********** NEW CODE HERE **********
  const [boardId, setBoardId] = useState('board-001'); // Default board ID. First one it opens when website opens
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentBoardName, setCurrentBoardName] = useState(null);  

  // Node dimensions (approximate)
  const NODE_WIDTH = 400;
  const NODE_HEIGHT = 200;
  const PADDING = 50; // Minimum space between nodes

  // Check if a position collides with existing nodes
  const checkCollision = useCallback((position, allNodes, excludeId = null) => {
    const nodeBounds = {
      x: position.x,
      y: position.y,
      width: NODE_WIDTH + PADDING,
      height: NODE_HEIGHT + PADDING,
    };

    return allNodes.some((node) => {
      if (excludeId && node.id === excludeId) return false;
      const existingBounds = {
        x: node.position.x,
        y: node.position.y,
        width: NODE_WIDTH + PADDING,
        height: NODE_HEIGHT + PADDING,
      };

      return !(
        nodeBounds.x + nodeBounds.width < existingBounds.x ||
        nodeBounds.x > existingBounds.x + existingBounds.width ||
        nodeBounds.y + nodeBounds.height < existingBounds.y ||
        nodeBounds.y > existingBounds.y + existingBounds.height
      );
    });
  }, []);

  // Find nearest empty space using spiral search
  const findEmptySpace = useCallback((startPosition, allNodes, maxAttempts = 20) => {
    const step = 100;
    let attempts = 0;
    
    // Try the start position first
    if (!checkCollision(startPosition, allNodes)) {
      return startPosition;
    }

    // Spiral outward from start position
    for (let radius = step; radius <= step * maxAttempts; radius += step) {
      const positions = [
        { x: startPosition.x + radius, y: startPosition.y }, // Right
        { x: startPosition.x - radius, y: startPosition.y }, // Left
        { x: startPosition.x, y: startPosition.y + radius }, // Bottom
        { x: startPosition.x, y: startPosition.y - radius }, // Top
        { x: startPosition.x + radius, y: startPosition.y + radius }, // Bottom-right
        { x: startPosition.x - radius, y: startPosition.y - radius }, // Top-left
        { x: startPosition.x + radius, y: startPosition.y - radius }, // Top-right
        { x: startPosition.x - radius, y: startPosition.y + radius }, // Bottom-left
      ];

      for (const pos of positions) {
        if (!checkCollision(pos, allNodes)) {
          return pos;
        }
        attempts++;
        if (attempts >= maxAttempts) break;
      }
      if (attempts >= maxAttempts) break;
    }

    // Fallback: return a position far from all nodes
    if (allNodes.length === 0) return startPosition;
    
    const maxX = Math.max(...allNodes.map(n => n.position.x)) + NODE_WIDTH + PADDING;
    const maxY = Math.max(...allNodes.map(n => n.position.y)) + NODE_HEIGHT + PADDING;
    return { x: maxX, y: maxY };
  }, [checkCollision]);

  // Find the side with the most available space around a reference point
  const findSideWithMostSpace = useCallback((referencePosition, allNodes) => {
    const offset = NODE_WIDTH + PADDING; // Distance to place node from reference
    
    // referencePosition is the center of the reference node
    // Calculate positions for each side (top-left corner of new node)
    const sides = [
      { 
        position: { x: referencePosition.x - NODE_WIDTH / 2, y: referencePosition.y - NODE_HEIGHT - offset }, 
        name: 'top',
        availableSpace: Infinity,
        priority: 2 // Lower priority for vertical
      },
      { 
        position: { x: referencePosition.x - NODE_WIDTH / 2, y: referencePosition.y + offset }, 
        name: 'bottom',
        availableSpace: Infinity,
        priority: 2 // Lower priority for vertical
      },
      { 
        position: { x: referencePosition.x - NODE_WIDTH - offset, y: referencePosition.y - NODE_HEIGHT / 2 }, 
        name: 'left',
        availableSpace: Infinity,
        priority: 1 // Higher priority for horizontal
      },
      { 
        position: { x: referencePosition.x + offset, y: referencePosition.y - NODE_HEIGHT / 2 }, 
        name: 'right',
        availableSpace: Infinity,
        priority: 1 // Higher priority for horizontal
      },
    ];
    
    // Calculate available space for each side
    for (const side of sides) {
      // First check if the position itself is collision-free
      if (checkCollision(side.position, allNodes)) {
        side.availableSpace = 0;
        continue;
      }
      
      // Calculate distance to nearest node in that direction
      let minDistance = Infinity;
      
      for (const node of allNodes) {
        const nodeLeft = node.position.x;
        const nodeRight = node.position.x + (node.width || NODE_WIDTH);
        const nodeTop = node.position.y;
        const nodeBottom = node.position.y + (node.height || NODE_HEIGHT);
        
        const sideLeft = side.position.x;
        const sideRight = side.position.x + NODE_WIDTH;
        const sideTop = side.position.y;
        const sideBottom = side.position.y + NODE_HEIGHT;
        
        let distance = Infinity;
        
        if (side.name === 'top') {
          // Check if node overlaps horizontally and is above
          if (!(nodeRight < sideLeft || nodeLeft > sideRight)) {
            if (nodeBottom <= sideTop) {
              distance = sideTop - nodeBottom;
            }
          }
        } else if (side.name === 'bottom') {
          // Check if node overlaps horizontally and is below
          if (!(nodeRight < sideLeft || nodeLeft > sideRight)) {
            if (nodeTop >= sideBottom) {
              distance = nodeTop - sideBottom;
            }
          }
        } else if (side.name === 'left') {
          // Check if node overlaps vertically and is to the left
          if (!(nodeBottom < sideTop || nodeTop > sideBottom)) {
            if (nodeRight <= sideLeft) {
              distance = sideLeft - nodeRight;
            }
          }
        } else if (side.name === 'right') {
          // Check if node overlaps vertically and is to the right
          if (!(nodeBottom < sideTop || nodeTop > sideBottom)) {
            if (nodeLeft >= sideRight) {
              distance = nodeLeft - sideRight;
            }
          }
        }
        
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
      
      // If no nodes in that direction, set to a large value
      side.availableSpace = minDistance === Infinity ? 10000 : minDistance;
    }
    
    // ALWAYS prefer horizontal placement - try right first, then left
    // Only use vertical (top/bottom) as absolute last resort
    
    // Try right side first
    const rightSide = sides.find(s => s.name === 'right');
    if (rightSide && !checkCollision(rightSide.position, allNodes)) {
      return rightSide.position;
    }
    
    // Try left side second
    const leftSide = sides.find(s => s.name === 'left');
    if (leftSide && !checkCollision(leftSide.position, allNodes)) {
      return leftSide.position;
    }
    
    // If both horizontal sides are blocked, try to find space near them
    if (rightSide) {
      const rightSpace = findEmptySpace(rightSide.position, allNodes);
      if (rightSpace && !checkCollision(rightSpace, allNodes)) {
        return rightSpace;
      }
    }
    
    if (leftSide) {
      const leftSpace = findEmptySpace(leftSide.position, allNodes);
      if (leftSpace && !checkCollision(leftSpace, allNodes)) {
        return leftSpace;
      }
    }
    
    // Only use vertical as absolute last resort
    const topSide = sides.find(s => s.name === 'top');
    const bottomSide = sides.find(s => s.name === 'bottom');
    
    if (bottomSide && !checkCollision(bottomSide.position, allNodes)) {
      return bottomSide.position;
    }
    
    if (topSide && !checkCollision(topSide.position, allNodes)) {
      return topSide.position;
    }
    
    // Final fallback - use the side with most space
    const bestSide = sides.reduce((best, current) => {
      if (current.availableSpace > best.availableSpace) {
        return current;
      }
      return best;
    });
    
    // If the best side position has a collision, find empty space nearby
    if (checkCollision(bestSide.position, allNodes)) {
      return findEmptySpace(bestSide.position, allNodes);
    }
    
    return bestSide.position;
  }, [checkCollision, findEmptySpace]);

  // Find emptiest space closest to target point (for viewport-centered placement)
  const findClosestEmptySpace = useCallback((targetPosition, allNodes, maxRadius = 2000) => {
    const step = 100;
    let bestPosition = null;
    let bestDistance = Infinity;
    
    // Try the target position first
    if (!checkCollision(targetPosition, allNodes)) {
      return targetPosition;
    }

    // Search in expanding circles from target
    for (let radius = step; radius <= maxRadius; radius += step) {
      const positions = [];
      
      // Generate positions in a circle pattern
      for (let angle = 0; angle < 360; angle += 15) {
        const rad = (angle * Math.PI) / 180;
        positions.push({
          x: targetPosition.x + radius * Math.cos(rad),
          y: targetPosition.y + radius * Math.sin(rad),
        });
      }

      // Check each position and track the closest empty one
      for (const pos of positions) {
        if (!checkCollision(pos, allNodes)) {
          const distance = Math.sqrt(
            Math.pow(pos.x - targetPosition.x, 2) + 
            Math.pow(pos.y - targetPosition.y, 2)
          );
          if (distance < bestDistance) {
            bestDistance = distance;
            bestPosition = pos;
          }
        }
      }

      // If we found a position, return it (closest one found so far)
      if (bestPosition) {
        return bestPosition;
      }
    }

    // Fallback: return target position or far from all nodes
    if (allNodes.length === 0) return targetPosition;
    
    const maxX = Math.max(...allNodes.map(n => n.position.x)) + NODE_WIDTH + PADDING;
    const maxY = Math.max(...allNodes.map(n => n.position.y)) + NODE_HEIGHT + PADDING;
    return { x: maxX, y: maxY };
  }, [checkCollision]);

  // Update historyIndexRef when historyIndex changes
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);
  
  // Save state to history (only if not restoring from history)
  // Define this early so it can be used by other callbacks
  const saveToHistory = useCallback((newNodes, newEdges, immediate = false) => {
    if (isRestoringHistoryRef.current) {
      return; // Don't save history when restoring from history
    }
    
    // Clear existing timeout if not immediate
    if (saveTimeoutRef.current && !immediate) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const save = () => {
      // Use functional updates to get current state
      setHistory((prevHistory) => {
        const currentIndex = historyIndexRef.current;
        // Remove any history after current index (when undoing and then making new changes)
        const trimmedHistory = prevHistory.slice(0, currentIndex + 1);
        // Add new state
        const newHistory = [...trimmedHistory, { 
          nodes: JSON.parse(JSON.stringify(newNodes)), 
          edges: JSON.parse(JSON.stringify(newEdges)) 
        }];
        // Limit history to last 50 states to prevent memory issues
        const finalHistory = newHistory.slice(-50);
        const newIndex = Math.min(currentIndex + 1, finalHistory.length - 1);
        
        // Update history index
        setHistoryIndex(newIndex);
        historyIndexRef.current = newIndex;
        
        return finalHistory;
      });
    };
    
    if (immediate) {
      save();
    } else {
      saveTimeoutRef.current = setTimeout(save, 300);
    }
  }, []);

  // Handler for adding a new connected node
  const handleAddConnectedNode = useCallback((sourceNodeId, direction) => {
    // Set flag to prevent duplicate history saves
    isAddingConnectedNodeRef.current = true;
    
    setNodes((currentNodes) => {
      const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
      if (!sourceNode) {
        isAddingConnectedNodeRef.current = false;
        return currentNodes;
      }

      // Different offsets for vertical vs horizontal directions
      // Node width is ~400px, so horizontal needs more space
      const verticalOffset = 500; // For Top/Bottom
      const horizontalOffset = 500; // For Left/Right
      
      let newPosition = { ...sourceNode.position };

      switch (direction) {
        case Position.Top:
          newPosition.y -= verticalOffset;
          break;
        case Position.Bottom:
          newPosition.y += verticalOffset;
          break;
        case Position.Right:
          newPosition.x += horizontalOffset;
          break;
        case Position.Left:
          newPosition.x -= horizontalOffset;
          break;
        default:
          newPosition.x += horizontalOffset;
      }

      // Find empty space for the new node
      const finalPosition = findEmptySpace(newPosition, currentNodes);

      const newNodeId = `node-${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: 'chat',
        position: finalPosition,
        data: { 
          label: 'New Node', 
          messages: [],
          boardId: boardId, // Pass the board ID to the node
          onAddNode: handleAddConnectedNode // Pass the function recursively
        },
      };

      const newEdge = {
        id: `e-${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: `source-${direction}`, // Correctly reference the unique handle ID
        targetHandle: `target-${getOppositeDirection(direction)}`, // Connect to the opposite target handle
        type: 'default',
        style: { strokeWidth: 2 }, // Double thickness
      };

      const updatedNodes = currentNodes.concat(newNode);
      nodesRef.current = updatedNodes;
      
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        edgesRef.current = updatedEdges;
        
        // Save to history once after both node and edge are added
        // Use setTimeout with a delay to ensure React Flow has processed all changes
        setTimeout(() => {
          saveToHistory(updatedNodes, updatedEdges, true);
          // Reset flag after a longer delay to ensure all change events are processed
          setTimeout(() => {
            isAddingConnectedNodeRef.current = false;
          }, 100);
        }, 50);
        
        // Fit view to show the new node
        setTimeout(() => {
          const nodeWidth = newNode.width || 400;
          const nodeHeight = newNode.height || 200;
          setCenter(
            finalPosition.x + nodeWidth / 2, 
            finalPosition.y + nodeHeight / 2, 
            { zoom: 1.2, duration: 400 }
          );
        }, 0);
        
        return updatedEdges;
      });
      return updatedNodes;
    });
  }, [findEmptySpace, saveToHistory, setCenter, boardId]);

  // Helper to get opposite direction for target handle
  const getOppositeDirection = (direction) => {
    switch (direction) {
      case Position.Top: return Position.Bottom;
      case Position.Bottom: return Position.Top;
      case Position.Right: return Position.Left;
      case Position.Left: return Position.Right;
      default: return Position.Top;
    }
  };

  // ********** NEW CODE HERE ********** JOWEJFIOWEJFIOWEFJOWIEFJIOFJWEOFIJWEOFIJEWFIOWJOWEIJFOIEFJWOEFIJ
  const loadBoardData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading board:', boardId);
      
      // Call the GET endpoint
      const boardData = await boardAPI.getBoard(boardId);
      
      // Get board name from the board data
      if (boardData.board && boardData.board.name) {
        setCurrentBoardName(boardData.board.name);
      } else if (boardData.name) {
        setCurrentBoardName(boardData.name);
      } else {
        // If name not in response, fetch all boards to get the name
        try {
          const boards = await boardAPI.getBoards();
          const board = boards.find(b => b.id === boardId);
          if (board) {
            setCurrentBoardName(board.name);
          }
        } catch (error) {
          console.error('Failed to fetch board name:', error);
        }
      }
      
      console.log('Board data received:', boardData);
      
      // Convert database nodes to React Flow format
      const flowNodes = (boardData.nodes || []).map(node => ({
        id: node.id,
        type: 'chat',
        position: { x: node.x, y: node.y },
        data: {
          label: node.title || 'New Chat',
          messages: node.content ? [{ role: node.role || 'assistant', content: node.content }] : [],
          model: node.model || 'gpt-4o',
          isRoot: node.is_root || false,
          isStarred: node.is_starred || false,
          boardId: boardId,
          onAddNode: handleAddConnectedNode,
        },
        width: node.width,
        height: node.height,
      }));
      
      // Convert database edges to React Flow format
      const flowEdges = (boardData.edges || []).map(edge => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: edge.edge_type || 'default',
        label: edge.label,
      }));
      
      console.log('Converted nodes:', flowNodes);
      console.log('Converted edges:', flowEdges);
      
      // Update state with loaded data
      setNodes(flowNodes);
      setEdges(flowEdges);
      
    } catch (error) {
      console.error('Failed to load board:', error);
      // If board doesn't exist, you might want to create it or show an error
      // For now, just log the error
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, handleAddConnectedNode]); 

  // Function to switch to a different board
  const switchBoard = useCallback(async (newBoardId) => {
    setBoardId(newBoardId);
    // loadBoardData will be called automatically via useEffect when boardId changes
  }, []);
  
  // Initial Nodes State
  const initialNodes = [
    { 
      id: 'node-1', 
      type: 'chat', 
      position: { x: 100, y: 100 }, 
      data: { 
        label: 'New Node', 
        model: 'gemini-pro',
        messages: [],
        isRoot: true, // Mark as root node
        onAddNode: handleAddConnectedNode // Inject handler
      } 
    },
  ];
  
  const [nodes, setNodes] = useState(initialNodes);
  
  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  
  // Initialize history with initial state
  useEffect(() => {
    setHistory([{ nodes: initialNodes, edges: [] }]);
    setHistoryIndex(0);
    nodesRef.current = initialNodes;
    edgesRef.current = [];
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isRestoringHistoryRef.current = true;
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      if (state) {
        // Restore nodes with handlers
        const restoredNodes = JSON.parse(JSON.stringify(state.nodes)).map(node => ({
          ...node,
          data: {
            ...node.data,
            onAddNode: handleAddConnectedNode
          }
        }));
        setNodes(restoredNodes);
        setEdges(JSON.parse(JSON.stringify(state.edges)));
        setHistoryIndex(newIndex);
        nodesRef.current = restoredNodes;
        edgesRef.current = JSON.parse(JSON.stringify(state.edges));
        historyIndexRef.current = newIndex;
        // Reset flag after a brief delay to allow state updates to complete
        setTimeout(() => {
          isRestoringHistoryRef.current = false;
        }, 100);
      }
    }
  }, [history, historyIndex, handleAddConnectedNode]);
  
  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isRestoringHistoryRef.current = true;
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      if (state) {
        // Restore nodes with handlers
        const restoredNodes = JSON.parse(JSON.stringify(state.nodes)).map(node => ({
          ...node,
          data: {
            ...node.data,
            onAddNode: handleAddConnectedNode
          }
        }));
        setNodes(restoredNodes);
        setEdges(JSON.parse(JSON.stringify(state.edges)));
        setHistoryIndex(newIndex);
        nodesRef.current = restoredNodes;
        edgesRef.current = JSON.parse(JSON.stringify(state.edges));
        historyIndexRef.current = newIndex;
        // Reset flag after a brief delay to allow state updates to complete
        setTimeout(() => {
          isRestoringHistoryRef.current = false;
        }, 100);
      }
    }
  }, [history, historyIndex, handleAddConnectedNode]);

  // Handle dark mode class on html/body
  useEffect(() => {
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [colorMode]);

  // Apply dark mode on initial mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // ********** NEW CODE HERE **********
  // Load board data on initial mount
  useEffect(() => {
    loadBoardData();
  }, [loadBoardData, boardId]);

  // Global keyboard shortcuts: Cmd/Ctrl + F to open search, Cmd/Ctrl + Z for undo, Cmd/Ctrl + Y for redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Helper function to find closest node to a given position
  const findClosestNode = useCallback((deletedPosition, remainingNodes) => {
    if (remainingNodes.length === 0) return null;
    
    let closestNode = null;
    let minDistance = Infinity;
    
    remainingNodes.forEach(node => {
      const nodeCenterX = node.position.x + (node.width || 400) / 2;
      const nodeCenterY = node.position.y + (node.height || 200) / 2;
      
      const dx = nodeCenterX - deletedPosition.x;
      const dy = nodeCenterY - deletedPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });
    
    return closestNode;
  }, []);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        nodesRef.current = newNodes;
        
        // Check what type of change this is
        const isAddChange = changes.some(c => c.type === 'add');
        const isPositionChange = changes.some(c => c.type === 'position' && c.dragging);
        const isDataChange = changes.some(c => c.type === 'dimensions' || (c.type === 'position' && !c.dragging));
        const isRemoveChange = changes.some(c => c.type === 'remove');
        const isSelectChange = changes.some(c => c.type === 'select');
        
        // Handle node deletion - jump to closest node
        // Also prevent deletion of root nodes
        if (isRemoveChange) {
          const removedChanges = changes.filter(c => c.type === 'remove');
          if (removedChanges.length > 0 && nds.length > 0) {
            // Filter out root nodes from deletion - prevent them from being deleted
            const validRemovedChanges = removedChanges.filter(rc => {
              const node = nds.find(n => n.id === rc.id);
              return node && !node.data?.isRoot;
            });
            
            // If trying to delete root nodes, filter them out
            if (validRemovedChanges.length < removedChanges.length) {
              // Some root nodes were attempted to be deleted - prevent it
              // Return the nodes with root nodes still present
              const filteredNodes = nds.filter(n => {
                const isRemoved = removedChanges.some(rc => rc.id === n.id);
                // Keep the node if it's not being removed, or if it's a root node
                return !isRemoved || n.data?.isRoot;
              });
              return filteredNodes;
            }
            
            // Find the deleted node's position (only if it's not a root node)
            const deletedNode = nds.find(n => validRemovedChanges.some(rc => rc.id === n.id) && !n.data?.isRoot);
            if (deletedNode && newNodes.length > 0) {
              const deletedCenterX = deletedNode.position.x + (deletedNode.width || 400) / 2;
              const deletedCenterY = deletedNode.position.y + (deletedNode.height || 200) / 2;
              
              // Find closest remaining node
              const closestNode = findClosestNode(
                { x: deletedCenterX, y: deletedCenterY },
                newNodes
              );
              
              // Jump to closest node
              if (closestNode) {
                setTimeout(() => {
                  const nodeWidth = closestNode.width || 400;
                  const nodeHeight = closestNode.height || 200;
                  setCenter(
                    closestNode.position.x + nodeWidth / 2,
                    closestNode.position.y + nodeHeight / 2,
                    { zoom: 1.2, duration: 400 }
                  );
                }, 0);
              }
            }
          }
        }
        
        // Don't save history for 'add' changes if we're programmatically adding nodes
        // (we'll save once after the node is fully added)
        if (isAddChange && (isAddingConnectedNodeRef.current || isAddingFloatingNodeRef.current)) {
          return newNodes;
        }
        
        // For dragging, debounce. For other changes (remove, data, dimensions), save immediately
        if (isPositionChange) {
          // Debounce position changes (dragging)
          saveToHistory(newNodes, edgesRef.current, false);
        } else if (isDataChange || isRemoveChange) {
          // Save immediately for data changes, remove
          saveToHistory(newNodes, edgesRef.current, true);
        }
        // Don't save for select changes (just clicking nodes)
        // Don't save for add changes when programmatically adding (handled above)
        
        return newNodes;
      });
    },
    [saveToHistory, findClosestNode, setCenter],
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        edgesRef.current = newEdges;
        // Don't save history if we're in the middle of adding a connected node
        // (we'll save once after both node and edge are added)
        if (!isAddingConnectedNodeRef.current) {
          // Save immediately for edge changes (add, remove)
          saveToHistory(nodesRef.current, newEdges, true);
        }
        return newEdges;
      });
    },
    [saveToHistory],
  );

  // Determine optimal target handle - the side of target node that faces the source
  const getOptimalTargetHandle = useCallback((sourceNode, targetNode) => {
    if (!sourceNode || !targetNode) return Position.Top;
    
    // Get node centers
    const sourceCenterX = sourceNode.position.x + (sourceNode.width || 400) / 2;
    const sourceCenterY = sourceNode.position.y + (sourceNode.height || 200) / 2;
    const targetCenterX = targetNode.position.x + (targetNode.width || 400) / 2;
    const targetCenterY = targetNode.position.y + (targetNode.height || 200) / 2;
    
    // Calculate direction vector from target to source (which side faces the source)
    const dx = sourceCenterX - targetCenterX; // Positive = source is to the right
    const dy = sourceCenterY - targetCenterY; // Positive = source is below
    
    // Determine which side of target faces the source
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    // If horizontal distance is greater, use left or right side
    if (absDx > absDy) {
      // If source is to the right, use target's RIGHT side (facing source)
      // If source is to the left, use target's LEFT side (facing source)
      return dx > 0 ? Position.Right : Position.Left;
    } 
    // If vertical distance is greater, use top or bottom side
    else {
      // If source is below, use target's BOTTOM side (facing source)
      // If source is above, use target's TOP side (facing source)
      return dy > 0 ? Position.Bottom : Position.Top;
    }
  }, []);

  // Determine optimal source handle - the side of source node that faces the target
  const getOptimalSourceHandle = useCallback((sourceNode, targetNode) => {
    if (!sourceNode || !targetNode) return Position.Bottom;
    
    // Get node centers
    const sourceCenterX = sourceNode.position.x + (sourceNode.width || 400) / 2;
    const sourceCenterY = sourceNode.position.y + (sourceNode.height || 200) / 2;
    const targetCenterX = targetNode.position.x + (targetNode.width || 400) / 2;
    const targetCenterY = targetNode.position.y + (targetNode.height || 200) / 2;
    
    // Calculate direction vector from source to target (which side faces the target)
    const dx = targetCenterX - sourceCenterX; // Positive = target is to the right
    const dy = targetCenterY - sourceCenterY; // Positive = target is below
    
    // Determine which side of source faces the target
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    // If horizontal distance is greater, use left or right side
    if (absDx > absDy) {
      // If target is to the right, use source's RIGHT side (facing target)
      // If target is to the left, use source's LEFT side (facing target)
      return dx > 0 ? Position.Right : Position.Left;
    } 
    // If vertical distance is greater, use top or bottom side
    else {
      // If target is below, use source's BOTTOM side (facing target)
      // If target is above, use source's TOP side (facing target)
      return dy > 0 ? Position.Bottom : Position.Top;
    }
  }, []);

  // Optimize edge handles based on current node positions
  // This function recalculates optimal handles for all edges
  const optimizeEdgeHandles = useCallback((currentNodes, currentEdges) => {
    return currentEdges.map((edge) => {
      const sourceNode = currentNodes.find(n => n.id === edge.source);
      const targetNode = currentNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Recalculate optimal handles based on current node positions
        const optimalSourcePosition = getOptimalSourceHandle(sourceNode, targetNode);
        const optimalTargetPosition = getOptimalTargetHandle(sourceNode, targetNode);
        
        return {
          ...edge,
          sourceHandle: `source-${optimalSourcePosition}`,
          targetHandle: `target-${optimalTargetPosition}`,
        };
      }
      
      // Return edge unchanged if nodes not found
      return edge;
    });
  }, [getOptimalSourceHandle, getOptimalTargetHandle]);

  // Recalculate edge handles whenever nodes change (position, size, etc.)
  // This ensures that when a board is loaded from the database, all edges get optimal handles
  // Also recalculates when nodes are moved, ensuring handles always use optimal sides
  useEffect(() => {
    if (edges.length > 0 && nodes.length > 0) {
      setEdges((currentEdges) => {
        const optimizedEdges = optimizeEdgeHandles(nodes, currentEdges);
        // Only update if handles actually changed (avoid unnecessary re-renders)
        const needsUpdate = optimizedEdges.some((optEdge, idx) => {
          const currentEdge = currentEdges[idx];
          return !currentEdge || 
                 optEdge.sourceHandle !== currentEdge.sourceHandle || 
                 optEdge.targetHandle !== currentEdge.targetHandle;
        });
        
        return needsUpdate ? optimizedEdges : currentEdges;
      });
    }
  }, [nodes, optimizeEdgeHandles]); // Recalculate when nodes change (positions, sizes, etc.)

  const onConnect = useCallback(
    (params) => {
      // Get source and target nodes
      const sourceNode = getNode(params.source);
      const targetNode = getNode(params.target);
      
      if (sourceNode && targetNode) {
        // Determine optimal source and target handles based on node positions
        // This ensures the connection uses the best sides regardless of which handles were dragged
        const optimalSourcePosition = getOptimalSourceHandle(sourceNode, targetNode);
        const optimalTargetPosition = getOptimalTargetHandle(sourceNode, targetNode);
        
        // Override both handles with optimal ones
        // This way we don't need to store which side was used - frontend determines it
        const optimizedParams = {
          ...params,
          sourceHandle: `source-${optimalSourcePosition}`,
          targetHandle: `target-${optimalTargetPosition}`,
          style: { strokeWidth: 2 }, // Double thickness
        };
        
        setEdges((eds) => {
          const newEdges = addEdge(optimizedParams, eds);
          edgesRef.current = newEdges;
          // Save to history immediately for new connections
          saveToHistory(nodesRef.current, newEdges, true);
          return newEdges;
        });
      } else {
        // Fallback to original params if nodes not found
        setEdges((eds) => {
          const newEdges = addEdge({
            ...params,
            style: { strokeWidth: 2 }, // Double thickness
          }, eds);
          edgesRef.current = newEdges;
          // Save to history immediately for new connections
          saveToHistory(nodesRef.current, newEdges, true);
          return newEdges;
        });
      }
    },
    [getNode, getOptimalSourceHandle, getOptimalTargetHandle, saveToHistory],
  );

  const toggleColorMode = useCallback(() => {
    setColorMode((mode) => (mode === 'light' ? 'dark' : 'light'));
  }, []);

  const onAddNode = useCallback(() => {
    setNodes((currentNodes) => {
      let referencePosition;
      
      if (currentNodes.length === 0) {
        // If canvas is empty, use viewport center
        const viewport = getViewport();
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        referencePosition = {
          x: (screenCenterX - viewport.x) / viewport.zoom,
          y: (screenCenterY - viewport.y) / viewport.zoom,
        };
      } else {
        // Use the most recently added node (last in array) as reference
        // Use the node's center position
        const lastNode = currentNodes[currentNodes.length - 1];
        referencePosition = {
          x: lastNode.position.x + (lastNode.width || NODE_WIDTH) / 2,
          y: lastNode.position.y + (lastNode.height || NODE_HEIGHT) / 2,
        };
      }

      // Find the side with the most available space
      // Prefer horizontal (left/right) placement
      const finalPosition = findSideWithMostSpace(referencePosition, currentNodes);

      // If canvas is empty, make this node the root node
      const isRoot = currentNodes.length === 0;

      const newNode = {
        id: `node-${Date.now()}`,
        type: 'chat',
        position: finalPosition,
        data: { 
          label: 'New Node', 
          messages: [],
          isRoot: isRoot, // Mark as root if canvas is empty
          boardId: boardId, // Pass the board ID to the node
          onAddNode: handleAddConnectedNode // Ensure new manual nodes also have the handler
        },
      };
      const newNodes = currentNodes.concat(newNode);
      nodesRef.current = newNodes;
      
      // Save to history once after node is added
      // Use setTimeout with a delay to ensure React Flow has processed all changes
      setTimeout(() => {
        saveToHistory(newNodes, edgesRef.current, true);
        // Reset flag after a longer delay to ensure all change events are processed
        setTimeout(() => {
          isAddingFloatingNodeRef.current = false;
        }, 100);
      }, 50);
      
      // Fit view to show the new node
      setTimeout(() => {
        const nodeWidth = newNode.width || 400;
        const nodeHeight = newNode.height || 200;
        setCenter(
          finalPosition.x + nodeWidth / 2, 
          finalPosition.y + nodeHeight / 2, 
          { zoom: 1.2, duration: 400 }
        );
      }, 0);
      
      return newNodes;
    });
  }, [handleAddConnectedNode, findSideWithMostSpace, getViewport, saveToHistory, setCenter, boardId]);

  const onClear = useCallback(() => {
    // Clear all nodes except root nodes, and reset root nodes to default state
    setNodes((currentNodes) => {
      const rootNodes = currentNodes.filter(node => node.data?.isRoot === true);
      
      // Reset root nodes to default state
      const resetRootNodes = rootNodes.map(node => ({
        ...node,
        position: { x: 100, y: 100 }, // Default position
        data: {
          ...node.data,
          messages: [], // Clear messages
          label: 'New Node', // Reset label
          model: 'gemini-pro', // Default model
          isStarred: false, // Reset star
          isCollapsed: false, // Reset collapse
          onAddNode: handleAddConnectedNode // Ensure handler is present
        },
        width: 400, // Default width
        height: null, // Default height (auto)
      }));
      
      // If no root nodes exist, create a default one
      const finalNodes = resetRootNodes.length > 0 ? resetRootNodes : [
        {
          id: 'node-1',
          type: 'chat',
          position: { x: 100, y: 100 },
          data: {
            label: 'New Node',
            model: 'gemini-pro',
            messages: [],
            isRoot: true,
            onAddNode: handleAddConnectedNode
          },
          width: 400,
          height: null,
        }
      ];
      
      nodesRef.current = finalNodes;
      edgesRef.current = [];
      
      // Save to history immediately for clear
      saveToHistory(finalNodes, [], true);
      
      // Jump to the root node position
      setTimeout(() => {
        const rootNode = finalNodes[0];
        if (rootNode) {
          const nodeWidth = rootNode.width || 400;
          const nodeHeight = rootNode.height || 200;
          setCenter(
            rootNode.position.x + nodeWidth / 2,
            rootNode.position.y + nodeHeight / 2,
            { zoom: 1.2, duration: 400 }
          );
        }
      }, 0);
      
      return finalNodes;
    });
    setEdges([]);
  }, [saveToHistory, setCenter, handleAddConnectedNode]);

  const onSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleSelectNode = useCallback((nodeId) => {
    const node = getNode(nodeId);
    if (node) {
      // Center the viewport on the selected node with smooth animation
      // Account for node dimensions to center it properly
      const nodeWidth = node.width || 400;
      const nodeHeight = node.height || 200;
      setCenter(
        node.position.x + nodeWidth / 2, 
        node.position.y + nodeHeight / 2, 
        { zoom: 1.2, duration: 400 }
      );
    }
  }, [getNode, setCenter]);

  // Jump to base/root node with zoom 1.2
  const jumpToBaseNode = useCallback(() => {
    const rootNode = nodes.find(node => node.data?.isRoot === true) || nodes[0];
    if (rootNode) {
      const nodeWidth = rootNode.width || 400;
      const nodeHeight = rootNode.height || 200;
      setCenter(
        rootNode.position.x + nodeWidth / 2,
        rootNode.position.y + nodeHeight / 2,
        { zoom: 1.2, duration: 400 }
      );
    }
  }, [nodes, setCenter]);

  // Set initial viewport to base node with zoom 1.2
  useEffect(() => {
    if (initialNodes.length > 0) {
      const rootNode = initialNodes.find(node => node.data?.isRoot === true) || initialNodes[0];
      if (rootNode) {
        const nodeWidth = rootNode.width || 400;
        const nodeHeight = rootNode.height || 200;
        setTimeout(() => {
          setCenter(
            rootNode.position.x + nodeWidth / 2,
            rootNode.position.y + nodeHeight / 2,
            { zoom: 1.2, duration: 0 }
          );
        }, 100);
      }
    }
  }, [setCenter]); // Only run on initial mount

  return (
    <Layout 
      onBoardSwitch={switchBoard} 
      currentBoardId={boardId}
      isSidebarCollapsed={isSidebarCollapsed}
      onSidebarCollapseChange={setIsSidebarCollapsed}
      colorMode={colorMode}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <p className="text-neutral-600 dark:text-neutral-400">Loading board...</p>
      </div>
    ) : (
      <>
      <Hotbar 
        onAddNode={onAddNode} 
        onClear={onClear} 
        onFitView={jumpToBaseNode}
        onSearch={onSearch}
        onToggleTheme={toggleColorMode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        colorMode={colorMode}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 }
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        colorMode={colorMode}
      >
        <Background />
        <MiniMap />
      </ReactFlow>
      {/* Floating bn.ai text with breadcrumbs */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-200" style={{ fontFamily: "'Azeret Mono', monospace", fontWeight: 600 }}>bn.ai</h1>
          <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed && currentBoardName ? 'max-w-[500px] opacity-100' : 'max-w-0 opacity-0'}`}>
            <span className="text-neutral-600 dark:text-neutral-400 whitespace-nowrap" style={{ fontFamily: "'Azeret Mono', monospace" }}>/</span>
            <span 
              className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap"
              style={{ fontFamily: "'Azeret Mono', monospace", fontWeight: 400 }}
            >
              {currentBoardName}
            </span>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={nodes}
        onSelectNode={handleSelectNode}
        colorMode={colorMode}
      />
      </>
    )}
    </Layout>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
