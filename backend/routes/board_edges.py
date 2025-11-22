from fastapi import APIRouter, HTTPException, Path
from typing import List
from schema.schemas import EdgeBase
from database import supabase

router = APIRouter()

# Get all edge for a board
@router.get("/{board_id}/edges", response_model=List[EdgeBase])
async def get_board_edges(board_id: str = Path(..., description="Board ID")):
    """Get all edges for a board"""
    try:
        result = supabase.table("edges").select("*").eq("board_id", board_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create an edge in a board
@router.post("/{board_id}/edges", response_model=EdgeBase)
async def create_edge(
    board_id: str = Path(..., description="Board ID"),
    edge_data: EdgeBase = None
):
    """Create an edge in this board"""
    try:
        board_check = supabase.table("boards").select("id").eq("id", board_id).execute()
        if not board_check.data:
            raise HTTPException(status_code=404, detail="Board not found")
        
        insert_data = {
            "id": edge_data.id,
            "board_id": edge_data.board_id,
            "source_node_id": edge_data.source_node_id,
            "target_node_id": edge_data.target_node_id,
            "edge_type": edge_data.edge_type or "default"
        }
        
        result = supabase.table("edges").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create edge")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get a specific edge
@router.get("/{board_id}/edges/{edge_id}", response_model=EdgeBase)
async def get_edge(
    board_id: str = Path(..., description="Board ID"),
    edge_id: str = Path(..., description="Edge ID")
):
    """Get a specific edge"""
    try:
        result = supabase.table("edges").select("*").eq("id", edge_id).eq("board_id", board_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Edge not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update an edge
@router.patch("/{board_id}/edges/{edge_id}", response_model=EdgeBase)
async def update_edge(
    board_id: str = Path(..., description="Board ID"),
    edge_id: str = Path(..., description="Edge ID"),
    edge_data: EdgeBase = None
):
    """Update an edge"""
    try:
        check = supabase.table("edges").select("*").eq("id", edge_id).eq("board_id", board_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Edge not found in this board")
        
        update_data = {}
        if edge_data.source_node_id is not None:
            update_data["source_node_id"] = edge_data.source_node_id
        if edge_data.target_node_id is not None:
            update_data["target_node_id"] = edge_data.target_node_id
        if edge_data.edge_type is not None:
            update_data["edge_type"] = edge_data.edge_type
        
        
        
        if not update_data:
            return check.data[0]
        
        result = supabase.table("edges").update(update_data).eq("id", edge_id).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update edge")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{board_id}/edges/{edge_id}", response_model=dict)
async def delete_edge(
    board_id: str = Path(..., description="Board ID"),
    edge_id: str = Path(..., description="Edge ID")
):
    """Delete an edge"""
    try:
        check = supabase.table("edges").select("id").eq("id", edge_id).eq("board_id", board_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Edge not found in this board")
        
        supabase.table("edges").delete().eq("id", edge_id).execute()
        return {"message": "Edge deleted successfully", "edge_id": edge_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))