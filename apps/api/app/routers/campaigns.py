from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from app.models.campaign import (
    Campaign,
    CampaignCreate,
    CampaignUpdate,
    CampaignIdea,
    CampaignStatus,
    IdeaGenerationRequest,
    CopyTransformRequest,
)
from app.services.ai_generation import AIGenerationService

router = APIRouter()

# In-memory storage for demo
campaigns_db: dict[str, Campaign] = {}
ideas_db: dict[str, CampaignIdea] = {}


@router.get("", response_model=List[Campaign])
async def list_campaigns(
    workspace_id: Optional[str] = None,
    brand_id: Optional[str] = None,
):
    """List all campaigns, optionally filtered."""
    campaigns = list(campaigns_db.values())
    if workspace_id:
        campaigns = [c for c in campaigns if c.workspace_id == workspace_id]
    if brand_id:
        campaigns = [c for c in campaigns if c.brand_id == brand_id]
    return campaigns


@router.post("", response_model=Campaign)
async def create_campaign(campaign_data: CampaignCreate):
    """Create a new campaign."""
    campaign_id = str(uuid4())
    now = datetime.utcnow()

    campaign = Campaign(
        id=campaign_id,
        workspace_id="default",  # TODO: Get from auth
        brand_id=campaign_data.brand_id,
        name=campaign_data.name,
        prompt=campaign_data.prompt,
        status=CampaignStatus.DRAFT,
        target_channels=campaign_data.target_channels or [],
        created_at=now,
        updated_at=now,
    )

    campaigns_db[campaign_id] = campaign
    return campaign


@router.get("/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: str):
    """Get a campaign by ID."""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = campaigns_db[campaign_id]

    # Attach ideas
    campaign_ideas = [i for i in ideas_db.values() if i.campaign_id == campaign_id]
    campaign.ideas = campaign_ideas

    return campaign


@router.put("/{campaign_id}", response_model=Campaign)
async def update_campaign(campaign_id: str, campaign_data: CampaignUpdate):
    """Update a campaign."""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = campaigns_db[campaign_id]
    update_data = campaign_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            setattr(campaign, key, value)

    campaign.updated_at = datetime.utcnow()
    campaigns_db[campaign_id] = campaign

    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete a campaign."""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")

    del campaigns_db[campaign_id]

    # Delete associated ideas
    for idea_id in list(ideas_db.keys()):
        if ideas_db[idea_id].campaign_id == campaign_id:
            del ideas_db[idea_id]

    return {"message": "Campaign deleted"}


@router.post("/{campaign_id}/generate-ideas", response_model=dict)
async def generate_ideas(
    campaign_id: str,
    request: IdeaGenerationRequest,
    background_tasks: BackgroundTasks,
):
    """Generate campaign ideas using AI."""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = campaigns_db[campaign_id]

    # Update status
    campaign.status = CampaignStatus.GENERATING
    campaigns_db[campaign_id] = campaign

    # Create job for background processing
    job_id = str(uuid4())

    # Queue background task
    background_tasks.add_task(
        AIGenerationService.generate_campaign_ideas,
        campaign_id,
        campaign.brand_id,
        request.prompt,
        request.num_ideas,
        request.target_channels,
        job_id,
    )

    return {"job_id": job_id, "status": "processing"}


@router.post("/{campaign_id}/ideas/{idea_id}/generate-copy", response_model=dict)
async def generate_copy_for_idea(
    campaign_id: str,
    idea_id: str,
    background_tasks: BackgroundTasks,
):
    """Generate copy variations for a campaign idea."""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if idea_id not in ideas_db:
        raise HTTPException(status_code=404, detail="Idea not found")

    job_id = str(uuid4())

    background_tasks.add_task(
        AIGenerationService.generate_copy_variations,
        idea_id,
        job_id,
    )

    return {"job_id": job_id, "status": "processing"}


@router.post("/transform-copy", response_model=dict)
async def transform_copy(request: CopyTransformRequest):
    """Transform copy text (shorter, formal, direct, limited)."""
    result = await AIGenerationService.transform_copy(
        text=request.text,
        transform_type=request.transform_type,
        limit=request.limit,
        brand_tone=request.brand_tone,
    )

    return {"transformed_text": result}
