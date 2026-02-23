from fastapi import APIRouter, HTTPException
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from app.models.design import (
    Design,
    DesignCreate,
    DesignUpdate,
    DesignVersion,
    DesignStatus,
    LayerUpdate,
    CopyTransformLayerRequest,
)
from app.services.ai_generation import AIGenerationService

router = APIRouter()

# In-memory storage for demo
designs_db: dict[str, Design] = {}
versions_db: dict[str, DesignVersion] = {}


@router.get("", response_model=List[Design])
async def list_designs(
    campaign_id: Optional[str] = None,
    brand_id: Optional[str] = None,
):
    """List all designs, optionally filtered."""
    designs = list(designs_db.values())
    if campaign_id:
        designs = [d for d in designs if d.campaign_id == campaign_id]
    if brand_id:
        designs = [d for d in designs if d.brand_id == brand_id]
    return designs


@router.post("", response_model=Design)
async def create_design(design_data: DesignCreate):
    """Create a new design."""
    design_id = str(uuid4())
    now = datetime.utcnow()

    design = Design(
        id=design_id,
        campaign_id=design_data.campaign_id,
        brand_id=design_data.brand_id,
        channel_preset_id=design_data.channel_preset_id,
        name=design_data.name,
        status=DesignStatus.DRAFT,
        design_json=design_data.design_json,
        current_version=1,
        created_at=now,
        updated_at=now,
    )

    # Create initial version
    version_id = str(uuid4())
    version = DesignVersion(
        id=version_id,
        design_id=design_id,
        version=1,
        design_json=design_data.design_json,
        created_at=now,
    )

    designs_db[design_id] = design
    versions_db[version_id] = version

    return design


@router.get("/{design_id}", response_model=Design)
async def get_design(design_id: str):
    """Get a design by ID."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")
    return designs_db[design_id]


@router.put("/{design_id}", response_model=Design)
async def update_design(design_id: str, design_data: DesignUpdate):
    """Update a design (creates new version if design_json changes)."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    design = designs_db[design_id]
    now = datetime.utcnow()

    # Check if design_json is being updated
    if design_data.design_json is not None:
        # Create new version
        new_version_num = design.current_version + 1
        version_id = str(uuid4())

        version = DesignVersion(
            id=version_id,
            design_id=design_id,
            version=new_version_num,
            design_json=design_data.design_json,
            created_at=now,
        )
        versions_db[version_id] = version

        design.design_json = design_data.design_json
        design.current_version = new_version_num

    # Update other fields
    if design_data.name is not None:
        design.name = design_data.name
    if design_data.status is not None:
        design.status = design_data.status

    design.updated_at = now
    designs_db[design_id] = design

    return design


@router.delete("/{design_id}")
async def delete_design(design_id: str):
    """Delete a design."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    del designs_db[design_id]

    # Delete associated versions
    for version_id in list(versions_db.keys()):
        if versions_db[version_id].design_id == design_id:
            del versions_db[version_id]

    return {"message": "Design deleted"}


@router.get("/{design_id}/versions", response_model=List[DesignVersion])
async def list_design_versions(design_id: str):
    """List all versions of a design."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    versions = [v for v in versions_db.values() if v.design_id == design_id]
    return sorted(versions, key=lambda v: v.version, reverse=True)


@router.get("/{design_id}/versions/{version}", response_model=DesignVersion)
async def get_design_version(design_id: str, version: int):
    """Get a specific version of a design."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    version_obj = next(
        (v for v in versions_db.values() if v.design_id == design_id and v.version == version),
        None,
    )

    if not version_obj:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")

    return version_obj


@router.put("/{design_id}/layers/{layer_id}", response_model=Design)
async def update_layer(design_id: str, layer_id: str, layer_data: LayerUpdate):
    """Update a specific layer in the design."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    design = designs_db[design_id]
    design_json = design.design_json

    # Find and update the layer
    layers = design_json.get("layers", [])
    layer_index = next((i for i, l in enumerate(layers) if l.get("id") == layer_id), None)

    if layer_index is None:
        raise HTTPException(status_code=404, detail="Layer not found")

    # Update layer
    for key, value in layer_data.updates.items():
        layers[layer_index][key] = value

    design_json["layers"] = layers

    # Update design (creates new version)
    return await update_design(design_id, DesignUpdate(design_json=design_json))


@router.post("/{design_id}/layers/{layer_id}/transform-copy", response_model=dict)
async def transform_layer_copy(
    design_id: str,
    layer_id: str,
    request: CopyTransformLayerRequest,
):
    """Transform copy in a text layer."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    design = designs_db[design_id]
    layers = design.design_json.get("layers", [])

    layer = next((l for l in layers if l.get("id") == layer_id), None)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")

    if layer.get("type") != "text":
        raise HTTPException(status_code=400, detail="Layer is not a text layer")

    original_text = layer.get("content", "")

    # Transform the text
    transformed = await AIGenerationService.transform_copy(
        text=original_text,
        transform_type=request.transform_type,
        limit=request.limit,
    )

    return {
        "original": original_text,
        "transformed": transformed,
        "transform_type": request.transform_type,
    }
