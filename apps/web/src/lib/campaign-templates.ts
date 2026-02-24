// Industry-specific campaign template library
// Templates pre-fill CampaignData fields so users can start from a template instead of from scratch.

export interface CampaignTemplate {
  id: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  industry: string; // matches onboarding industry IDs
  icon: string; // lucide icon name
  // Pre-filled campaign data
  channelPresetIds: string[]; // which channel formats to auto-check
  moods: string[]; // up to 3
  promptTemplate: string; // Korean, with {brandName} placeholder
  headlineTemplate: string; // with {brandName} placeholder
  descriptionTemplate: string;
  modelId: string;
  variationCount: number;
  tags: string[]; // for filtering/search
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  // ─── Beauty / Fashion ──────────────────────────────────────
  {
    id: 'beauty-insta-campaign',
    nameKo: '인스타 뷰티 캠페인',
    nameEn: 'Instagram Beauty Campaign',
    descriptionKo: '인스타그램 피드와 스토리를 활용한 뷰티 제품 런칭 캠페인',
    industry: 'beauty',
    icon: 'Sparkles',
    channelPresetIds: [
      'instagram_feed_1_1',
      'instagram_feed_4_5',
      'instagram_story',
    ],
    moods: ['luxury', 'elegant', 'minimal'],
    promptTemplate:
      '{brandName}의 신규 뷰티 제품을 위한 감각적인 비주얼. 제품의 프리미엄한 질감과 컬러를 강조하며, 세련된 라이프스타일을 담은 이미지.',
    headlineTemplate: '{brandName} 뷰티 신제품 출시',
    descriptionTemplate:
      '당신의 아름다움을 완성할 새로운 컬렉션을 만나보세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['뷰티', '인스타그램', '런칭', '패션'],
  },
  {
    id: 'beauty-naver-detail',
    nameKo: '네이버 뷰티 상세페이지',
    nameEn: 'Naver Beauty Detail Page',
    descriptionKo:
      '네이버 쇼핑·스마트스토어·쿠팡용 뷰티 제품 상세 이미지 패키지',
    industry: 'beauty',
    icon: 'Sparkles',
    channelPresetIds: [
      'naver_shopping',
      'naver_smartstore',
      'coupang_product',
      'coupang_detail',
    ],
    moods: ['warm', 'natural', 'elegant'],
    promptTemplate:
      '{brandName} 뷰티 제품의 상세페이지용 고퀄리티 이미지. 제품 성분, 사용감, 비포&애프터를 시각적으로 전달하는 클린한 레이아웃.',
    headlineTemplate: '{brandName} 베스트셀러',
    descriptionTemplate:
      '검증된 성분, 확실한 효과. 지금 만나보세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['뷰티', '상세페이지', '네이버', '쿠팡', '이커머스'],
  },
  {
    id: 'beauty-sns-full',
    nameKo: '뷰티 SNS 풀패키지',
    nameEn: 'Beauty SNS Full Package',
    descriptionKo:
      '인스타그램·카카오·페이스북을 아우르는 멀티채널 뷰티 캠페인',
    industry: 'beauty',
    icon: 'Sparkles',
    channelPresetIds: [
      'instagram_feed_1_1',
      'instagram_story',
      'kakao_channel_square',
      'facebook_post',
    ],
    moods: ['modern', 'elegant', 'luxury'],
    promptTemplate:
      '{brandName}의 시그니처 뷰티 라인을 위한 통합 SNS 캠페인 비주얼. 브랜드 아이덴티티를 일관되게 유지하면서 각 채널에 최적화된 크리에이티브.',
    headlineTemplate: '{brandName} 시그니처 컬렉션',
    descriptionTemplate:
      '모든 채널에서 만나는 {brandName}의 뷰티 유니버스.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['뷰티', 'SNS', '멀티채널', '인스타그램', '카카오'],
  },

  // ─── F&B ──────────────────────────────────────────────────
  {
    id: 'fnb-cafe-promo',
    nameKo: '카페/레스토랑 프로모션',
    nameEn: 'Cafe & Restaurant Promotion',
    descriptionKo:
      '인스타그램과 카카오를 활용한 카페·레스토랑 프로모션 캠페인',
    industry: 'fnb',
    icon: 'Coffee',
    channelPresetIds: [
      'instagram_feed_1_1',
      'instagram_story',
      'kakao_channel_square',
      'kakao_talk_wide',
    ],
    moods: ['warm', 'natural', 'modern'],
    promptTemplate:
      '{brandName}의 시즌 메뉴와 매장 분위기를 담은 감성적인 푸드 비주얼. 따뜻한 조명과 자연스러운 연출로 방문 욕구를 자극하는 이미지.',
    headlineTemplate: '{brandName} 신메뉴 출시',
    descriptionTemplate:
      '특별한 한 끼를 위한 새로운 메뉴를 만나보세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['F&B', '카페', '레스토랑', '인스타그램', '카카오'],
  },
  {
    id: 'fnb-delivery-product',
    nameKo: '배달앱 상품 이미지',
    nameEn: 'Delivery App Product Images',
    descriptionKo:
      '쿠팡이츠·네이버 쇼핑용 배달 음식 상품 이미지 제작',
    industry: 'fnb',
    icon: 'Coffee',
    channelPresetIds: [
      'coupang_product',
      'coupang_detail',
      'naver_shopping',
      'naver_smartstore',
    ],
    moods: ['warm', 'bold', 'natural'],
    promptTemplate:
      '{brandName}의 대표 메뉴를 식욕을 돋우는 앵글로 촬영한 듯한 고퀄리티 푸드 이미지. 신선한 재료와 풍성한 양을 강조.',
    headlineTemplate: '{brandName} 인기 메뉴',
    descriptionTemplate:
      '매일 신선한 재료로 정성껏 준비합니다.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['F&B', '배달', '쿠팡', '네이버', '상품이미지'],
  },
  {
    id: 'fnb-season-campaign',
    nameKo: 'F&B 시즌 캠페인',
    nameEn: 'F&B Seasonal Campaign',
    descriptionKo:
      '인스타·페이스북·카카오를 활용한 시즌 한정 메뉴 캠페인',
    industry: 'fnb',
    icon: 'Coffee',
    channelPresetIds: [
      'instagram_feed_4_5',
      'instagram_story',
      'facebook_post',
      'kakao_channel_square',
    ],
    moods: ['warm', 'modern', 'bold'],
    promptTemplate:
      '{brandName}의 시즌 한정 메뉴를 위한 캠페인 비주얼. 계절감을 살린 색감과 소재로 한정판의 특별함을 전달하는 이미지.',
    headlineTemplate: '{brandName} 시즌 한정 메뉴',
    descriptionTemplate:
      '이번 시즌만 만날 수 있는 특별한 맛.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['F&B', '시즌', '한정', '멀티채널'],
  },

  // ─── Tech / IT ────────────────────────────────────────────
  {
    id: 'tech-saas-launch',
    nameKo: 'SaaS 런칭 캠페인',
    nameEn: 'SaaS Launch Campaign',
    descriptionKo:
      '구글 디스플레이·링크드인·페이스북을 활용한 B2B SaaS 런칭 광고',
    industry: 'tech',
    icon: 'Monitor',
    channelPresetIds: [
      'google_display_300x250',
      'google_display_728x90',
      'linkedin_post',
      'facebook_post',
    ],
    moods: ['tech', 'modern', 'minimal'],
    promptTemplate:
      '{brandName}의 혁신적인 SaaS 솔루션을 소개하는 디지털 광고 비주얼. 클린한 UI 목업과 데이터 시각화를 활용하여 제품의 핵심 가치를 전달.',
    headlineTemplate: '{brandName}으로 업무 혁신',
    descriptionTemplate:
      '더 스마트한 업무 환경을 경험하세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['테크', 'SaaS', 'B2B', '구글', '링크드인'],
  },
  {
    id: 'tech-product-launch',
    nameKo: '테크 제품 출시',
    nameEn: 'Tech Product Launch',
    descriptionKo:
      '인스타그램·유튜브·네이버 블로그를 활용한 테크 제품 출시 캠페인',
    industry: 'tech',
    icon: 'Monitor',
    channelPresetIds: [
      'instagram_feed_1_1',
      'instagram_story',
      'youtube_thumbnail',
      'naver_blog_thumbnail',
    ],
    moods: ['tech', 'bold', 'modern'],
    promptTemplate:
      '{brandName}의 신제품을 돋보이게 하는 프리미엄 테크 비주얼. 제품의 디테일과 혁신적인 기능을 강조하는 다이내믹한 구도.',
    headlineTemplate: '{brandName} 신제품 공개',
    descriptionTemplate:
      '기술의 새로운 기준을 제시합니다.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['테크', '제품출시', '인스타그램', '유튜브'],
  },

  // ─── Ecommerce ────────────────────────────────────────────
  {
    id: 'ecom-marketplace-package',
    nameKo: '쿠팡/네이버 상품 패키지',
    nameEn: 'Marketplace Product Package',
    descriptionKo:
      '쿠팡·네이버 쇼핑·스마트스토어 상품 이미지 통합 패키지',
    industry: 'ecommerce',
    icon: 'ShoppingBag',
    channelPresetIds: [
      'coupang_product',
      'coupang_detail',
      'naver_shopping',
      'naver_smartstore',
    ],
    moods: ['modern', 'bold', 'minimal'],
    promptTemplate:
      '{brandName} 상품의 매력을 극대화하는 마켓플레이스 최적화 이미지. 깔끔한 배경에 제품을 돋보이게 하는 전문적인 상품 촬영 스타일.',
    headlineTemplate: '{brandName} 베스트 상품',
    descriptionTemplate:
      '검증된 품질, 합리적인 가격.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['이커머스', '쿠팡', '네이버', '상품이미지'],
  },
  {
    id: 'ecom-promo-campaign',
    nameKo: '이커머스 프로모션',
    nameEn: 'Ecommerce Promotion',
    descriptionKo:
      '쇼핑 채널 + 인스타그램을 결합한 세일·프로모션 캠페인',
    industry: 'ecommerce',
    icon: 'ShoppingBag',
    channelPresetIds: [
      'coupang_product',
      'naver_shopping',
      'naver_smartstore',
      'instagram_feed_1_1',
      'instagram_story',
    ],
    moods: ['bold', 'modern', 'warm'],
    promptTemplate:
      '{brandName}의 특가 프로모션을 위한 강렬한 세일 비주얼. 할인율과 혜택을 한눈에 전달하며, 구매 전환을 유도하는 임팩트 있는 디자인.',
    headlineTemplate: '{brandName} 특가 세일',
    descriptionTemplate:
      '지금이 가장 좋은 기회! 한정 특가를 놓치지 마세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['이커머스', '세일', '프로모션', '인스타그램'],
  },
  {
    id: 'ecom-detail-page',
    nameKo: '오픈마켓 상세페이지',
    nameEn: 'Marketplace Detail Page',
    descriptionKo:
      '쿠팡 상세페이지·네이버 스마트스토어 전용 상세 이미지 세트',
    industry: 'ecommerce',
    icon: 'ShoppingBag',
    channelPresetIds: ['coupang_detail', 'naver_smartstore'],
    moods: ['minimal', 'modern', 'natural'],
    promptTemplate:
      '{brandName} 상품의 특장점을 체계적으로 보여주는 상세페이지 이미지. 제품 스펙, 사용 장면, 구성품을 깔끔하게 정리한 인포그래픽 스타일.',
    headlineTemplate: '{brandName} 상품 상세정보',
    descriptionTemplate:
      '꼼꼼하게 비교하고 현명하게 선택하세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['이커머스', '상세페이지', '쿠팡', '스마트스토어'],
  },

  // ─── Education ────────────────────────────────────────────
  {
    id: 'edu-online-course',
    nameKo: '온라인 강의 프로모션',
    nameEn: 'Online Course Promotion',
    descriptionKo:
      '인스타그램·유튜브·네이버 블로그를 활용한 온라인 강의 홍보',
    industry: 'education',
    icon: 'GraduationCap',
    channelPresetIds: [
      'instagram_feed_1_1',
      'instagram_story',
      'youtube_thumbnail',
      'naver_blog_thumbnail',
    ],
    moods: ['modern', 'warm', 'bold'],
    promptTemplate:
      '{brandName}의 온라인 강의를 효과적으로 홍보하는 비주얼. 전문성과 신뢰감을 전달하면서도 접근하기 쉬운 친근한 분위기의 교육 콘텐츠 이미지.',
    headlineTemplate: '{brandName} 신규 강의 오픈',
    descriptionTemplate:
      '전문가에게 배우는 실전 노하우, 지금 시작하세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['교육', '온라인강의', '인스타그램', '유튜브'],
  },

  // ─── Travel ───────────────────────────────────────────────
  {
    id: 'travel-package-ad',
    nameKo: '여행 패키지 광고',
    nameEn: 'Travel Package Ad',
    descriptionKo:
      '인스타그램·페이스북·카카오를 활용한 여행 패키지 광고 캠페인',
    industry: 'travel',
    icon: 'Plane',
    channelPresetIds: [
      'instagram_feed_4_5',
      'instagram_story',
      'facebook_post',
      'kakao_channel_square',
    ],
    moods: ['natural', 'warm', 'modern'],
    promptTemplate:
      '{brandName}의 여행 패키지를 매력적으로 소개하는 비주얼. 여행지의 아름다운 풍경과 현지 경험을 담아 여행 욕구를 자극하는 감성적인 이미지.',
    headlineTemplate: '{brandName} 특가 여행 패키지',
    descriptionTemplate:
      '지금 떠나기 가장 좋은 순간, 특별한 여행을 시작하세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['여행', '패키지', '인스타그램', '카카오'],
  },

  // ─── Finance ──────────────────────────────────────────────
  {
    id: 'finance-service-ad',
    nameKo: '금융 서비스 광고',
    nameEn: 'Financial Service Ad',
    descriptionKo:
      '구글 디스플레이·네이버 검색광고·링크드인을 활용한 금융 서비스 광고',
    industry: 'finance',
    icon: 'Banknote',
    channelPresetIds: [
      'google_display_300x250',
      'google_display_728x90',
      'naver_search_ad',
      'linkedin_post',
    ],
    moods: ['modern', 'minimal', 'tech'],
    promptTemplate:
      '{brandName}의 금융 서비스를 신뢰감 있게 전달하는 광고 비주얼. 전문적이고 안정적인 이미지와 함께 핵심 혜택을 명확하게 소구하는 디자인.',
    headlineTemplate: '{brandName} 금융 서비스',
    descriptionTemplate:
      '당신의 자산을 더 스마트하게 관리하세요.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['금융', '광고', '구글', '링크드인', '네이버'],
  },

  // ─── General / Multi-industry ─────────────────────────────
  {
    id: 'general-sns-full',
    nameKo: 'SNS 풀 패키지',
    nameEn: 'SNS Full Package',
    descriptionKo:
      '인스타그램·카카오·페이스북을 아우르는 종합 SNS 캠페인 패키지',
    industry: 'general',
    icon: 'Megaphone',
    channelPresetIds: [
      'instagram_feed_1_1',
      'instagram_story',
      'kakao_channel_square',
      'facebook_post',
    ],
    moods: ['modern', 'bold', 'minimal'],
    promptTemplate:
      '{brandName}의 브랜드 메시지를 모든 SNS 채널에 일관되게 전달하는 캠페인 비주얼. 채널별 최적 사이즈에 맞춘 통일감 있는 크리에이티브.',
    headlineTemplate: '{brandName} 캠페인',
    descriptionTemplate:
      '어디서든 만나는 {brandName}의 이야기.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['SNS', '멀티채널', '종합', '인스타그램', '카카오'],
  },
  {
    id: 'general-search-ad',
    nameKo: '검색광고 패키지',
    nameEn: 'Search Ad Package',
    descriptionKo:
      '구글 디스플레이(다양한 사이즈) + 네이버 검색광고 통합 패키지',
    industry: 'general',
    icon: 'Search',
    channelPresetIds: [
      'google_display_300x250',
      'google_display_728x90',
      'google_display_160x600',
      'naver_search_ad',
    ],
    moods: ['minimal', 'modern', 'tech'],
    promptTemplate:
      '{brandName}의 검색광고 캠페인을 위한 배너 비주얼. 제한된 사이즈 안에서 핵심 메시지와 CTA를 효과적으로 전달하는 임팩트 있는 디자인.',
    headlineTemplate: '{brandName} 지금 만나보세요',
    descriptionTemplate:
      '검색 한 번으로 시작되는 새로운 경험.',
    modelId: 'flux-dev',
    variationCount: 3,
    tags: ['검색광고', '구글', '네이버', '배너', '디스플레이'],
  },
];

// ─── Helper functions ─────────────────────────────────────────

/** Get all templates for a specific industry */
export function getTemplatesByIndustry(
  industry: string,
): CampaignTemplate[] {
  return CAMPAIGN_TEMPLATES.filter((t) => t.industry === industry);
}

/** Get a single template by ID */
export function getTemplateById(
  id: string,
): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id);
}

/** Get all unique industries present in templates */
export function getTemplateIndustries(): string[] {
  return [...new Set(CAMPAIGN_TEMPLATES.map((t) => t.industry))];
}

/** Search templates by tag */
export function searchTemplatesByTag(tag: string): CampaignTemplate[] {
  const lower = tag.toLowerCase();
  return CAMPAIGN_TEMPLATES.filter((t) =>
    t.tags.some((tg) => tg.toLowerCase().includes(lower)),
  );
}
