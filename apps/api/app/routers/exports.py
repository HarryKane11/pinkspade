from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional
from uuid import uuid4
from datetime import datetime
import io

from app.models.export import Export, ExportCreate, ExportRequest, ExportFormat, ExportStatus
from app.services.pptx_export import PPTXExportService
from app.services.png_export import PNGExportService

router = APIRouter()

# In-memory storage for demo
exports_db: dict[str, Export] = {}

# Reference to designs (would be imported in production)
from app.routers.designs import designs_db


@router.post("/{design_id}/export", response_model=Export)
async def create_export(
    design_id: str,
    request: ExportRequest,
    background_tasks: BackgroundTasks,
):
    """Create an export job for a design."""
    if design_id not in designs_db:
        raise HTTPException(status_code=404, detail="Design not found")

    export_id = str(uuid4())
    now = datetime.utcnow()

    export = Export(
        id=export_id,
        design_id=design_id,
        format=request.format,
        status=ExportStatus.PENDING,
        created_at=now,
    )

    exports_db[export_id] = export

    # Queue export task based on format
    design = designs_db[design_id]

    if request.format == ExportFormat.PNG:
        background_tasks.add_task(
            PNGExportService.export,
            design.design_json,
            export_id,
        )
    elif request.format == ExportFormat.PPTX:
        background_tasks.add_task(
            PPTXExportService.export,
            design.design_json,
            export_id,
        )
    elif request.format == ExportFormat.JSON:
        # JSON export is synchronous
        export.status = ExportStatus.COMPLETED
        export.file_url = f"/api/exports/{export_id}/download"
        exports_db[export_id] = export
    elif request.format == ExportFormat.ZIP:
        background_tasks.add_task(
            export_zip_package,
            design.design_json,
            export_id,
        )

    return export


@router.get("/{export_id}", response_model=Export)
async def get_export(export_id: str):
    """Get export status and details."""
    if export_id not in exports_db:
        raise HTTPException(status_code=404, detail="Export not found")
    return exports_db[export_id]


@router.get("/{export_id}/download")
async def download_export(export_id: str):
    """Download the exported file."""
    if export_id not in exports_db:
        raise HTTPException(status_code=404, detail="Export not found")

    export = exports_db[export_id]

    if export.status != ExportStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Export not ready")

    # Get design for filename
    design = designs_db.get(export.design_id)
    filename = f"{design.name if design else 'design'}"

    # Generate file based on format
    if export.format == ExportFormat.JSON:
        content = design.design_json if design else {}
        import json
        return StreamingResponse(
            io.BytesIO(json.dumps(content, indent=2, ensure_ascii=False).encode('utf-8')),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
        )

    # For other formats, the file would be stored and served from storage
    # This is a placeholder implementation
    raise HTTPException(status_code=501, detail="File download not implemented for this format")


async def export_zip_package(design_json: dict, export_id: str):
    """Export ZIP package containing PNG, PPTX, and JSON."""
    # This would create a ZIP file with all formats
    # Placeholder implementation

    export = exports_db[export_id]
    export.status = ExportStatus.PROCESSING

    try:
        # Create individual exports
        # ... implementation would go here

        export.status = ExportStatus.COMPLETED
        export.file_url = f"/api/exports/{export_id}/download"
        export.completed_at = datetime.utcnow()

    except Exception as e:
        export.status = ExportStatus.FAILED
        export.error_message = str(e)

    exports_db[export_id] = export
