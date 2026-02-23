from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class CopyVariation(BaseModel):
    original: str
    shorter: Optional[str] = None  # 더 짧게
    formal: Optional[str] = None   # 더 공손하게
    direct: Optional[str] = None   # 더 직설적으로
    limited: Optional[str] = None  # 글자 수 제한


class CopyPack(BaseModel):
    headline: CopyVariation
    description: CopyVariation
    cta: CopyVariation


class CampaignIdea(BaseModel):
    id: str
    campaign_id: str
    channel_preset_id: Optional[str] = None

    # Idea content
    title: str
    concept: str
    target_message: str
    visual_direction: str

    # Copy variations
    copy_pack: CopyPack

    # Generated design reference
    design_id: Optional[str] = None

    # Metadata
    created_at: datetime


class Campaign(BaseModel):
    id: str
    workspace_id: str
    brand_id: str
    name: str
    prompt: str  # Original user prompt
    status: CampaignStatus

    # AI-generated content
    ideas: Optional[List[CampaignIdea]] = None

    # Settings
    target_channels: List[str] = []  # Channel preset IDs

    # Metadata
    created_at: datetime
    updated_at: datetime


class CampaignCreate(BaseModel):
    brand_id: str
    name: str
    prompt: str
    target_channels: Optional[List[str]] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    target_channels: Optional[List[str]] = None


class IdeaGenerationRequest(BaseModel):
    prompt: str
    num_ideas: int = 3
    target_channels: Optional[List[str]] = None


class CopyTransformRequest(BaseModel):
    text: str
    transform_type: str  # "shorter", "formal", "direct", "limited"
    limit: Optional[int] = None  # For character limit
    brand_tone: Optional[str] = None
