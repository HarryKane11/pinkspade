from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class ExportFormat(str, Enum):
    PNG = "png"
    PPTX = "pptx"
    JSON = "json"
    ZIP = "zip"


class ExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Export(BaseModel):
    id: str
    design_id: str
    format: ExportFormat
    status: ExportStatus

    # Output
    file_url: Optional[str] = None
    file_size: Optional[int] = None

    # Error handling
    error_message: Optional[str] = None

    # Metadata
    created_at: datetime
    completed_at: Optional[datetime] = None


class ExportCreate(BaseModel):
    design_id: str
    format: ExportFormat


class ExportRequest(BaseModel):
    format: ExportFormat
    options: Optional[dict] = None  # Format-specific options
