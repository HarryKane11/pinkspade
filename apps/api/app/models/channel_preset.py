from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ChannelCategory(str, Enum):
    INSTAGRAM = "instagram"
    KAKAO = "kakao"
    NAVER = "naver"
    COUPANG = "coupang"
    GOOGLE = "google"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    CUSTOM = "custom"


class ChannelPreset(BaseModel):
    id: str
    name_ko: str
    name_en: str
    width: int
    height: int
    aspect_ratio: str
    category: ChannelCategory
    description: Optional[str] = None


# Korean market-optimized presets (matching frontend)
CHANNEL_PRESETS = [
    # Instagram
    ChannelPreset(
        id="instagram_feed_1_1",
        name_ko="인스타그램 피드 (정사각)",
        name_en="Instagram Feed Square",
        width=1080,
        height=1080,
        aspect_ratio="1:1",
        category=ChannelCategory.INSTAGRAM,
    ),
    ChannelPreset(
        id="instagram_feed_4_5",
        name_ko="인스타그램 피드 (세로)",
        name_en="Instagram Feed Portrait",
        width=1080,
        height=1350,
        aspect_ratio="4:5",
        category=ChannelCategory.INSTAGRAM,
    ),
    ChannelPreset(
        id="instagram_story",
        name_ko="인스타그램 스토리",
        name_en="Instagram Story",
        width=1080,
        height=1920,
        aspect_ratio="9:16",
        category=ChannelCategory.INSTAGRAM,
    ),
    # Kakao
    ChannelPreset(
        id="kakao_channel_square",
        name_ko="카카오 채널 (정사각)",
        name_en="Kakao Channel Square",
        width=800,
        height=800,
        aspect_ratio="1:1",
        category=ChannelCategory.KAKAO,
    ),
    ChannelPreset(
        id="kakao_talk_wide",
        name_ko="카카오톡 와이드형",
        name_en="KakaoTalk Wide",
        width=800,
        height=400,
        aspect_ratio="2:1",
        category=ChannelCategory.KAKAO,
    ),
    # Naver
    ChannelPreset(
        id="naver_shopping",
        name_ko="네이버 쇼핑 상품",
        name_en="Naver Shopping Product",
        width=1000,
        height=1000,
        aspect_ratio="1:1",
        category=ChannelCategory.NAVER,
    ),
    ChannelPreset(
        id="naver_blog_thumbnail",
        name_ko="네이버 블로그 썸네일",
        name_en="Naver Blog Thumbnail",
        width=1200,
        height=630,
        aspect_ratio="1.91:1",
        category=ChannelCategory.NAVER,
    ),
    # Coupang
    ChannelPreset(
        id="coupang_product",
        name_ko="쿠팡 상품 이미지",
        name_en="Coupang Product",
        width=500,
        height=500,
        aspect_ratio="1:1",
        category=ChannelCategory.COUPANG,
    ),
    # Google
    ChannelPreset(
        id="google_display_300x250",
        name_ko="구글 디스플레이 중형",
        name_en="Google Display Medium Rectangle",
        width=300,
        height=250,
        aspect_ratio="6:5",
        category=ChannelCategory.GOOGLE,
    ),
    # YouTube
    ChannelPreset(
        id="youtube_thumbnail",
        name_ko="유튜브 썸네일",
        name_en="YouTube Thumbnail",
        width=1280,
        height=720,
        aspect_ratio="16:9",
        category=ChannelCategory.YOUTUBE,
    ),
]


def get_preset_by_id(preset_id: str) -> Optional[ChannelPreset]:
    return next((p for p in CHANNEL_PRESETS if p.id == preset_id), None)


def get_presets_by_category(category: ChannelCategory) -> list[ChannelPreset]:
    return [p for p in CHANNEL_PRESETS if p.category == category]
