# Signup + Onboarding Flow Design

## Context
Google 로그인 후 신규 사용자를 위한 온보딩 플로우가 필요합니다.
프로필 정보를 수집하고 워크스페이스를 개인화하여 첫 사용 경험을 극대화합니다.
Pink Spade 브랜드 톤(흰색/검은색/핑크)에 맞춘 프로덕션 수준 UI를 구현합니다.

## Flow Overview

```
Google 로그인 → /auth/callback → onboarding_completed 체크
  → false: /onboarding (7 steps)
  → true: /workspace (기존 사용자)
```

## Onboarding Steps (7 Steps)

### Step 0: Welcome
- "반갑습니다, [이름]님!" + Pink Spade 로고 애니메이션
- Google에서 가져온 이름 표시, 편집 가능한 입력 필드
- CTA: "시작하기" (zinc-900 pill button)

### Step 1: Role (직무)
- 단일 선택 카드 그리드 (2열)
- 옵션: 마케터 / 디자이너 / 대표·창업자 / 콘텐츠 크리에이터 / 기타
- 각 카드: 아이콘 + 라벨, 선택 시 pink-500 border + subtle scale
- Skip: 회색 텍스트 링크 "건너뛰기"

### Step 2: Company Size (회사 규모)
- 가로 pill 버튼 그룹
- 옵션: 1인 / 2-10명 / 11-50명 / 51-200명 / 200명+
- 단일 선택, 선택 시 zinc-900 fill 전환
- Skip: 회색 텍스트 링크 "건너뛰기"

### Step 3: Industry (업종)
- 멀티 선택 카드 (2열 그리드)
- 옵션: 뷰티·패션 / F&B / 테크·IT / 이커머스 / 교육 / 헬스케어 / 부동산 / 금융 / 여행 / 기타
- 선택 시 pink-500 체크마크 + border
- Skip: 회색 텍스트 링크 "건너뛰기"

### Step 4: Brand URL (웹사이트)
- URL 입력 필드 + favicon 미리보기
- "없으면 건너뛰기" 회색 텍스트 링크
- 입력 시 백그라운드에서 Brand DNA 추출 시작
- Skip: 회색 텍스트 링크 "아직 없어요"

### Step 5: Channels (주요 채널)
- 멀티 선택 카드 (2열)
- 채널 로고 + 이름: 인스타그램 / 카카오 / 네이버 / 쿠팡 / 유튜브 / 페이스북 / 구글 / 링크드인
- 선택한 채널 → 워크스페이스 기본 프리셋
- Skip: 회색 텍스트 링크 "건너뛰기"

### Step 6: Goals (목표)
- 멀티 선택 pill 태그
- 옵션: 브랜드 일관성 유지 / 광고 소재 제작 / SNS 콘텐츠 제작 / 상세페이지 제작 / 기타
- Skip: 회색 텍스트 링크 "건너뛰기"

### Step 7: Complete (완료)
- Brand DNA 결과 미리보기 (URL 입력한 경우: 색상 팔레트 + 브랜드명)
- URL 미입력 시: "워크스페이스가 준비되었습니다" 메시지
- 축하 애니메이션 (confetti particles)
- CTA: "워크스페이스로 이동"

## UI/UX Specifications

### Layout
- 풀스크린, 중앙 정렬 (max-w-lg)
- 상단: 프로그레스 바 (고정)
- 중앙: 스텝 콘텐츠
- 하단: CTA 버튼 + Skip 링크

### Progress Bar
- 상단 고정, h-1
- 배경: zinc-100
- 진행: pink-500 → pink-400 그라데이션
- Framer Motion으로 width 트랜지션

### Step Transitions
- Framer Motion AnimatePresence
- 다음: slide-left + fade-out → slide-right + fade-in
- 이전: 반대 방향

### Color Palette
- 배경: white (#ffffff)
- 텍스트: zinc-900 (#18181b)
- 서브텍스트: zinc-500 (#71717a)
- 선택 하이라이트: pink-500 (#ec4899)
- 선택 카드 배경: pink-50 (#fdf2f8)
- CTA 버튼: zinc-900 text-white rounded-full
- Skip 링크: zinc-400 text-sm hover:zinc-600

### Typography
- 제목: text-2xl font-semibold tracking-tight
- 설명: text-sm text-zinc-500 font-light
- 카드 라벨: text-sm font-medium

### Animations
- 카드 선택: scale(1.02) + pink border transition 200ms
- 버튼 hover: bg-zinc-800 transition 150ms
- Step 전환: 300ms ease-out slide + fade
- Complete 화면: confetti 파티클 (2초간)

## Data Model

### profiles 테이블 확장 (002 마이그레이션에 이미 존재)
기존 필드 활용:
- display_name, avatar_url, onboarding_completed

### onboarding_data JSONB (profiles에 추가)
```json
{
  "role": "marketer",
  "company_size": "2-10",
  "industries": ["beauty", "ecommerce"],
  "brand_url": "https://example.com",
  "channels": ["instagram", "kakao", "naver"],
  "goals": ["brand_consistency", "ad_creative"]
}
```

## File Structure
```
apps/web/src/app/onboarding/
  ├── page.tsx              # 메인 온보딩 페이지 (step 상태 관리)
  └── steps/
      ├── WelcomeStep.tsx   # Step 0
      ├── RoleStep.tsx      # Step 1
      ├── CompanySizeStep.tsx # Step 2
      ├── IndustryStep.tsx  # Step 3
      ├── BrandUrlStep.tsx  # Step 4
      ├── ChannelsStep.tsx  # Step 5
      ├── GoalsStep.tsx     # Step 6
      └── CompleteStep.tsx  # Step 7
```

## Auth Flow Changes
- `/auth/callback/route.ts`: 로그인 후 profiles.onboarding_completed 체크
- `/lib/supabase/middleware.ts`: /workspace 접근 시 onboarding 미완료면 /onboarding으로 리다이렉트

## Verification
1. 새 Google 계정으로 로그인 → /onboarding으로 리다이렉트 확인
2. 모든 Step 순서대로 진행 + Skip 동작 확인
3. 완료 후 profiles.onboarding_completed = true 확인
4. 이후 로그인 시 /workspace로 직접 이동 확인
5. 프로그레스 바, 애니메이션, 반응형 레이아웃 확인
