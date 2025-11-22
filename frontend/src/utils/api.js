const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Board operations
export const boardAPI = {
  // Get board with all nodes and edges
  getBoard: (boardId) => apiCall(`/boards/${boardId}`),
  getBoards: () => apiCall('/boards'), // ADD THIS
  // Create a new board
  createBoard: (name) => apiCall('/boards', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  deleteBoard: (boardId) => apiCall(`/boards/${boardId}`, { method: 'DELETE' }), // ADD THIS
  updateBoard: (boardId, name) => apiCall(`/boards/${boardId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }),
  // Save nodes and edges (bulk save)
  saveBoard: (boardId, nodes, edges) => apiCall(`/boards/${boardId}/save`, {
    method: 'POST',
    body: JSON.stringify({ nodes, edges }),
  }),
};

// Node operations
export const nodeAPI = {
  // Get all nodes for a board
  getNodes: (boardId) => apiCall(`/boards/${boardId}/nodes`),
  
  // Create a node
  createNode: (boardId, nodeData) => apiCall(`/boards/${boardId}/nodes`, {
    method: 'POST',
    body: JSON.stringify(nodeData),
  }),
  
  // Update a node (with optional LLM prompt)
  updateNode: (boardId, nodeId, updateData) => apiCall(`/boards/${boardId}/nodes/${nodeId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  }),
  
  // Delete a node
  deleteNode: (boardId, nodeId) => apiCall(`/boards/${boardId}/nodes/${nodeId}`, {
    method: 'DELETE',
  }),
};

// Edge operations
export const edgeAPI = {
  // Get all edges for a board
  getEdges: (boardId) => apiCall(`/boards/${boardId}/edges`),
  
  // Create an edge
  createEdge: (boardId, edgeData) => apiCall(`/boards/${boardId}/edges`, {
    method: 'POST',
    body: JSON.stringify(edgeData),
  }),
  
  // Delete an edge
  deleteEdge: (boardId, edgeId) => apiCall(`/boards/${boardId}/edges/${edgeId}`, {
    method: 'DELETE',
  }),
};
