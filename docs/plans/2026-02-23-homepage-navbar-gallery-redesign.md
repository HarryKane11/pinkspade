# Homepage, Navbar & Gallery Redesign

**Date**: 2026-02-23
**Status**: Approved

## Problem

1. Features section highlights peripheral capabilities (Auto-fit, Compliance Guard) instead of the core value: multi-channel campaign asset creation
2. "Trusted by modern creative teams" logo cloud has no real customers — looks fake
3. Navbar shows different items per page — inconsistent UX
4. No standalone Asset Gallery page for brand reference showcase

## Design

### 1. Navbar Unification

Remove conditional nav logic. Single consistent structure across ALL pages:

```
[Logo] Pink Spade    Features  Gallery  Pricing  About     [Log in]  [Start for free]
```

- Features → `/#features` (home anchor)
- Gallery → `/gallery` (new standalone page)
- Pricing → `/pricing` (new page, placeholder for now)
- About → `/about` (existing)
- Internal app routes (workspace, studio, brand-dna) not in public nav

### 2. Features Section Rewrite

Replace current 3 features with core value proposition:

**Heading**: "One design. Every channel."
**Subheading**: "브랜드 DNA를 한 번 설정하면, 모든 채널에 맞는 캠페인 에셋이 자동으로 만들어집니다."

| Feature | Icon | Description |
|---------|------|-------------|
| Multi-format Export | Layers | 하나의 디자인에서 IG Story, Feed, Web Banner, Reel 등 모든 포맷을 한 번에 생성 |
| Brand DNA Engine | Fingerprint | 브랜드 URL만 넣으면 컬러, 폰트, 톤을 자동 추출. 모든 에셋에 일관 적용 |
| Copy that converts | MessageSquare | 채널과 포맷에 맞는 마케팅 카피 자동 생성. 컴플라이언스 검사 내장 |

### 3. Logo Cloud → Stats Bar

Replace "Trusted by" section with product capability stats:

```
10+ formats supported    Brand-safe by default    Export in seconds
```

Horizontal layout, minimal styling, confidence-driven messaging.

### 4. Asset Gallery Page (`/gallery`)

**Structure:**
1. Hero: "See what Pink Spade can create." + subtitle
2. Brand chips slider: Infinite horizontal scroll animation with brand logos + names (Nike, Apple, Spotify, Airbnb, Starbucks, Netflix, etc.)
3. Brand filter: Click chip to filter assets by brand
4. Asset grid: Bento layout showing multi-format assets per brand (IG Story, Feed, Banner, Reel Cover)
5. Images: AI-generated marketing assets, stored in `/public/gallery/brands/`. Placeholders for now.

## Files to Create/Modify

- `apps/web/src/components/layout/Navbar.tsx` — unified nav
- `apps/web/src/app/page.tsx` — features rewrite + stats bar
- `apps/web/src/app/gallery/page.tsx` — new page
- `apps/web/src/app/pricing/page.tsx` — new placeholder page
