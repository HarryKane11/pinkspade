# Campaign Wizard UI/UX Redesign

> **Date**: 2026-02-23
> **Status**: Approved
> **Scope**: Replace the current 3-panel studio with a 4-step campaign wizard

## Problem

The current studio (`/studio/[designId]`) presents all controls simultaneously in a 3-panel layout:
- Left: AI model, resolution, channels, creative direction, prompt
- Center: Konva canvas editor
- Right: Typography, colors, layers, brand, compliance

This causes **cognitive overload** — users don't know where to start, can't tell what's pre-generation vs post-generation, and brand settings are scattered across panels.

## Solution: Clean Wizard (Approach A)

Replace the studio with a 4-step wizard at `/campaign/new`. Each step shows only what's needed for that phase. No Konva canvas — assets are static previews with property panel editing.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas editor | Removed (preview + panels) | Simplifies UX, matches "automation first" philosophy |
| Routing | Single page, step state | Faster transitions, simpler data passing |
| Edit scope | Explicit toggle (All / This) | Transparent, no surprises |
| Language | Korean | Matches target market |
| Brand preset | Optional with smart defaults | Lower barrier to first generation |

### Core Principles

1. **Progressive Disclosure**: Show only what's needed at each step
2. **Smart Defaults**: Brand DNA auto-fills, AI model auto-selects
3. **Context-Sensitive Controls**: Edit panel appears only when asset selected
4. **Preview-First**: Generated assets get 80%+ of screen space

---

## Architecture

### Route
- **Path**: `/campaign/new`
- **Layout**: Full-page wizard, no global nav/footer
- **Top bar**: Stepper (4 steps) + campaign name + "Save Draft" / "Exit"

### State Management
- Parent `CampaignWizard` component owns all state
- Zustand store for campaign data (separate from studio-context)
- Session storage backup for crash recovery
- No URL changes between steps (SPA-style)

### Data Flow
```
CampaignWizard (state owner)
├── Step1Setup
│   ├── channels: CampaignFormat[]
│   ├── brandPreset: BrandDNA | null
│   └── aiModel: { id, costPerFormat }
├── Step2Creative
│   ├── prompt: string
│   ├── moods: string[]
│   ├── productImage: File | null
│   ├── headline: string
│   ├── description: string
│   └── advanced: { forbiddenWords, requiredPhrases, variationCount }
├── Step3Generate
│   ├── concepts: Concept[]  // each has assets per format
│   ├── selectedConcept: string
│   ├── editingAsset: Asset | null
│   └── scopeMode: 'all' | 'this'
└── Step4Review
    ├── complianceResults: ComplianceCheck[]
    └── exportOptions: ExportConfig
```

### Types
```typescript
interface CampaignFormat {
  id: string;
  label: string;
  channelId: string;
  logo: string;
  width: number;
  height: number;
  checked: boolean;
}

interface Concept {
  id: string;
  label: string; // "컨셉 A", "컨셉 B", "컨셉 C"
  assets: Asset[];
}

interface Asset {
  id: string;
  conceptId: string;
  format: CampaignFormat;
  imageUrl: string;
  textLayers: TextEdit[];
  colors: { text: string; background: string };
  status: 'ok' | 'text-overflow' | 'compliance-warning';
  statusMessage?: string;
}

interface TextEdit {
  field: 'headline' | 'description';
  value: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface ComplianceCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  message?: string;
  assetId?: string; // link to problematic asset
  suggestion?: string;
}
```

---

## Step 1: 캠페인 설정 (Campaign Setup)

### Layout
2-column: left 60% (channels), right 40% (brand + model)

### Left Column: 채널 선택
- Checkbox list grouped by category (SNS, 블로그, 광고)
- Each item: platform logo + name + dimensions
- Pre-checked from user's onboarding profile
- "+ 커스텀 사이즈 추가" opens width×height input with aspect ratio lock

### Right Column: 브랜드 프리셋
- Brand DNA card showing: color swatches (5), font name, tone keyword
- "변경" button → brand selector modal (list of user's brands)
- "건너뛰기" button → proceed without brand (generic defaults)
- Selecting brand auto-sets: colors, fonts, tone for all subsequent steps

### Right Column: AI 모델
- Dropdown: model name + max resolution + credit cost per format
- Smart default: cheapest model meeting quality threshold
- Cost displayed per format

### Footer
- Real-time credit estimator: `channels × cost = total` vs user balance
- Warning if insufficient: suggests reducing formats or switching model
- "다음: 크리에이티브 입력 →" button

---

## Step 2: 크리에이티브 입력 (Creative Input)

### Layout
Single column, centered, max-width ~700px

### Mood Selection
- Chip selector, max 3 selections
- Moods: 미니멀, 모던, 따뜻한, 대담한, 럭셔리, 자연적, 레트로, 테크, 귀여운, 우아한
- Reuses existing mood data from `AssetGeneratorPanel`

### Campaign Description
- Large textarea (unified prompt replacing separate image/copy prompts)
- Placeholder: "캠페인의 목적, 분위기, 강조할 메시지를 자유롭게 설명해주세요"
- Product image upload: drag-and-drop zone or file picker, inline preview

### Copy Fields
- Side-by-side: Headline (left) + Description (right)
- Each has "AI 추천 받기 ✨" button → calls `/api/copy/generate`
- AI suggestions appear as selectable chips below the field
- Fields are pre-populated with brand-aware defaults if brand selected

### Brand Tone Badge
- Non-editable indicator: "브랜드 톤 적용 ✓ 전문적 · Pretendard"
- Shows only if brand was selected in Step 1

### Advanced Settings (collapsed by default)
- 금칙어 (forbidden words): tag input
- 필수 문구 (required phrases): tag input
- 생성 변형 수 (variation count): number input, default 3, max 6

### Footer
- "← 이전" + "생성하기 → {totalCredits} cr" button
- Generate button disabled if prompt empty; shows credit cost

---

## Step 3: 생성 & 편집 (Generate & Edit)

### Generation Flow
1. On entering step, fire parallel API calls: one per (format × variation)
2. Show loading skeletons per card, results stream in as completed
3. Each API call: `POST /api/media/generate` with format dimensions, prompt, moods, brand DNA, product image, copy text
4. Group results into Concept rows (A/B/C based on variation count)

### Layout: Concept Grid
- Full-width, scrollable vertically
- Each concept = horizontal row of format cards
- Format cards show: thumbnail preview, format label, dimensions, status badge
- Status badges: ✅ 정상, ⚠️ 텍스트 넘침, ⚠️ 컴플라이언스 경고

### Top Bar
- Scope toggle: "적용 범위: [전체 포맷] [이 포맷만]" — always visible
- "다시 생성 🔄" button → returns to Step 2 with inputs preserved
- Per-card "🔄" icon → regenerate single format within a concept

### Slide-in Edit Panel (right, 360px)
Appears when clicking any format card:
- Enlarged asset preview (left side)
- Edit fields (right panel):
  - **텍스트**: Headline input + Description input
  - **색상**: Text color picker + Background color picker (with brand palette swatches)
  - **타이포그래피**: Font family dropdown + font sizes for headline/description
  - **[적용]** button: triggers re-generation with modified params
  - **[초기화]** button: resets to original generated values
- Scope toggle duplicated in panel for clarity
- Close button (✕) dismisses panel

### Technical: Edit → Regenerate
When user edits text/colors and clicks "적용":
- If scope = "전체 포맷": update all assets in concept with new text/colors, regenerate all
- If scope = "이 포맷만": update only this asset, regenerate only this format
- API call includes modified text layers and color overrides

---

## Step 4: 검토 & 내보내기 (Review & Export)

### Compliance Checklist
Auto-runs on entering step. Items:
- 브랜드 색상 일관성 (brand color consistency)
- 폰트 규정 준수 (font compliance)
- 과장 표현 감지 (exaggeration detection) — "최대", "완벽한" etc.
- 이미지 해상도 적합 (image resolution check)
- 텍스트 세이프존 (text safe area per channel)

Each item: label + status (통과/경고) + "수정하기" link (jumps to Step 3 with asset selected)

### Final Preview Grid
All formats in selected concept, actual aspect ratios. Click to zoom/fullscreen.

### Campaign Summary
- 포맷 수, 선택 컨셉, 크레딧 사용량, 브랜드, 모델

### Export Options
- 📦 전체 다운로드 (ZIP): all formats as PNG files
- 📄 개별 다운로드: click each format to save
- 🔗 공유 링크 생성: shareable preview URL (future)
- 📊 PPTX 내보내기: PowerPoint format (plan-gated)

### On Complete
- Save campaign to Supabase design history
- Redirect to workspace with success toast

---

## Component Map

### New Components
```
/src/components/campaign/
├── CampaignWizard.tsx          # Parent: step state, campaign data
├── CampaignStepper.tsx         # Top stepper bar (4 steps)
├── Step1Setup.tsx              # Channel selection + brand preset + model
├── Step2Creative.tsx           # Moods, prompt, copy, product image
├── Step3Generate.tsx           # Concept grid + edit panel
├── Step3EditPanel.tsx          # Slide-in editor for individual assets
├── Step4Review.tsx             # Compliance + export
├── FormatCard.tsx              # Individual format thumbnail card
├── ConceptRow.tsx              # Horizontal row of format cards
├── ComplianceChecklist.tsx     # Pass/warn list for Step 4
├── CreditEstimator.tsx         # Real-time credit calculation
└── BrandPresetCard.tsx         # Brand DNA summary card
```

### Reused Components
- `RatioSelector` → channel presets data (not the UI component)
- `ExportDialog` → export logic (adapted for new context)
- Brand DNA types from `brand-schema.ts`
- Channel presets from `channel-presets.ts`
- Credit cost mapping from `credits.ts`
- FAL model definitions from `fal.ts`

### New Page
```
/src/app/campaign/new/page.tsx  # Entry point, renders CampaignWizard
```

---

## What Happens to the Existing Studio

The current `/studio/[designId]` page remains as-is for now. The new `/campaign/new` wizard is a separate flow. Once validated, the studio page can be deprecated or repurposed as a "Pro Editor" for users who want canvas-level control.

---

## API Changes

### No new API routes needed
All existing routes are sufficient:
- `POST /api/media/generate` — image generation (already supports format dimensions)
- `POST /api/copy/generate` — copy suggestions
- `GET /api/brands` — brand list
- `GET /api/credits/balance` — credit check
- `POST /api/designs` — save campaign result

### Potential API modifications
- `/api/media/generate` may need to accept text overlay parameters (headline, description, colors) if not already supported for regeneration with edits
- Compliance check logic may need a dedicated endpoint or can be client-side initially
