from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ToneStyle(str, Enum):
    FORMAL = "formal"
    CASUAL = "casual"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    PLAYFUL = "playful"
    LUXURIOUS = "luxurious"


class ColorPalette(BaseModel):
    primary: str
    secondary: Optional[str] = None
    accent: Optional[str] = None
    background: str = "#ffffff"
    text: str = "#000000"
    additional: List[str] = []


class Typography(BaseModel):
    heading_font: str = "Pretendard"
    body_font: str = "Pretendard"
    heading_weight: int = 700
    body_weight: int = 400


class Tone(BaseModel):
    style: ToneStyle
    description: str
    keywords: List[str]
    voice_examples: Optional[List[str]] = None


class ImageStyle(BaseModel):
    style: str
    color_tones: List[str]
    subjects: List[str]
    mood: str


class BrandDNA(BaseModel):
    id: str
    brand_id: str
    version: int
    is_current: bool = True

    # Core identity
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None

    # Visual identity
    logo_url: Optional[str] = None
    colors: ColorPalette
    typography: Typography

    # Voice & tone
    tone: Tone

    # Image preferences
    image_style: Optional[ImageStyle] = None

    # Extracted from website
    website_url: Optional[str] = None
    extracted_at: Optional[datetime] = None

    # Metadata
    created_at: datetime
    updated_at: datetime


class BrandDNACreate(BaseModel):
    name: str
    website_url: Optional[HttpUrl] = None
    colors: Optional[ColorPalette] = None
    typography: Optional[Typography] = None
    tone: Optional[Tone] = None


class Brand(BaseModel):
    id: str
    workspace_id: str
    name: str
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    current_dna_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BrandCreate(BaseModel):
    name: str
    website_url: Optional[HttpUrl] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    logo_url: Optional[str] = None
