"""
Brand DNA Extraction Service

Analyzes websites to extract brand colors, fonts, and tone using
BeautifulSoup and Gemini API.
"""

import httpx
from bs4 import BeautifulSoup
from typing import Optional, List, Dict, Any
import re
import json
from datetime import datetime
from uuid import uuid4

from app.config import get_settings
from app.routers.jobs import create_job, update_job, jobs_db
from app.models.job import JobStatus


class BrandDNAService:
    """Service for extracting Brand DNA from websites."""

    @staticmethod
    async def extract_from_url(
        brand_id: str,
        url: str,
        job_id: str,
    ) -> Dict[str, Any]:
        """
        Extract Brand DNA from a website URL.

        1. Fetch HTML content
        2. Parse with BeautifulSoup
        3. Extract colors, fonts, and content
        4. Use Gemini to analyze tone and style
        """
        from app.routers.brands import brand_dna_db, brands_db

        job = jobs_db.get(job_id)
        if not job:
            job = create_job("extract_brand_dna", {"brand_id": brand_id, "url": url})

        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            # Fetch website
            async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
                response = await client.get(url)
                response.raise_for_status()

            update_job(job_id, progress=30)

            # Parse HTML
            soup = BeautifulSoup(response.text, "lxml")

            # Extract colors from CSS
            colors = BrandDNAService._extract_colors(soup, response.text)
            update_job(job_id, progress=50)

            # Extract fonts
            fonts = BrandDNAService._extract_fonts(soup, response.text)
            update_job(job_id, progress=60)

            # Extract text content for tone analysis
            text_content = BrandDNAService._extract_text_content(soup)
            update_job(job_id, progress=70)

            # Analyze tone with AI
            tone = await BrandDNAService._analyze_tone(text_content, url)
            update_job(job_id, progress=90)

            # Build Brand DNA
            now = datetime.utcnow()
            dna_id = str(uuid4())

            # Get existing versions
            existing = [d for d in brand_dna_db.values() if d.brand_id == brand_id]
            new_version = len(existing) + 1

            # Mark existing as not current
            for dna in existing:
                dna.is_current = False
                brand_dna_db[dna.id] = dna

            from app.models.brand import BrandDNA, ColorPalette, Typography, Tone

            brand_dna = BrandDNA(
                id=dna_id,
                brand_id=brand_id,
                version=new_version,
                is_current=True,
                name=brands_db[brand_id].name if brand_id in brands_db else "Brand",
                colors=ColorPalette(
                    primary=colors.get("primary", "#0ea5e9"),
                    secondary=colors.get("secondary"),
                    accent=colors.get("accent"),
                    background=colors.get("background", "#ffffff"),
                    text=colors.get("text", "#000000"),
                    additional=colors.get("additional", []),
                ),
                typography=Typography(
                    heading_font=fonts.get("heading", "Pretendard"),
                    body_font=fonts.get("body", "Pretendard"),
                    heading_weight=700,
                    body_weight=400,
                ),
                tone=Tone(
                    style=tone.get("style", "professional"),
                    description=tone.get("description", "전문적인 톤"),
                    keywords=tone.get("keywords", []),
                ),
                website_url=url,
                extracted_at=now,
                created_at=now,
                updated_at=now,
            )

            brand_dna_db[dna_id] = brand_dna

            # Update brand's current DNA reference
            if brand_id in brands_db:
                brand = brands_db[brand_id]
                brand.current_dna_id = dna_id
                brands_db[brand_id] = brand

            update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                output_data={"dna_id": dna_id, "version": new_version},
            )

            return {"dna_id": dna_id}

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    def _extract_colors(soup: BeautifulSoup, html: str) -> Dict[str, Any]:
        """Extract colors from CSS and inline styles."""
        colors = []

        # Common color patterns
        hex_pattern = re.compile(r"#([0-9a-fA-F]{3}){1,2}\b")
        rgb_pattern = re.compile(r"rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)")

        # Find all style tags and inline styles
        style_content = ""
        for style in soup.find_all("style"):
            style_content += style.get_text()

        # Also check inline styles
        for elem in soup.find_all(style=True):
            style_content += elem.get("style", "")

        # Extract hex colors
        hex_colors = hex_pattern.findall(style_content)
        colors.extend([f"#{c}" if not c.startswith("#") else c for c in hex_colors])

        # Extract RGB colors and convert to hex
        rgb_colors = rgb_pattern.findall(style_content)
        for rgb in rgb_colors:
            try:
                nums = re.findall(r"\d+", rgb)
                if len(nums) == 3:
                    hex_color = "#{:02x}{:02x}{:02x}".format(
                        int(nums[0]), int(nums[1]), int(nums[2])
                    )
                    colors.append(hex_color)
            except:
                pass

        # Dedupe and sort by frequency
        color_freq = {}
        for c in colors:
            c = c.lower()
            if c not in ["#fff", "#ffffff", "#000", "#000000"]:  # Skip black/white
                color_freq[c] = color_freq.get(c, 0) + 1

        sorted_colors = sorted(color_freq.items(), key=lambda x: x[1], reverse=True)
        unique_colors = [c[0] for c in sorted_colors[:10]]

        return {
            "primary": unique_colors[0] if unique_colors else "#0ea5e9",
            "secondary": unique_colors[1] if len(unique_colors) > 1 else None,
            "accent": unique_colors[2] if len(unique_colors) > 2 else None,
            "background": "#ffffff",
            "text": "#0f172a",
            "additional": unique_colors[3:] if len(unique_colors) > 3 else [],
        }

    @staticmethod
    def _extract_fonts(soup: BeautifulSoup, html: str) -> Dict[str, str]:
        """Extract font families from CSS."""
        fonts = []

        # Font-family pattern
        font_pattern = re.compile(r"font-family\s*:\s*([^;]+)")

        # Find in style tags
        for style in soup.find_all("style"):
            matches = font_pattern.findall(style.get_text())
            for match in matches:
                # Clean and extract first font
                font = match.split(",")[0].strip().strip("'\"")
                if font and not font.startswith("-"):
                    fonts.append(font)

        # Check for common Korean fonts
        korean_fonts = ["Pretendard", "Noto Sans KR", "Spoqa Han Sans", "나눔고딕", "맑은 고딕"]
        for font in korean_fonts:
            if font.lower() in html.lower():
                fonts.insert(0, font)

        # Dedupe
        seen = set()
        unique_fonts = []
        for f in fonts:
            if f not in seen:
                seen.add(f)
                unique_fonts.append(f)

        return {
            "heading": unique_fonts[0] if unique_fonts else "Pretendard",
            "body": unique_fonts[1] if len(unique_fonts) > 1 else unique_fonts[0] if unique_fonts else "Pretendard",
        }

    @staticmethod
    def _extract_text_content(soup: BeautifulSoup) -> str:
        """Extract main text content for tone analysis."""
        # Remove scripts and styles
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # Get text
        text = soup.get_text(separator=" ", strip=True)

        # Limit length
        return text[:5000]

    @staticmethod
    async def _analyze_tone(text: str, url: str) -> Dict[str, Any]:
        """Analyze brand tone using Gemini API."""
        settings = get_settings()

        if not settings.google_api_key:
            # Return default if no API key
            return {
                "style": "professional",
                "description": "전문적이고 신뢰감 있는 톤",
                "keywords": ["전문성", "신뢰", "품질"],
            }

        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.google_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
            다음 웹사이트 텍스트를 분석하여 브랜드의 톤과 스타일을 파악해주세요.
            웹사이트 URL: {url}

            텍스트:
            {text[:2000]}

            다음 JSON 형식으로 응답해주세요:
            {{
                "style": "formal/casual/professional/friendly/playful/luxurious 중 하나",
                "description": "브랜드 톤에 대한 한국어 설명 (1-2문장)",
                "keywords": ["톤을 설명하는", "한국어 키워드", "3-5개"]
            }}
            """

            response = model.generate_content(prompt)

            # Parse JSON from response
            try:
                # Try to extract JSON from response
                text = response.text
                json_match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass

            return {
                "style": "professional",
                "description": "전문적이고 신뢰감 있는 톤",
                "keywords": ["전문성", "신뢰", "품질"],
            }

        except Exception as e:
            print(f"Tone analysis error: {e}")
            return {
                "style": "professional",
                "description": "전문적이고 신뢰감 있는 톤",
                "keywords": ["전문성", "신뢰", "품질"],
            }
