"""
Background Generation Service

Generates AI backgrounds for photoshoots using Gemini Image API.
"""

import base64
import io
from typing import Optional, List, Dict, Any
from PIL import Image

from app.config import get_settings
from app.routers.jobs import update_job, jobs_db
from app.models.job import JobStatus


class BackgroundGenerationService:
    """Service for generating AI backgrounds and composing photoshoots."""

    @staticmethod
    async def generate(
        prompt: str,
        brand_colors: Optional[List[str]],
        job_id: str,
    ) -> dict:
        """Generate an AI background image."""
        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            settings = get_settings()

            # Build enhanced prompt
            enhanced_prompt = prompt

            # Add brand colors if provided
            if brand_colors:
                color_str = ", ".join(brand_colors)
                enhanced_prompt += f" Use color palette: {color_str}."

            # CRITICAL: Ensure no text
            enhanced_prompt += " NO TEXT, NO LETTERS, NO WORDS, NO LOGOS."

            update_job(job_id, progress=30)

            # Generate with Gemini Image API
            if settings.google_api_key:
                result = await BackgroundGenerationService._generate_with_gemini(
                    enhanced_prompt, settings.google_api_key
                )
            else:
                # Return placeholder
                result = BackgroundGenerationService._generate_placeholder()

            update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                output_data={"background_url": result},
            )

            return {"background_url": result}

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def compose(
        cutout_url: str,
        background_url: str,
        product_position: Optional[dict],
        shadow: bool,
        job_id: str,
    ) -> dict:
        """Compose cutout product onto background."""
        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            # Load images
            cutout_img = await BackgroundGenerationService._load_image(cutout_url)
            background_img = await BackgroundGenerationService._load_image(background_url)

            update_job(job_id, progress=40)

            # Calculate position
            if product_position:
                x = product_position.get("x", 0.5)  # Normalized 0-1
                y = product_position.get("y", 0.5)
                scale = product_position.get("scale", 0.5)
            else:
                x, y, scale = 0.5, 0.6, 0.5  # Default: center-bottom

            # Resize cutout
            bg_w, bg_h = background_img.size
            new_w = int(bg_w * scale)
            ratio = cutout_img.height / cutout_img.width
            new_h = int(new_w * ratio)
            cutout_resized = cutout_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Calculate paste position
            paste_x = int((bg_w * x) - (new_w / 2))
            paste_y = int((bg_h * y) - (new_h / 2))

            update_job(job_id, progress=60)

            # Add shadow if requested
            if shadow and cutout_resized.mode == "RGBA":
                shadow_img = BackgroundGenerationService._create_shadow(cutout_resized)
                background_img.paste(
                    shadow_img,
                    (paste_x + 5, paste_y + 10),
                    shadow_img,
                )

            update_job(job_id, progress=80)

            # Paste cutout
            background_img.paste(cutout_resized, (paste_x, paste_y), cutout_resized)

            # Convert to base64
            buffer = io.BytesIO()
            background_img.save(buffer, format="PNG")
            b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            composed_url = f"data:image/png;base64,{b64}"

            # Create design JSON
            design_json = BackgroundGenerationService._create_design_json(
                background_url,
                cutout_url,
                bg_w,
                bg_h,
                paste_x,
                paste_y,
                new_w,
                new_h,
            )

            update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                output_data={
                    "composed_url": composed_url,
                    "design_json": design_json,
                },
            )

            return {
                "composed_url": composed_url,
                "design_json": design_json,
            }

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def _generate_with_gemini(prompt: str, api_key: str) -> str:
        """Generate image using Gemini Image API."""
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)

            # Note: This is a placeholder - actual Gemini image generation
            # would use the specific image generation model
            # For now, return placeholder
            return BackgroundGenerationService._generate_placeholder()

        except Exception as e:
            print(f"Gemini image generation error: {e}")
            return BackgroundGenerationService._generate_placeholder()

    @staticmethod
    def _generate_placeholder() -> str:
        """Generate a placeholder gradient background."""
        img = Image.new("RGB", (1080, 1080), "#f0f9ff")

        # Create gradient
        for y in range(1080):
            r = int(240 - (y / 1080) * 20)
            g = int(249 - (y / 1080) * 10)
            b = 255
            for x in range(1080):
                img.putpixel((x, y), (r, g, b))

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"

    @staticmethod
    async def _load_image(url: str) -> Image.Image:
        """Load image from URL or base64 data."""
        if url.startswith("data:"):
            # Base64 data URL
            header, data = url.split(",", 1)
            img_bytes = base64.b64decode(data)
            return Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        else:
            # HTTP URL
            import httpx
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content)).convert("RGBA")

    @staticmethod
    def _create_shadow(img: Image.Image) -> Image.Image:
        """Create a shadow image from cutout."""
        # Create black silhouette with transparency
        shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))

        for x in range(img.width):
            for y in range(img.height):
                pixel = img.getpixel((x, y))
                if pixel[3] > 0:  # If not transparent
                    # Set semi-transparent black
                    shadow.putpixel((x, y), (0, 0, 0, int(pixel[3] * 0.3)))

        # Apply blur (simplified)
        from PIL import ImageFilter
        return shadow.filter(ImageFilter.GaussianBlur(radius=10))

    @staticmethod
    def _create_design_json(
        background_url: str,
        cutout_url: str,
        canvas_w: int,
        canvas_h: int,
        product_x: int,
        product_y: int,
        product_w: int,
        product_h: int,
    ) -> dict:
        """Create Design JSON structure from composed photoshoot."""
        from uuid import uuid4
        from datetime import datetime

        now = datetime.utcnow().isoformat()

        return {
            "version": "1.0.0",
            "meta": {
                "id": str(uuid4()),
                "name": "Photoshoot 결과",
                "createdAt": now,
                "updatedAt": now,
                "version": 1,
            },
            "canvas": {
                "width": canvas_w,
                "height": canvas_h,
                "backgroundColor": "#ffffff",
            },
            "layers": [
                {
                    "id": str(uuid4()),
                    "name": "Background",
                    "type": "background",
                    "visible": True,
                    "locked": False,
                    "opacity": 1,
                    "position": {"x": 0, "y": 0},
                    "size": {"width": canvas_w, "height": canvas_h},
                    "backgroundImage": background_url,
                    "backgroundFit": "cover",
                },
                {
                    "id": str(uuid4()),
                    "name": "Product",
                    "type": "product",
                    "visible": True,
                    "locked": False,
                    "opacity": 1,
                    "position": {"x": product_x, "y": product_y},
                    "size": {"width": product_w, "height": product_h},
                    "imageUrl": cutout_url,
                    "shadowEnabled": True,
                    "shadowColor": "rgba(0,0,0,0.3)",
                    "shadowBlur": 10,
                    "shadowOffsetX": 0,
                    "shadowOffsetY": 5,
                },
                # Placeholder text layers for user to edit
                {
                    "id": str(uuid4()),
                    "name": "Headline",
                    "type": "text",
                    "visible": True,
                    "locked": False,
                    "opacity": 1,
                    "position": {"x": 100, "y": 100},
                    "size": {"width": canvas_w - 200, "height": 80},
                    "content": "헤드라인 텍스트",
                    "fontFamily": "Pretendard",
                    "fontSize": 48,
                    "fontWeight": 700,
                    "fontStyle": "normal",
                    "color": "#0f172a",
                    "textAlign": "center",
                    "verticalAlign": "top",
                    "lineHeight": 1.2,
                    "letterSpacing": 0,
                    "textDecoration": "none",
                    "autoFit": True,
                    "brandLocked": False,
                    "overflow": False,
                },
            ],
            "brandLocks": [],
        }
