from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, Enum):
    # Brand DNA
    ANALYZE_URL = "analyze_url"
    EXTRACT_BRAND_DNA = "extract_brand_dna"

    # Campaign
    GENERATE_IDEAS = "generate_ideas"
    GENERATE_COPY = "generate_copy"
    TRANSFORM_COPY = "transform_copy"

    # Photoshoot
    CUTOUT = "cutout"
    GENERATE_BACKGROUND = "generate_background"
    COMPOSE = "compose"

    # Export
    EXPORT_PNG = "export_png"
    EXPORT_PPTX = "export_pptx"
    EXPORT_JSON = "export_json"
    EXPORT_ZIP = "export_zip"


class Job(BaseModel):
    id: str
    type: JobType
    status: JobStatus
    progress: int = 0  # 0-100

    # Input/Output data
    input_data: Dict[str, Any] = {}
    output_data: Optional[Dict[str, Any]] = None

    # Error handling
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

    # Metadata
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class JobCreate(BaseModel):
    type: JobType
    input_data: Dict[str, Any] = {}


class JobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    progress: Optional[int] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
