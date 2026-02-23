# BrandFlow Studio

> Google Pomelli 스타일의 한국 실무자용 AI 마케팅 에셋 생성 웹앱

## 개요

BrandFlow Studio는 웹사이트 URL만 입력하면 AI가 브랜드 컬러, 폰트, 톤을 분석하고 캠페인 아이디어와 함께 즉시 사용 가능한 마케팅 에셋을 생성하는 플랫폼입니다.

## 주요 기능

### 1. Brand DNA
- 웹사이트 URL 분석하여 브랜드 색상, 폰트, 톤 자동 추출
- Brand DNA 버전 관리

### 2. Campaign
- 프롬프트 기반 캠페인 아이디어 3개 이상 제안
- CopyPack 생성 (헤드라인, 설명, CTA + 변형)
- 카피 변형: "더 짧게 / 더 공손하게 / 더 직설적으로 / 글자수 제한"

### 3. Studio
- Konva.js 기반 레이어 편집기
- 텍스트 더블클릭 편집 (절대 이미지에 구워넣지 않음)
- Auto-fit 텍스트 알고리즘
- 20단계 Undo/Redo
- 10초 자동저장

### 4. Photoshoot
- Photoroom/remove.bg API로 상품 누끼
- Gemini로 AI 배경 생성 (Studio, Floating, Ingredient, In Use, Lifestyle)
- 합성 후 Design JSON으로 저장 (텍스트 레이어 포함)

### 5. Export
- PNG: 고해상도 이미지
- PPTX: **편집 가능한 텍스트박스**로 생성
- JSON: Design JSON 데이터
- ZIP: 전체 패키지

## 기술 스택

### Frontend
- Next.js 15+ (App Router)
- TypeScript 5+
- Tailwind CSS
- Konva.js + react-konva
- Zustand + Immer (Undo/Redo)

### Backend
- FastAPI (Python 3.11+)
- PostgreSQL (Supabase)
- Celery + Redis

### AI/API
- Gemini 3.1 Pro: Brand DNA, 캠페인 아이디어
- Gemini 3 Flash: 카피 변형
- Gemini 3 Pro Image: 배경 생성
- Photoroom/remove.bg: 누끼

## 프로젝트 구조

```
brandflow-studio/
├── apps/
│   ├── web/              # Next.js 프론트엔드
│   │   └── src/
│   │       ├── app/      # App Router
│   │       ├── components/
│   │       ├── contexts/
│   │       ├── hooks/
│   │       └── lib/
│   │
│   └── api/              # FastAPI 백엔드
│       └── app/
│           ├── models/
│           ├── routers/
│           ├── services/
│           └── workers/
│
├── packages/
│   └── shared/           # 공유 타입
│       └── src/
│           ├── design-schema.ts
│           ├── brand-schema.ts
│           └── channel-presets.ts
│
└── supabase/
    └── migrations/       # DB 마이그레이션
```

## 채널 프리셋 (한국 최적화)

| 플랫폼 | 프리셋 |
|--------|--------|
| 인스타그램 | 피드 1:1, 피드 4:5, 스토리, 릴스 |
| 카카오 | 채널 정사각, 와이드형, 비즈보드 |
| 네이버 | 쇼핑, 블로그, 스마트스토어, 검색광고 |
| 쿠팡 | 상품 이미지, 상세페이지 |
| 유튜브 | 썸네일, 채널 배너 |
| 구글 | 디스플레이 광고 |

## 시작하기

### 1. 의존성 설치

```bash
# Frontend
cd apps/web
npm install

# Backend
cd apps/api
pip install -r requirements.txt
```

### 2. 환경변수 설정

```bash
# apps/api/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GOOGLE_API_KEY=your_gemini_key
PHOTOROOM_API_KEY=your_photoroom_key
REMOVEBG_API_KEY=your_removebg_key
```

### 3. 개발 서버 실행

```bash
# Frontend
npm run dev

# Backend
uvicorn app.main:app --reload --port 8000
```

### 4. Studio 체험

브라우저에서 `http://localhost:3000/studio/demo` 접속

## 핵심 원칙

1. **텍스트는 항상 편집 가능한 레이어로 유지** - 절대 이미지에 "구워넣지 않음"
2. **PPTX 내보내기 시 텍스트박스 편집 가능** - python-pptx로 네이티브 텍스트박스 생성
3. **Auto-fit 오버플로우 시 경고 표시** - 최소 폰트 크기 도달 시 배지 표시
4. **누끼 실패 시 폴백 작동** - Photoroom → remove.bg

## API 엔드포인트

```
POST /api/brands/:id/analyze-url     # Brand DNA 추출
POST /api/campaigns/:id/generate-ideas   # 캠페인 아이디어 생성
POST /api/photoshoot/cutout          # 누끼
POST /api/photoshoot/background      # AI 배경 생성
POST /api/photoshoot/compose         # 합성
POST /api/designs/:id/export         # 내보내기 (PNG/PPTX/JSON/ZIP)
```

## 라이선스

MIT
