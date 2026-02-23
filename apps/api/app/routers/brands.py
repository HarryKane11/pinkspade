from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from app.models.brand import Brand, BrandCreate, BrandUpdate, BrandDNA, BrandDNACreate
from app.services.brand_dna import BrandDNAService

router = APIRouter()

# In-memory storage for demo (replace with Supabase in production)
brands_db: dict[str, Brand] = {}
brand_dna_db: dict[str, BrandDNA] = {}


@router.get("", response_model=List[Brand])
async def list_brands(workspace_id: Optional[str] = None):
    """List all brands, optionally filtered by workspace."""
    brands = list(brands_db.values())
    if workspace_id:
        brands = [b for b in brands if b.workspace_id == workspace_id]
    return brands


@router.post("", response_model=Brand)
async def create_brand(brand_data: BrandCreate):
    """Create a new brand."""
    brand_id = str(uuid4())
    now = datetime.utcnow()

    brand = Brand(
        id=brand_id,
        workspace_id="default",  # TODO: Get from auth
        name=brand_data.name,
        website_url=str(brand_data.website_url) if brand_data.website_url else None,
        created_at=now,
        updated_at=now,
    )

    brands_db[brand_id] = brand
    return brand


@router.get("/{brand_id}", response_model=Brand)
async def get_brand(brand_id: str):
    """Get a brand by ID."""
    if brand_id not in brands_db:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brands_db[brand_id]


@router.put("/{brand_id}", response_model=Brand)
async def update_brand(brand_id: str, brand_data: BrandUpdate):
    """Update a brand."""
    if brand_id not in brands_db:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand = brands_db[brand_id]
    update_data = brand_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            setattr(brand, key, str(value) if key == "website_url" else value)

    brand.updated_at = datetime.utcnow()
    brands_db[brand_id] = brand

    return brand


@router.delete("/{brand_id}")
async def delete_brand(brand_id: str):
    """Delete a brand."""
    if brand_id not in brands_db:
        raise HTTPException(status_code=404, detail="Brand not found")

    del brands_db[brand_id]
    return {"message": "Brand deleted"}


@router.post("/{brand_id}/analyze-url", response_model=dict)
async def analyze_url(brand_id: str, background_tasks: BackgroundTasks):
    """Analyze brand website URL and extract Brand DNA."""
    if brand_id not in brands_db:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand = brands_db[brand_id]
    if not brand.website_url:
        raise HTTPException(status_code=400, detail="Brand has no website URL")

    # Create job for background processing
    job_id = str(uuid4())

    # Queue background task
    background_tasks.add_task(
        BrandDNAService.extract_from_url,
        brand_id,
        brand.website_url,
        job_id,
    )

    return {"job_id": job_id, "status": "processing"}


@router.get("/{brand_id}/dna", response_model=BrandDNA)
async def get_brand_dna(brand_id: str, version: Optional[int] = None):
    """Get the current or specific version of Brand DNA."""
    if brand_id not in brands_db:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Find DNA for this brand
    dna_list = [d for d in brand_dna_db.values() if d.brand_id == brand_id]

    if not dna_list:
        raise HTTPException(status_code=404, detail="Brand DNA not found")

    if version:
        dna = next((d for d in dna_list if d.version == version), None)
        if not dna:
            raise HTTPException(status_code=404, detail=f"Brand DNA version {version} not found")
        return dna

    # Return current version
    current = next((d for d in dna_list if d.is_current), dna_list[-1])
    return current


@router.put("/{brand_id}/dna", response_model=BrandDNA)
async def update_brand_dna(brand_id: str, dna_data: BrandDNACreate):
    """Update or create Brand DNA (creates new version)."""
    if brand_id not in brands_db:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Get existing DNA versions
    existing = [d for d in brand_dna_db.values() if d.brand_id == brand_id]

    # Mark all existing as not current
    for dna in existing:
        dna.is_current = False
        brand_dna_db[dna.id] = dna

    # Create new version
    now = datetime.utcnow()
    new_version = len(existing) + 1
    dna_id = str(uuid4())

    new_dna = BrandDNA(
        id=dna_id,
        brand_id=brand_id,
        version=new_version,
        is_current=True,
        name=dna_data.name,
        colors=dna_data.colors or {
            "primary": "#0ea5e9",
            "secondary": "#64748b",
            "background": "#ffffff",
            "text": "#0f172a",
            "additional": [],
        },
        typography=dna_data.typography or {
            "heading_font": "Pretendard",
            "body_font": "Pretendard",
            "heading_weight": 700,
            "body_weight": 400,
        },
        tone=dna_data.tone or {
            "style": "professional",
            "description": "전문적이고 신뢰감 있는 톤",
            "keywords": ["전문성", "신뢰", "품질"],
        },
        website_url=str(dna_data.website_url) if dna_data.website_url else None,
        created_at=now,
        updated_at=now,
    )

    brand_dna_db[dna_id] = new_dna

    # Update brand's current DNA reference
    brand = brands_db[brand_id]
    brand.current_dna_id = dna_id
    brands_db[brand_id] = brand

    return new_dna
