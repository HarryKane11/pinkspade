"""
AI Generation Service

Uses Gemini API for campaign idea generation and copy transformation.
"""

import json
import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import uuid4

from app.config import get_settings
from app.routers.jobs import create_job, update_job, jobs_db
from app.models.job import JobStatus


class AIGenerationService:
    """Service for AI-powered content generation."""

    @staticmethod
    async def generate_campaign_ideas(
        campaign_id: str,
        brand_id: str,
        prompt: str,
        num_ideas: int,
        target_channels: Optional[List[str]],
        job_id: str,
    ) -> List[Dict[str, Any]]:
        """Generate campaign ideas using Gemini."""
        from app.routers.campaigns import campaigns_db, ideas_db
        from app.routers.brands import brand_dna_db
        from app.models.campaign import CampaignIdea, CopyPack, CopyVariation, CampaignStatus

        job = jobs_db.get(job_id)
        if not job:
            job = create_job("generate_ideas", {"campaign_id": campaign_id, "prompt": prompt})

        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            # Get brand DNA for context
            brand_dna = None
            dna_list = [d for d in brand_dna_db.values() if d.brand_id == brand_id and d.is_current]
            if dna_list:
                brand_dna = dna_list[0]

            update_job(job_id, progress=20)

            # Build prompt for Gemini
            ai_prompt = AIGenerationService._build_idea_prompt(
                prompt, brand_dna, num_ideas, target_channels
            )

            update_job(job_id, progress=30)

            # Call Gemini
            ideas_data = await AIGenerationService._call_gemini(ai_prompt)

            update_job(job_id, progress=70)

            # Parse and create ideas
            generated_ideas = []
            for i, idea_data in enumerate(ideas_data[:num_ideas]):
                idea_id = str(uuid4())
                now = datetime.utcnow()

                idea = CampaignIdea(
                    id=idea_id,
                    campaign_id=campaign_id,
                    channel_preset_id=target_channels[i % len(target_channels)] if target_channels else None,
                    title=idea_data.get("title", f"아이디어 {i + 1}"),
                    concept=idea_data.get("concept", ""),
                    target_message=idea_data.get("target_message", ""),
                    visual_direction=idea_data.get("visual_direction", ""),
                    copy_pack=CopyPack(
                        headline=CopyVariation(
                            original=idea_data.get("headline", "헤드라인"),
                        ),
                        description=CopyVariation(
                            original=idea_data.get("description", "설명"),
                        ),
                        cta=CopyVariation(
                            original=idea_data.get("cta", "시작하기"),
                        ),
                    ),
                    created_at=now,
                )

                ideas_db[idea_id] = idea
                generated_ideas.append(idea)

            # Update campaign status
            if campaign_id in campaigns_db:
                campaign = campaigns_db[campaign_id]
                campaign.status = CampaignStatus.ACTIVE
                campaign.ideas = generated_ideas
                campaigns_db[campaign_id] = campaign

            update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                output_data={"idea_ids": [i.id for i in generated_ideas]},
            )

            return [i.model_dump() for i in generated_ideas]

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def generate_copy_variations(idea_id: str, job_id: str) -> Dict[str, Any]:
        """Generate copy variations for an idea."""
        from app.routers.campaigns import ideas_db
        from app.models.campaign import CopyVariation

        job = jobs_db.get(job_id)
        if not job:
            job = create_job("generate_copy", {"idea_id": idea_id})

        try:
            update_job(job_id, status=JobStatus.RUNNING, progress=10)

            if idea_id not in ideas_db:
                raise ValueError("Idea not found")

            idea = ideas_db[idea_id]

            # Generate variations for each copy element
            for attr in ["headline", "description", "cta"]:
                copy_var = getattr(idea.copy_pack, attr)
                original = copy_var.original

                # Generate variations
                copy_var.shorter = await AIGenerationService.transform_copy(
                    original, "shorter"
                )
                copy_var.formal = await AIGenerationService.transform_copy(
                    original, "formal"
                )
                copy_var.direct = await AIGenerationService.transform_copy(
                    original, "direct"
                )

                setattr(idea.copy_pack, attr, copy_var)

            ideas_db[idea_id] = idea

            update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                output_data={"idea_id": idea_id},
            )

            return idea.copy_pack.model_dump()

        except Exception as e:
            update_job(job_id, error_message=str(e))
            raise

    @staticmethod
    async def transform_copy(
        text: str,
        transform_type: str,
        limit: Optional[int] = None,
        brand_tone: Optional[str] = None,
    ) -> str:
        """Transform copy text based on type."""
        settings = get_settings()

        if not settings.google_api_key:
            # Fallback transformations
            if transform_type == "shorter":
                words = text.split()
                return " ".join(words[: len(words) // 2 + 1])
            elif transform_type == "limited" and limit:
                return text[:limit]
            return text

        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.google_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompts = {
                "shorter": f"다음 텍스트를 의미는 유지하면서 더 짧게 만들어주세요. 원문의 절반 이하 길이로:\n{text}",
                "formal": f"다음 텍스트를 더 공손하고 격식있게 바꿔주세요:\n{text}",
                "direct": f"다음 텍스트를 더 직설적이고 간결하게 바꿔주세요:\n{text}",
                "limited": f"다음 텍스트를 {limit}자 이내로 줄여주세요. 핵심 메시지는 유지:\n{text}",
            }

            prompt = prompts.get(transform_type, prompts["shorter"])

            if brand_tone:
                prompt += f"\n\n브랜드 톤: {brand_tone}"

            prompt += "\n\n변환된 텍스트만 출력해주세요. 추가 설명 없이 결과만:"

            response = model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            print(f"Transform error: {e}")
            return text

    @staticmethod
    def _build_idea_prompt(
        user_prompt: str,
        brand_dna: Optional[Any],
        num_ideas: int,
        target_channels: Optional[List[str]],
    ) -> str:
        """Build the AI prompt for idea generation."""
        brand_context = ""
        if brand_dna:
            brand_context = f"""
브랜드 정보:
- 이름: {brand_dna.name}
- 톤: {brand_dna.tone.style} - {brand_dna.tone.description}
- 키워드: {', '.join(brand_dna.tone.keywords)}
- 주요 색상: {brand_dna.colors.primary}
"""

        channel_context = ""
        if target_channels:
            channel_context = f"타겟 채널: {', '.join(target_channels)}"

        return f"""
당신은 한국 마케팅 전문가입니다. 다음 캠페인 요청에 대해 {num_ideas}개의 창의적인 아이디어를 생성해주세요.

캠페인 요청:
{user_prompt}

{brand_context}
{channel_context}

각 아이디어는 다음 JSON 배열 형식으로 출력해주세요:
[
  {{
    "title": "아이디어 제목 (짧고 임팩트 있게)",
    "concept": "컨셉 설명 (1-2문장)",
    "target_message": "핵심 메시지",
    "visual_direction": "시각적 방향성 (이미지, 색상, 구성 등)",
    "headline": "헤드라인 카피 (임팩트 있게)",
    "description": "서브 카피 (1-2문장)",
    "cta": "CTA 버튼 텍스트"
  }}
]

한국어로 작성하고, 한국 시장에 맞는 감각으로 작성해주세요.
JSON만 출력하고 다른 설명은 하지 마세요.
"""

    @staticmethod
    async def _call_gemini(prompt: str) -> List[Dict[str, Any]]:
        """Call Gemini API and parse JSON response."""
        settings = get_settings()

        if not settings.google_api_key:
            # Return mock data if no API key
            return [
                {
                    "title": "신선함을 담다",
                    "concept": "제품의 신선함과 품질을 강조하는 캠페인",
                    "target_message": "매일 신선하게, 당신의 일상을 채우다",
                    "visual_direction": "밝고 깨끗한 배경에 제품을 중심으로 배치",
                    "headline": "신선함이 다르다",
                    "description": "최상의 품질로 당신의 하루를 시작하세요",
                    "cta": "지금 만나보기",
                },
                {
                    "title": "당신을 위한 특별함",
                    "concept": "개인화된 경험을 제공하는 프리미엄 접근",
                    "target_message": "당신만을 위해 준비한 특별한 경험",
                    "visual_direction": "고급스러운 톤의 미니멀한 구성",
                    "headline": "특별한 당신에게",
                    "description": "프리미엄 경험을 지금 시작하세요",
                    "cta": "경험하기",
                },
                {
                    "title": "일상의 변화",
                    "concept": "일상에 긍정적 변화를 가져오는 제품",
                    "target_message": "작은 변화가 큰 차이를 만듭니다",
                    "visual_direction": "따뜻한 톤의 라이프스타일 이미지",
                    "headline": "변화를 시작하세요",
                    "description": "더 나은 내일을 위한 첫 걸음",
                    "cta": "시작하기",
                },
            ]

        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.google_api_key)
            model = genai.GenerativeModel("gemini-1.5-pro")

            response = model.generate_content(prompt)

            # Parse JSON from response
            text = response.text

            # Try to find JSON array in response
            json_match = re.search(r"\[[\s\S]*\]", text)
            if json_match:
                return json.loads(json_match.group())

            return []

        except Exception as e:
            print(f"Gemini API error: {e}")
            return []
