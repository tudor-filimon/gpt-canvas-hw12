from fastapi import APIRouter, HTTPException
from typing import List
from schema.schemas import (
    NodeCreate, NodeUpdate, NodeDelete, NodePosition, 
    NodeBulkUpdate, NodeResponse, GPTRequest, GPTResponse
)

router = APIRouter()

# In-memory storage (replace with database later)
nodes_db = {}
node_id_counter = 1


@router.post("/create", response_model=NodeResponse)
async def create_node(node_data: NodeCreate):
    """Create a new node"""
    global node_id_counter
    
    new_node = {
        "id": node_id_counter,
        "name": node_data.name,
        "type": node_data.type,
        "position_x": node_data.position_x,
        "position_y": node_data.position_y,
        "data": node_data.data or {}
    }
    
    nodes_db[node_id_counter] = new_node
    node_id_counter += 1
    
    return new_node


@router.post("/update", response_model=NodeResponse)
async def update_node(node_data: NodeUpdate):
    """Update a node - includes GPT call for req/res"""
    if node_data.id not in nodes_db:
        raise HTTPException(status_code=404, detail="Node not found")
    
    node = nodes_db[node_data.id]
    
    # Update node fields
    if node_data.name is not None:
        node["name"] = node_data.name
    if node_data.type is not None:
        node["type"] = node_data.type
    if node_data.position_x is not None:
        node["position_x"] = node_data.position_x
    if node_data.position_y is not None:
        node["position_y"] = node_data.position_y
    if node_data.data is not None:
        node["data"] = node_data.data
    
    # GPT call handling (if GPT request/response is provided)
    if hasattr(node_data, 'gpt_request') and node_data.gpt_request:
        # TODO: Implement actual GPT API call here
        # For now, just store the request
        node["gpt_request"] = node_data.gpt_request.dict() if hasattr(node_data.gpt_request, 'dict') else node_data.gpt_request
        
        # Simulate GPT response (replace with actual API call)
        node["gpt_response"] = {
            "status": "processed",
            "message": "GPT processing completed"
        }
    
    return node


@router.post("/delete", response_model=dict)
async def delete_node(node_data: NodeDelete):
    """Delete a node"""
    if node_data.id not in nodes_db:
        raise HTTPException(status_code=404, detail="Node not found")
    
    del nodes_db[node_data.id]
    
    return {
        "id": node_data.id,
        "message": "Node deleted successfully"
    }


@router.post("/position", response_model=NodeResponse)
async def update_node_position(position_data: NodePosition):
    """Update node position (for moving it around)"""
    if position_data.id not in nodes_db:
        raise HTTPException(status_code=404, detail="Node not found")
    
    node = nodes_db[position_data.id]
    node["position_x"] = position_data.position_x
    node["position_y"] = position_data.position_y
    
    return node


@router.post("/bulk-update", response_model=dict)
async def bulk_update_nodes(bulk_data: NodeBulkUpdate):
    """Bulk update multiple nodes"""
    updated_nodes = []
    not_found_ids = []
    
    for node_update in bulk_data.nodes:
        if node_update.id not in nodes_db:
            not_found_ids.append(node_update.id)
            continue
        
        node = nodes_db[node_update.id]
        
        if node_update.name is not None:
            node["name"] = node_update.name
        if node_update.type is not None:
            node["type"] = node_update.type
        if node_update.position_x is not None:
            node["position_x"] = node_update.position_x
        if node_update.position_y is not None:
            node["position_y"] = node_update.position_y
        if node_update.data is not None:
            node["data"] = node_update.data
        
        updated_nodes.append(node)
    
    return {
        "updated_count": len(updated_nodes),
        "updated_nodes": updated_nodes,
        "not_found_ids": not_found_ids
    }