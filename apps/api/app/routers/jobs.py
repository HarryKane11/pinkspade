from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

from app.models.job import Job, JobStatus

router = APIRouter()

# In-memory storage for demo (shared across services)
jobs_db: dict[str, Job] = {}


def create_job(job_type: str, input_data: dict = None) -> Job:
    """Helper to create a new job."""
    from uuid import uuid4

    job_id = str(uuid4())
    now = datetime.utcnow()

    job = Job(
        id=job_id,
        type=job_type,
        status=JobStatus.PENDING,
        progress=0,
        input_data=input_data or {},
        created_at=now,
        updated_at=now,
    )

    jobs_db[job_id] = job
    return job


def update_job(
    job_id: str,
    status: JobStatus = None,
    progress: int = None,
    output_data: dict = None,
    error_message: str = None,
) -> Optional[Job]:
    """Helper to update a job."""
    if job_id not in jobs_db:
        return None

    job = jobs_db[job_id]

    if status is not None:
        job.status = status
    if progress is not None:
        job.progress = progress
    if output_data is not None:
        job.output_data = output_data
    if error_message is not None:
        job.error_message = error_message
        job.status = JobStatus.FAILED

    job.updated_at = datetime.utcnow()

    if status == JobStatus.COMPLETED:
        job.completed_at = datetime.utcnow()
        job.progress = 100

    jobs_db[job_id] = job
    return job


@router.get("", response_model=List[Job])
async def list_jobs(
    status: Optional[JobStatus] = None,
    job_type: Optional[str] = None,
    limit: int = 50,
):
    """List all jobs, optionally filtered."""
    jobs = list(jobs_db.values())

    if status:
        jobs = [j for j in jobs if j.status == status]
    if job_type:
        jobs = [j for j in jobs if j.type == job_type]

    # Sort by created_at descending
    jobs = sorted(jobs, key=lambda j: j.created_at, reverse=True)

    return jobs[:limit]


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    """Get job status and details."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_db[job_id]


@router.delete("/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a pending or running job."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_db[job_id]

    if job.status not in [JobStatus.PENDING, JobStatus.RUNNING]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or failed job")

    job.status = JobStatus.FAILED
    job.error_message = "Cancelled by user"
    job.updated_at = datetime.utcnow()
    jobs_db[job_id] = job

    return {"message": "Job cancelled"}


# Export helper functions for other services
__all__ = ["create_job", "update_job", "jobs_db"]
