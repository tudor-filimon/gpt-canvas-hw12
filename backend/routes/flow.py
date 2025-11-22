from fastapi import APIRouter, HTTPException
from schema.schemas import FlowSave, FlowResponse, FlowReset

router = APIRouter()

# In-memory storage (replace with database later)
flows_db = {}


@router.post("/save", response_model=FlowResponse)
async def save_flow(flow_data: FlowSave):
    """Save a flow"""
    flow_id = flow_data.flow_id if hasattr(flow_data, 'flow_id') and flow_data.flow_id else "default"
    
    flows_db[flow_id] = {
        "flow_id": flow_id,
        "nodes": flow_data.nodes,
        "edges": flow_data.edges,
        "metadata": flow_data.metadata if hasattr(flow_data, 'metadata') else {}
    }
    
    return {
        "flow_id": flow_id,
        "message": "Flow saved successfully",
        "nodes": flow_data.nodes,
        "edges": flow_data.edges
    }


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(flow_id: str):
    """Get a flow by ID"""
    if flow_id not in flows_db:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    flow = flows_db[flow_id]
    return {
        "flow_id": flow_id,
        "nodes": flow.get("nodes", []),
        "edges": flow.get("edges", []),
        "metadata": flow.get("metadata", {})
    }


@router.post("/reset", response_model=dict)
async def reset_flow(reset_data: FlowReset):
    """Reset a flow"""
    flow_id = reset_data.flow_id
    if flow_id not in flows_db:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    flows_db[flow_id] = {
        "flow_id": flow_id,
        "nodes": [],
        "edges": [],
        "metadata": {}
    }
    
    return {
        "flow_id": flow_id,
        "message": "Flow reset successfully"
    }