"""
Cutout Service (누끼)

Removes background from product images using:
1. Photoroom API (primary)
2. remove.bg API (fallback)
"""

import httpx
from typing import Optional
import base64
import io

from app.config import get_settings
from app.routers.jobs import update_job, jobs_db
from app.models.job import JobStatus


class CutoutService:
    """Service for removing backgrounds from product images."""

    @staticmethod
    async def process_cutout(image_url: str, job_id: str) -> dict:
        """Process cutout from image URL."""
        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            # Download image
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                image_bytes = response.content

            update_job(job_id, progress=30)

            # Process cutout
            result = await CutoutService._process(image_bytes, job_id)

            return result

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def process_cutout_from_bytes(
        image_bytes: bytes,
        filename: str,
        job_id: str,
    ) -> dict:
        """Process cutout from uploaded image bytes."""
        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            result = await CutoutService._process(image_bytes, job_id)

            return result

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def _process(image_bytes: bytes, job_id: str) -> dict:
        """Internal processing with fallback logic."""
        settings = get_settings()

        # Try Photoroom first
        if settings.photoroom_api_key:
            try:
                result = await CutoutService._photoroom_cutout(
                    image_bytes, settings.photoroom_api_key
                )
                update_job(
                    job_id,
                    status=JobStatus.COMPLETED,
                    progress=100,
                    output_data={"provider": "photoroom", "cutout_url": result},
                )
                return {"cutout_url": result, "provider": "photoroom"}
            except Exception as e:
                print(f"Photoroom failed: {e}, trying fallback...")

        update_job(job_id, progress=50)

        # Fallback to remove.bg
        if settings.removebg_api_key:
            try:
                result = await CutoutService._removebg_cutout(
                    image_bytes, settings.removebg_api_key
                )
                update_job(
                    job_id,
                    status=JobStatus.COMPLETED,
                    progress=100,
                    output_data={"provider": "removebg", "cutout_url": result},
                )
                return {"cutout_url": result, "provider": "removebg"}
            except Exception as e:
                print(f"Remove.bg failed: {e}")

        # Both failed
        update_job(job_id, error_message="All cutout providers failed")
        raise Exception("All cutout providers failed")

    @staticmethod
    async def _photoroom_cutout(image_bytes: bytes, api_key: str) -> str:
        """Use Photoroom API for background removal."""
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://sdk.photoroom.com/v1/segment",
                headers={
                    "x-api-key": api_key,
                },
                files={
                    "image_file": ("image.png", image_bytes, "image/png"),
                },
            )

            if response.status_code != 200:
                raise Exception(f"Photoroom API error: {response.status_code}")

            # Return base64 data URL
            result_bytes = response.content
            b64 = base64.b64encode(result_bytes).decode("utf-8")
            return f"data:image/png;base64,{b64}"

    @staticmethod
    async def _removebg_cutout(image_bytes: bytes, api_key: str) -> str:
        """Use remove.bg API for background removal."""
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.remove.bg/v1.0/removebg",
                headers={
                    "X-Api-Key": api_key,
                },
                files={
                    "image_file": ("image.png", image_bytes, "image/png"),
                },
                data={
                    "size": "auto",
                    "format": "png",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Remove.bg API error: {response.status_code}")

            # Return base64 data URL
            result_bytes = response.content
            b64 = base64.b64encode(result_bytes).decode("utf-8")
            return f"data:image/png;base64,{b64}"
