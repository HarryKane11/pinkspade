from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class DesignStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    EXPORTING = "exporting"
    EXPORTED = "exported"


class Design(BaseModel):
    id: str
    campaign_id: Optional[str] = None
    brand_id: Optional[str] = None
    channel_preset_id: Optional[str] = None

    name: str
    status: DesignStatus

    # Design data
    design_json: Dict[str, Any]  # Full DesignJSON structure

    # Current version
    current_version: int = 1

    # Thumbnail for preview
    thumbnail_url: Optional[str] = None

    # Metadata
    created_at: datetime
    updated_at: datetime


class DesignVersion(BaseModel):
    id: str
    design_id: str
    version: int
    design_json: Dict[str, Any]
    thumbnail_url: Optional[str] = None
    created_at: datetime


class DesignCreate(BaseModel):
    name: str
    campaign_id: Optional[str] = None
    brand_id: Optional[str] = None
    channel_preset_id: Optional[str] = None
    design_json: Dict[str, Any]


class DesignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[DesignStatus] = None
    design_json: Optional[Dict[str, Any]] = None


class LayerUpdate(BaseModel):
    layer_id: str
    updates: Dict[str, Any]


class CopyTransformLayerRequest(BaseModel):
    layer_id: str
    transform_type: str  # "shorter", "formal", "direct", "limited"
    limit: Optional[int] = None
