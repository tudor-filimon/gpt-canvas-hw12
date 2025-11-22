from fastapi import APIRouter, HTTPException
from schema.schemas import EdgeCreate, EdgeDelete, EdgeUpdate, EdgeResponse

router = APIRouter()

# In-memory storage (replace with database later)
edges_db = {}
edge_id_counter = 1


@router.post("/create", response_model=EdgeResponse)
async def create_edge(edge_data: EdgeCreate):
    """Create a new edge"""
    global edge_id_counter
    
    new_edge = {
        "id": edge_id_counter,
        "source_node_id": edge_data.source_node_id,
        "target_node_id": edge_data.target_node_id,
        "type": edge_data.type,
        "data": edge_data.data or {}
    }
    
    edges_db[edge_id_counter] = new_edge
    edge_id_counter += 1
    
    return new_edge


@router.post("/delete", response_model=dict)
async def delete_edge(edge_data: EdgeDelete):
    """Delete an edge"""
    if edge_data.id not in edges_db:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    del edges_db[edge_data.id]
    
    return {
        "id": edge_data.id,
        "message": "Edge deleted successfully"
    }


@router.post("/update", response_model=EdgeResponse)
async def update_edge(edge_data: EdgeUpdate):
    """Update an edge - case 1: relationship is deleted"""
    if edge_data.id not in edges_db:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    edge = edges_db[edge_data.id]
    
    # Handle relationship deletion case
    if edge_data.delete_relationship:
        # Mark relationship as deleted or remove it
        edge["deleted"] = True
        edge["deleted_at"] = edge_data.deleted_at if hasattr(edge_data, 'deleted_at') else None
        return edge
    
    # Regular update
    if edge_data.source_node_id is not None:
        edge["source_node_id"] = edge_data.source_node_id
    if edge_data.target_node_id is not None:
        edge["target_node_id"] = edge_data.target_node_id
    if edge_data.type is not None:
        edge["type"] = edge_data.type
    if edge_data.data is not None:
        edge["data"] = edge_data.data
    
    return edge