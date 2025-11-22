from fastapi import APIRouter, HTTPException
from schema.schemas import BranchHighlight, BranchFull, BranchResponse

router = APIRouter()

# In-memory storage (replace with database later)
branches_db = {}
branch_id_counter = 1


@router.post("/highlight", response_model=BranchResponse)
async def branch_highlight(branch_data: BranchHighlight):
    """Branch to a new node from highlight - case 1"""
    global branch_id_counter
    
    # Create a new branch node from the highlighted node
    new_branch = {
        "id": branch_id_counter,
        "source_node_id": branch_data.source_node_id,
        "highlighted_text": branch_data.highlighted_text,
        "new_node": {
            "name": branch_data.new_node_name or f"Branch from Node {branch_data.source_node_id}",
            "type": branch_data.new_node_type or "branch",
            "position_x": branch_data.position_x,
            "position_y": branch_data.position_y,
            "data": branch_data.new_node_data or {}
        },
        "edge": {
            "source_node_id": branch_data.source_node_id,
            "target_node_id": None,  # Will be set after node creation
            "type": "highlight_branch",
            "data": {
                "highlighted_text": branch_data.highlighted_text
            }
        }
    }
    
    branches_db[branch_id_counter] = new_branch
    branch_id_counter += 1
    
    return {
        "branch_id": new_branch["id"],
        "source_node_id": branch_data.source_node_id,
        "new_node": new_branch["new_node"],
        "edge": new_branch["edge"],
        "message": "Branch created from highlight"
    }


@router.post("/full", response_model=BranchResponse)
async def branch_full(branch_data: BranchFull):
    """Branch to a new node completely - case 2"""
    global branch_id_counter
    
    # Create a complete new branch node
    new_branch = {
        "id": branch_id_counter,
        "source_node_id": branch_data.source_node_id,
        "new_node": {
            "name": branch_data.new_node_name or f"Branch from Node {branch_data.source_node_id}",
            "type": branch_data.new_node_type or "branch",
            "position_x": branch_data.position_x,
            "position_y": branch_data.position_y,
            "data": branch_data.new_node_data or {}
        },
        "edge": {
            "source_node_id": branch_data.source_node_id,
            "target_node_id": None,  # Will be set after node creation
            "type": "full_branch",
            "data": {}
        }
    }
    
    branches_db[branch_id_counter] = new_branch
    branch_id_counter += 1
    
    return {
        "branch_id": new_branch["id"],
        "source_node_id": branch_data.source_node_id,
        "new_node": new_branch["new_node"],
        "edge": new_branch["edge"],
        "message": "Full branch created"
    }