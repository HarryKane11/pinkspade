from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
from enum import Enum

from app.services.cutout import CutoutService
from app.services.background_generation import BackgroundGenerationService

router = APIRouter()


class BackgroundTemplate(str, Enum):
    STUDIO = "studio"
    FLOATING = "floating"
    INGREDIENT = "ingredient"
    IN_USE = "in_use"
    LIFESTYLE = "lifestyle"


class CutoutRequest(BaseModel):
    image_url: str


class CutoutResponse(BaseModel):
    job_id: str
    status: str
    cutout_url: Optional[str] = None
    original_url: str


class BackgroundRequest(BaseModel):
    cutout_url: str
    template: BackgroundTemplate
    prompt: Optional[str] = None
    brand_colors: Optional[List[str]] = None


class BackgroundResponse(BaseModel):
    job_id: str
    status: str
    background_url: Optional[str] = None


class ComposeRequest(BaseModel):
    cutout_url: str
    background_url: str
    product_position: Optional[dict] = None  # {x, y, scale}
    shadow: bool = True


class ComposeResponse(BaseModel):
    job_id: str
    status: str
    composed_url: Optional[str] = None
    design_json: Optional[dict] = None


@router.post("/cutout", response_model=CutoutResponse)
async def create_cutout(request: CutoutRequest, background_tasks: BackgroundTasks):
    """Remove background from product image (누끼)."""
    job_id = str(uuid4())

    # Queue background task
    background_tasks.add_task(
        CutoutService.process_cutout,
        request.image_url,
        job_id,
    )

    return CutoutResponse(
        job_id=job_id,
        status="processing",
        original_url=request.image_url,
    )


@router.post("/cutout/upload", response_model=CutoutResponse)
async def upload_and_cutout(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    """Upload image and remove background."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    job_id = str(uuid4())

    # Save uploaded file temporarily
    contents = await file.read()

    # Queue background task
    background_tasks.add_task(
        CutoutService.process_cutout_from_bytes,
        contents,
        file.filename,
        job_id,
    )

    return CutoutResponse(
        job_id=job_id,
        status="processing",
        original_url=f"uploaded:{file.filename}",
    )


@router.post("/background", response_model=BackgroundResponse)
async def generate_background(
    request: BackgroundRequest,
    background_tasks: BackgroundTasks,
):
    """Generate AI background for product photoshoot."""
    job_id = str(uuid4())

    # Build prompt based on template
    template_prompts = {
        BackgroundTemplate.STUDIO: "Professional product photography studio setting with soft lighting and clean backdrop",
        BackgroundTemplate.FLOATING: "Product floating in air with soft shadows, minimal clean background",
        BackgroundTemplate.INGREDIENT: "Product surrounded by natural ingredients and raw materials",
        BackgroundTemplate.IN_USE: "Product being used in real-life context, lifestyle setting",
        BackgroundTemplate.LIFESTYLE: "Aesthetic lifestyle scene with product placement, modern interior",
    }

    base_prompt = template_prompts.get(request.template, template_prompts[BackgroundTemplate.STUDIO])

    # Add custom prompt if provided
    full_prompt = f"{base_prompt}. {request.prompt}" if request.prompt else base_prompt

    # CRITICAL: Ensure no text in generated background
    full_prompt += ". NO TEXT, NO LETTERS, NO WORDS, NO LOGOS in the image. Pure visual background only."

    background_tasks.add_task(
        BackgroundGenerationService.generate,
        full_prompt,
        request.brand_colors,
        job_id,
    )

    return BackgroundResponse(
        job_id=job_id,
        status="processing",
    )


@router.post("/compose", response_model=ComposeResponse)
async def compose_photoshoot(
    request: ComposeRequest,
    background_tasks: BackgroundTasks,
):
    """Compose cutout product onto generated background."""
    job_id = str(uuid4())

    background_tasks.add_task(
        BackgroundGenerationService.compose,
        request.cutout_url,
        request.background_url,
        request.product_position,
        request.shadow,
        job_id,
    )

    return ComposeResponse(
        job_id=job_id,
        status="processing",
    )


@router.get("/templates", response_model=List[dict])
async def list_background_templates():
    """List available background templates."""
    return [
        {
            "id": "studio",
            "name_ko": "스튜디오",
            "name_en": "Studio",
            "description": "깔끔한 스튜디오 조명의 제품 사진",
        },
        {
            "id": "floating",
            "name_ko": "플로팅",
            "name_en": "Floating",
            "description": "공중에 떠 있는 효과의 미니멀 배경",
        },
        {
            "id": "ingredient",
            "name_ko": "재료 강조",
            "name_en": "Ingredient",
            "description": "제품의 원재료와 함께 배치",
        },
        {
            "id": "in_use",
            "name_ko": "사용 장면",
            "name_en": "In Use",
            "description": "실제 사용 상황을 연출",
        },
        {
            "id": "lifestyle",
            "name_ko": "라이프스타일",
            "name_en": "Lifestyle",
            "description": "감성적인 라이프스타일 배경",
        },
    ]
