import { z } from 'zod';

// Channel preset schema
export const ChannelPresetSchema = z.object({
  id: z.string(),
  nameKo: z.string(),
  nameEn: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  aspectRatio: z.string(),
  category: z.enum([
    'instagram',
    'kakao',
    'naver',
    'coupang',
    'google',
    'youtube',
    'facebook',
    'twitter',
    'linkedin',
    'custom',
  ]),
  description: z.string().optional(),
});

export type ChannelPreset = z.infer<typeof ChannelPresetSchema>;

// Korean market-optimized channel presets
export const CHANNEL_PRESETS: ChannelPreset[] = [
  // Instagram
  {
    id: 'instagram_feed_1_1',
    nameKo: '인스타그램 피드 (정사각)',
    nameEn: 'Instagram Feed Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    category: 'instagram',
    description: '인스타그램 피드 게시물 - 정사각형',
  },
  {
    id: 'instagram_feed_4_5',
    nameKo: '인스타그램 피드 (세로)',
    nameEn: 'Instagram Feed Portrait',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    category: 'instagram',
    description: '인스타그램 피드 게시물 - 세로형 (권장)',
  },
  {
    id: 'instagram_story',
    nameKo: '인스타그램 스토리',
    nameEn: 'Instagram Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    category: 'instagram',
    description: '인스타그램 스토리 / 릴스',
  },
  {
    id: 'instagram_reels',
    nameKo: '인스타그램 릴스',
    nameEn: 'Instagram Reels',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    category: 'instagram',
    description: '인스타그램 릴스 커버',
  },

  // Kakao
  {
    id: 'kakao_channel_square',
    nameKo: '카카오 채널 (정사각)',
    nameEn: 'Kakao Channel Square',
    width: 800,
    height: 800,
    aspectRatio: '1:1',
    category: 'kakao',
    description: '카카오톡 채널 메시지 - 정사각형',
  },
  {
    id: 'kakao_talk_wide',
    nameKo: '카카오톡 와이드형',
    nameEn: 'KakaoTalk Wide',
    width: 800,
    height: 400,
    aspectRatio: '2:1',
    category: 'kakao',
    description: '카카오톡 채널 메시지 - 와이드형',
  },
  {
    id: 'kakao_banner',
    nameKo: '카카오 비즈보드 배너',
    nameEn: 'Kakao Biz Board Banner',
    width: 1029,
    height: 258,
    aspectRatio: '4:1',
    category: 'kakao',
    description: '카카오 비즈보드 광고 배너',
  },

  // Naver
  {
    id: 'naver_shopping',
    nameKo: '네이버 쇼핑 상품',
    nameEn: 'Naver Shopping Product',
    width: 1000,
    height: 1000,
    aspectRatio: '1:1',
    category: 'naver',
    description: '네이버 쇼핑 상품 이미지',
  },
  {
    id: 'naver_blog_thumbnail',
    nameKo: '네이버 블로그 썸네일',
    nameEn: 'Naver Blog Thumbnail',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    category: 'naver',
    description: '네이버 블로그 대표 이미지',
  },
  {
    id: 'naver_smartstore',
    nameKo: '네이버 스마트스토어',
    nameEn: 'Naver Smartstore',
    width: 860,
    height: 860,
    aspectRatio: '1:1',
    category: 'naver',
    description: '네이버 스마트스토어 상품 이미지',
  },
  {
    id: 'naver_search_ad',
    nameKo: '네이버 검색광고',
    nameEn: 'Naver Search Ad',
    width: 300,
    height: 250,
    aspectRatio: '6:5',
    category: 'naver',
    description: '네이버 검색광고 배너',
  },

  // Coupang
  {
    id: 'coupang_product',
    nameKo: '쿠팡 상품 이미지',
    nameEn: 'Coupang Product',
    width: 500,
    height: 500,
    aspectRatio: '1:1',
    category: 'coupang',
    description: '쿠팡 상품 대표 이미지',
  },
  {
    id: 'coupang_detail',
    nameKo: '쿠팡 상세페이지',
    nameEn: 'Coupang Detail',
    width: 860,
    height: 1200,
    aspectRatio: '43:60',
    category: 'coupang',
    description: '쿠팡 상품 상세페이지 이미지',
  },

  // Google
  {
    id: 'google_display_300x250',
    nameKo: '구글 디스플레이 중형',
    nameEn: 'Google Display Medium Rectangle',
    width: 300,
    height: 250,
    aspectRatio: '6:5',
    category: 'google',
    description: '구글 디스플레이 광고 - 중형 직사각형',
  },
  {
    id: 'google_display_728x90',
    nameKo: '구글 디스플레이 리더보드',
    nameEn: 'Google Display Leaderboard',
    width: 728,
    height: 90,
    aspectRatio: '728:90',
    category: 'google',
    description: '구글 디스플레이 광고 - 리더보드',
  },
  {
    id: 'google_display_160x600',
    nameKo: '구글 디스플레이 스카이스크래퍼',
    nameEn: 'Google Display Skyscraper',
    width: 160,
    height: 600,
    aspectRatio: '4:15',
    category: 'google',
    description: '구글 디스플레이 광고 - 와이드 스카이스크래퍼',
  },

  // YouTube
  {
    id: 'youtube_thumbnail',
    nameKo: '유튜브 썸네일',
    nameEn: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    category: 'youtube',
    description: '유튜브 동영상 썸네일',
  },
  {
    id: 'youtube_channel_banner',
    nameKo: '유튜브 채널 배너',
    nameEn: 'YouTube Channel Banner',
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    category: 'youtube',
    description: '유튜브 채널 아트',
  },

  // Facebook
  {
    id: 'facebook_post',
    nameKo: '페이스북 게시물',
    nameEn: 'Facebook Post',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    category: 'facebook',
    description: '페이스북 피드 게시물',
  },
  {
    id: 'facebook_story',
    nameKo: '페이스북 스토리',
    nameEn: 'Facebook Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    category: 'facebook',
    description: '페이스북 스토리',
  },

  // Twitter/X
  {
    id: 'twitter_post',
    nameKo: 'X(트위터) 게시물',
    nameEn: 'Twitter/X Post',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    category: 'twitter',
    description: 'X(트위터) 이미지 게시물',
  },

  // LinkedIn
  {
    id: 'linkedin_post',
    nameKo: '링크드인 게시물',
    nameEn: 'LinkedIn Post',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    category: 'linkedin',
    description: '링크드인 피드 게시물',
  },
];

// Helper functions
export function getPresetById(id: string): ChannelPreset | undefined {
  return CHANNEL_PRESETS.find(preset => preset.id === id);
}

export function getPresetsByCategory(category: ChannelPreset['category']): ChannelPreset[] {
  return CHANNEL_PRESETS.filter(preset => preset.category === category);
}

export interface ChannelCategory {
  id: ChannelPreset['category'];
  nameKo: string;
  nameEn: string;
  logo: string; // path under /channel-logos/
}

export const CHANNEL_CATEGORIES: ChannelCategory[] = [
  { id: 'instagram', nameKo: '인스타그램', nameEn: 'Instagram', logo: '/channel-logos/instagram.png' },
  { id: 'kakao', nameKo: '카카오', nameEn: 'Kakao', logo: '/channel-logos/kakao.png' },
  { id: 'naver', nameKo: '네이버', nameEn: 'Naver', logo: '/channel-logos/naver.png' },
  { id: 'coupang', nameKo: '쿠팡', nameEn: 'Coupang', logo: '/channel-logos/coupang.png' },
  { id: 'google', nameKo: '구글', nameEn: 'Google', logo: '/channel-logos/google.png' },
  { id: 'youtube', nameKo: '유튜브', nameEn: 'YouTube', logo: '/channel-logos/youtube.png' },
  { id: 'facebook', nameKo: '페이스북', nameEn: 'Facebook', logo: '/channel-logos/facebook.png' },
  { id: 'twitter', nameKo: 'X(트위터)', nameEn: 'X (Twitter)', logo: '/channel-logos/twitter.png' },
  { id: 'linkedin', nameKo: '링크드인', nameEn: 'LinkedIn', logo: '/channel-logos/linkedin.png' },
  { id: 'custom', nameKo: '맞춤', nameEn: 'Custom', logo: '' },
];

export function getCategories(): ChannelCategory[] {
  return CHANNEL_CATEGORIES;
}

export function getCategoryById(id: string): ChannelCategory | undefined {
  return CHANNEL_CATEGORIES.find((c) => c.id === id);
}
