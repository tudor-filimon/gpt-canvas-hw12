from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# Flow Schemas
class FlowSave(BaseModel):
    flow_id: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    metadata: Optional[Dict[str, Any]] = {}


class FlowResponse(BaseModel):
    flow_id: str
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    metadata: Optional[Dict[str, Any]] = {}
    message: Optional[str] = None


class FlowReset(BaseModel):
    flow_id: str


# Node Schemas
class NodeCreate(BaseModel):
    name: str
    type: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    data: Optional[Dict[str, Any]] = None


class NodeUpdate(BaseModel):
    id: int
    name: Optional[str] = None
    type: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    data: Optional[Dict[str, Any]] = None
    gpt_request: Optional[Dict[str, Any]] = None


class NodeDelete(BaseModel):
    id: int


class NodePosition(BaseModel):
    id: int
    position_x: float
    position_y: float


class NodeBulkUpdate(BaseModel):
    nodes: List['NodeUpdate']


class NodeResponse(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    data: Optional[Dict[str, Any]] = None
    gpt_request: Optional[Dict[str, Any]] = None
    gpt_response: Optional[Dict[str, Any]] = None


# Edge Schemas
class EdgeCreate(BaseModel):
    source_node_id: int
    target_node_id: int
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class EdgeDelete(BaseModel):
    id: int


class EdgeUpdate(BaseModel):
    id: int
    source_node_id: Optional[int] = None
    target_node_id: Optional[int] = None
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    delete_relationship: Optional[bool] = False
    deleted_at: Optional[datetime] = None


class EdgeResponse(BaseModel):
    id: int
    source_node_id: int
    target_node_id: int
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    deleted: Optional[bool] = False
    deleted_at: Optional[datetime] = None


# Branch Schemas
class BranchHighlight(BaseModel):
    source_node_id: int
    highlighted_text: str
    new_node_name: Optional[str] = None
    new_node_type: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    new_node_data: Optional[Dict[str, Any]] = None


class BranchFull(BaseModel):
    source_node_id: int
    new_node_name: Optional[str] = None
    new_node_type: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    new_node_data: Optional[Dict[str, Any]] = None


class BranchResponse(BaseModel):
    branch_id: int
    source_node_id: int
    new_node: Dict[str, Any]
    edge: Dict[str, Any]
    message: str


# GPT Schemas (for future use)
class GPTRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None


class GPTResponse(BaseModel):
    response: str
    status: str
    metadata: Optional[Dict[str, Any]] = None


# Forward reference resolution
NodeBulkUpdate.model_rebuild()