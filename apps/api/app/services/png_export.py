"""
PNG Export Service

Renders Design JSON to PNG image.
Note: Text is also rendered in the PNG, but PPTX export maintains editability.
"""

from typing import Dict, Any
import io
import base64
from PIL import Image, ImageDraw, ImageFont

from app.routers.jobs import update_job
from app.models.job import JobStatus


class PNGExportService:
    """Service for exporting designs to PNG."""

    @staticmethod
    async def export(design_json: Dict[str, Any], job_id: str) -> bytes:
        """Export Design JSON to PNG image."""
        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            # Get canvas dimensions
            canvas = design_json.get("canvas", {})
            width = canvas.get("width", 1080)
            height = canvas.get("height", 1080)
            bg_color = canvas.get("backgroundColor", "#ffffff")

            # Create image
            img = Image.new("RGBA", (width, height), bg_color)
            draw = ImageDraw.Draw(img)

            update_job(job_id, progress=20)

            # Process layers
            layers = design_json.get("layers", [])
            total_layers = len(layers)

            for i, layer in enumerate(layers):
                if not layer.get("visible", True):
                    continue

                layer_type = layer.get("type")

                if layer_type == "background":
                    await PNGExportService._render_background(img, layer)
                elif layer_type == "text":
                    PNGExportService._render_text(img, draw, layer)
                elif layer_type == "shape":
                    PNGExportService._render_shape(draw, layer)
                elif layer_type in ["image", "product"]:
                    await PNGExportService._render_image(img, layer)

                progress = 20 + int((i + 1) / total_layers * 70)
                update_job(job_id, progress=progress)

            update_job(job_id, progress=95)

            # Save to bytes
            output = io.BytesIO()
            img.save(output, format="PNG", optimize=True)
            output.seek(0)

            update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                output_data={"format": "png"},
            )

            return output.getvalue()

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def _render_background(img: Image.Image, layer: Dict):
        """Render background layer."""
        bg_image_url = layer.get("backgroundImage")
        if not bg_image_url:
            return

        try:
            bg_img = await PNGExportService._load_image(bg_image_url)
            bg_img = bg_img.resize(img.size, Image.Resampling.LANCZOS)
            img.paste(bg_img, (0, 0))
        except Exception as e:
            print(f"Failed to render background: {e}")

    @staticmethod
    def _render_text(img: Image.Image, draw: ImageDraw.Draw, layer: Dict):
        """Render text layer."""
        position = layer.get("position", {})
        size = layer.get("size", {})
        x = position.get("x", 0)
        y = position.get("y", 0)
        width = size.get("width", 200)

        text = layer.get("content", "")
        font_size = layer.get("fontSize", 16)
        color = layer.get("color", "#000000")
        text_align = layer.get("textAlign", "left")

        # Try to load font
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
            except:
                font = ImageFont.load_default()

        # Calculate text position based on alignment
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]

        if text_align == "center":
            x = x + (width - text_width) / 2
        elif text_align == "right":
            x = x + width - text_width

        # Apply opacity
        opacity = int(layer.get("opacity", 1) * 255)
        if color.startswith("#"):
            r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
            color = (r, g, b, opacity)

        draw.text((x, y), text, font=font, fill=color)

    @staticmethod
    def _render_shape(draw: ImageDraw.Draw, layer: Dict):
        """Render shape layer."""
        position = layer.get("position", {})
        size = layer.get("size", {})
        x1 = position.get("x", 0)
        y1 = position.get("y", 0)
        x2 = x1 + size.get("width", 100)
        y2 = y1 + size.get("height", 100)

        shape_type = layer.get("shapeType", "rectangle")
        fill = layer.get("fill")
        stroke = layer.get("stroke")
        stroke_width = layer.get("strokeWidth", 0)

        if shape_type == "rectangle":
            if fill:
                draw.rectangle([x1, y1, x2, y2], fill=fill, outline=stroke, width=stroke_width)
            elif stroke:
                draw.rectangle([x1, y1, x2, y2], outline=stroke, width=stroke_width)
        elif shape_type == "ellipse":
            if fill:
                draw.ellipse([x1, y1, x2, y2], fill=fill, outline=stroke, width=stroke_width)
            elif stroke:
                draw.ellipse([x1, y1, x2, y2], outline=stroke, width=stroke_width)

    @staticmethod
    async def _render_image(img: Image.Image, layer: Dict):
        """Render image or product layer."""
        image_url = layer.get("imageUrl") or layer.get("backgroundImage")
        if not image_url:
            return

        position = layer.get("position", {})
        size = layer.get("size", {})
        x = int(position.get("x", 0))
        y = int(position.get("y", 0))
        width = int(size.get("width", 200))
        height = int(size.get("height", 200))

        try:
            layer_img = await PNGExportService._load_image(image_url)
            layer_img = layer_img.resize((width, height), Image.Resampling.LANCZOS)

            # Handle transparency
            if layer_img.mode == "RGBA":
                img.paste(layer_img, (x, y), layer_img)
            else:
                img.paste(layer_img, (x, y))

        except Exception as e:
            print(f"Failed to render image: {e}")

    @staticmethod
    async def _load_image(url: str) -> Image.Image:
        """Load image from URL or base64."""
        if url.startswith("data:"):
            header, data = url.split(",", 1)
            img_bytes = base64.b64decode(data)
            return Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        else:
            import httpx
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content)).convert("RGBA")
