# Campaign Wizard v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix image cropping, add text overlay system with drag/resize, add brand DNA modal, clean up unused DB tables.

**Architecture:** Replace AI-rendered text with CSS overlay + Canvas export. FormatCard uses dynamic aspect ratio. Brand DNA extraction integrates into Step1. Supabase migration drops unused tables.

**Tech Stack:** React, Next.js 15, Framer Motion, Canvas API, Supabase, TypeScript

---

## Task 1: Fix FormatCard Dynamic Aspect Ratio

**Files:**
- Modify: `apps/web/src/components/campaign/FormatCard.tsx`
- Modify: `apps/web/src/components/campaign/ConceptRow.tsx`
- Modify: `apps/web/src/components/campaign/Step4Review.tsx`

### Step 1: Update FormatCard props and aspect ratio

Add `width` and `height` to FormatCard props. Replace `aspect-video` with dynamic `aspectRatio`.

In `FormatCard.tsx`, change the interface (line 7-15):

```tsx
interface FormatCardProps {
  asset: CampaignAsset;
  formatLabel: string;
  formatDimensions: string;
  formatLogo: string;
  formatWidth: number;
  formatHeight: number;
  selected: boolean;
  onClick: () => void;
  onRegenerate: () => void;
}
```

Add `formatWidth, formatHeight` to destructured props (line 17-25).

Replace line 38:
```tsx
<div className="aspect-video bg-zinc-100 relative overflow-hidden">
```
with:
```tsx
<div className="bg-zinc-100 relative overflow-hidden" style={{ aspectRatio: `${formatWidth} / ${formatHeight}` }}>
```

### Step 2: Update ConceptRow to pass width/height

In `ConceptRow.tsx`, update the FormatCard invocation (lines 69-78):

```tsx
<FormatCard
  key={asset.id}
  asset={asset}
  formatLabel={fmt.label}
  formatDimensions={`${fmt.width}×${fmt.height}`}
  formatLogo={fmt.logo}
  formatWidth={fmt.width}
  formatHeight={fmt.height}
  selected={editingAssetId === asset.id}
  onClick={() => onAssetClick(asset.id)}
  onRegenerate={() => onRegenerate(asset.id)}
/>
```

Change grid to flex-wrap for varied card sizes (lines 59-63):

```tsx
<div className="flex flex-wrap gap-3">
  {checkedFormats.map((fmt) => {
    const asset = assets.find((a) => a.formatId === fmt.id);
    if (!asset) return null;
    // Compute a reasonable card width based on aspect ratio
    const ar = fmt.width / fmt.height;
    const cardWidth = ar >= 2 ? '100%' : ar >= 1 ? '220px' : '180px';
    return (
      <div key={asset.id} style={{ width: cardWidth, flexShrink: 0 }}>
        <FormatCard ... />
      </div>
    );
  })}
</div>
```

### Step 3: Update Step4Review preview grid

In `Step4Review.tsx`, the preview grid (lines 157-184) uses `aspect-video` implicitly via FormatCard-like markup. Update the image container:

Replace line 165:
```tsx
<div className="aspect-video bg-zinc-100 relative">
```
with:
```tsx
<div className="bg-zinc-100 relative" style={{ aspectRatio: `${fmt?.width ?? 16} / ${fmt?.height ?? 9}` }}>
```

### Step 4: Commit

```bash
git add apps/web/src/components/campaign/FormatCard.tsx apps/web/src/components/campaign/ConceptRow.tsx apps/web/src/components/campaign/Step4Review.tsx
git commit -m "fix(campaign): dynamic aspect ratio in FormatCard — fixes image cropping"
```

---

## Task 2: Add TextBox Data Model to CampaignAsset

**Files:**
- Modify: `apps/web/src/components/campaign/CampaignWizard.tsx`

### Step 1: Add TextBox interface and update CampaignAsset

In `CampaignWizard.tsx`, add `TextBox` interface after `CampaignBrandDna` (after line 38):

```typescript
export interface TextBox {
  id: string;
  type: 'headline' | 'description';
  x: number;       // % from left (0-100)
  y: number;       // % from top (0-100)
  width: number;   // % of container width
  height: number;  // % of container height
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
}
```

Add `textBoxes` to `CampaignAsset` interface (after line 65):

```typescript
export interface CampaignAsset {
  // ... existing fields ...
  textBoxes: TextBox[];
}
```

### Step 2: Commit

```bash
git add apps/web/src/components/campaign/CampaignWizard.tsx
git commit -m "feat(campaign): add TextBox data model to CampaignAsset"
```

---

## Task 3: Initialize TextBoxes in Step3Generate

**Files:**
- Modify: `apps/web/src/components/campaign/Step3Generate.tsx`

### Step 1: Update asset creation with default textBoxes

In `Step3Generate.tsx`, the `generateAll` function (lines 43-58) creates assets. Add `textBoxes` to each asset:

Replace lines 43-58 with:

```typescript
const assets: CampaignAsset[] = selectedFormats.map((fmt) => {
  const headlineFont = data.brandDna?.typography?.heading || data.brandDna?.typography?.headingFont || 'Pretendard';
  const bodyFont = data.brandDna?.typography?.body || data.brandDna?.typography?.bodyFont || 'Pretendard';
  const textColor = data.brandDna?.colors?.text || '#ffffff';
  return {
    id: crypto.randomUUID(),
    conceptId,
    formatId: fmt.id,
    imageUrl: '',
    headline: data.headline,
    description: data.description,
    headlineFontSize: 48,
    headlineFontFamily: headlineFont,
    headlineColor: textColor,
    descriptionFontSize: 24,
    descriptionFontFamily: bodyFont,
    descriptionColor: textColor,
    backgroundColor: data.brandDna?.colors?.background || '#1a1a2e',
    status: 'loading',
    textBoxes: [
      {
        id: crypto.randomUUID(),
        type: 'headline' as const,
        x: 10, y: 10, width: 80, height: 20,
        text: data.headline,
        fontSize: 48,
        fontFamily: headlineFont,
        color: textColor,
        fontWeight: 700,
        textAlign: 'center' as const,
      },
      {
        id: crypto.randomUUID(),
        type: 'description' as const,
        x: 10, y: 35, width: 80, height: 15,
        text: data.description,
        fontSize: 24,
        fontFamily: bodyFont,
        color: textColor,
        fontWeight: 400,
        textAlign: 'center' as const,
      },
    ],
  };
});
```

### Step 2: Remove text from AI prompt

Replace line 86:
```typescript
prompt: `${data.prompt}. Headline: "${data.headline}". Description: "${data.description}". Mood: ${moodLabels.join(', ')}. Variation ${ci + 1}.`,
```
with:
```typescript
prompt: `${data.prompt}. Mood: ${moodLabels.join(', ')}. Leave clean open space for text overlay. Variation ${ci + 1}.`,
```

Similarly update the regenerate prompt (line 162):
```typescript
prompt: `${data.prompt}. Leave clean open space for text overlay.`,
```

### Step 3: Update handleResetEdit to include textBoxes reset

In `handleResetEdit` (lines 213-224), add textBoxes to the reset:

```typescript
const handleResetEdit = useCallback(() => {
  if (!data.editingAssetId) return;
  const asset = data.concepts.flatMap((c) => c.assets).find((a) => a.id === data.editingAssetId);
  if (!asset) return;
  handleApplyEdit({
    headline: data.headline,
    description: data.description,
    headlineColor: data.brandDna?.colors?.text || '#ffffff',
    descriptionColor: data.brandDna?.colors?.text || '#ffffff',
    backgroundColor: data.brandDna?.colors?.background || '#1a1a2e',
    headlineFontSize: 48,
    descriptionFontSize: 24,
    textBoxes: asset.textBoxes.map((tb) => ({
      ...tb,
      text: tb.type === 'headline' ? data.headline : data.description,
      color: data.brandDna?.colors?.text || '#ffffff',
      fontSize: tb.type === 'headline' ? 48 : 24,
    })),
  });
}, [data, handleApplyEdit]);
```

### Step 4: Commit

```bash
git add apps/web/src/components/campaign/Step3Generate.tsx
git commit -m "feat(campaign): initialize textBoxes on assets, remove text from AI prompt"
```

---

## Task 4: Create TextBoxOverlay Component

**Files:**
- Create: `apps/web/src/components/campaign/TextBoxOverlay.tsx`

### Step 1: Build draggable/resizable text box overlay

Create a new component that renders text boxes over an image with drag and resize support. Uses pointer events for drag/resize — no external library needed.

```tsx
// See implementation in the code — this is a self-contained component that:
// - Renders absolutely-positioned text boxes over a container
// - Supports drag to move (pointer events)
// - Supports resize via corner handle
// - Calls onChange with updated TextBox on every move/resize
// - Shows selection state with dashed border
// Props: { textBoxes: TextBox[], selectedId: string | null, onSelect, onChange, containerRef }
```

Key implementation details:
- All positions are in % (relative to container)
- Convert pointer events to % using container getBoundingClientRect
- Clamp values between 0-100
- Selected box shows resize handle at bottom-right corner
- Text renders with the TextBox's font/color/size properties
- fontSize is scaled: `${tb.fontSize * (containerWidth / formatNativeWidth)}px`

### Step 2: Commit

```bash
git add apps/web/src/components/campaign/TextBoxOverlay.tsx
git commit -m "feat(campaign): add TextBoxOverlay component with drag/resize"
```

---

## Task 5: Integrate TextBoxOverlay into Step3EditPanel

**Files:**
- Modify: `apps/web/src/components/campaign/Step3EditPanel.tsx`
- Modify: `apps/web/src/components/campaign/Step3Generate.tsx` (pass textBoxes through)

### Step 1: Update Step3EditPanel props

Add `formatWidth`, `formatHeight` to props. Add `textBoxes` state management. Replace static image preview with TextBoxOverlay-based WYSIWYG preview.

The preview section (lines 76-80) becomes an interactive canvas:

```tsx
{/* WYSIWYG Preview */}
<div className="px-4 py-3 border-b border-zinc-100">
  <div
    ref={containerRef}
    className="relative w-full rounded-lg overflow-hidden"
    style={{ aspectRatio: `${formatWidth} / ${formatHeight}` }}
  >
    {asset.imageUrl && (
      <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
    )}
    <TextBoxOverlay
      textBoxes={localTextBoxes}
      selectedId={selectedTextBoxId}
      onSelect={setSelectedTextBoxId}
      onChange={handleTextBoxChange}
      formatWidth={formatWidth}
      formatHeight={formatHeight}
    />
  </div>
</div>
```

### Step 2: Add position controls for selected text box

Below the existing typography section, add numeric position inputs:

```tsx
{/* Position (for selected text box) */}
{selectedTb && (
  <div className="space-y-3">
    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">위치</h4>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">X (%)</label>
        <input type="number" value={Math.round(selectedTb.x)} min={0} max={100} ... />
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Y (%)</label>
        <input type="number" value={Math.round(selectedTb.y)} min={0} max={100} ... />
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">너비 (%)</label>
        <input type="number" value={Math.round(selectedTb.width)} min={10} max={100} ... />
      </div>
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">높이 (%)</label>
        <input type="number" value={Math.round(selectedTb.height)} min={5} max={100} ... />
      </div>
    </div>
  </div>
)}
```

### Step 3: Wire text edits to update textBoxes

When user changes headline text, also update the corresponding textBox's `text` field. Same for color/font changes.

### Step 4: Update handleApply to include textBoxes

```typescript
const handleApply = () => {
  onApply({
    headline,
    description,
    headlineColor,
    descriptionColor,
    backgroundColor,
    headlineFontSize,
    descriptionFontSize,
    textBoxes: localTextBoxes,
  });
};
```

### Step 5: Commit

```bash
git add apps/web/src/components/campaign/Step3EditPanel.tsx apps/web/src/components/campaign/Step3Generate.tsx
git commit -m "feat(campaign): WYSIWYG text overlay editing in Step3EditPanel"
```

---

## Task 6: Add TextBoxOverlay to FormatCard Preview

**Files:**
- Modify: `apps/web/src/components/campaign/FormatCard.tsx`

### Step 1: Render text overlay on FormatCard

Show text boxes on the format card preview (read-only, not draggable):

```tsx
{/* Text overlay (read-only) */}
{asset.textBoxes?.map((tb) => (
  <div
    key={tb.id}
    className="absolute pointer-events-none"
    style={{
      left: `${tb.x}%`,
      top: `${tb.y}%`,
      width: `${tb.width}%`,
      height: `${tb.height}%`,
      color: tb.color,
      fontFamily: tb.fontFamily,
      fontWeight: tb.fontWeight,
      textAlign: tb.textAlign,
      fontSize: `${tb.fontSize * 0.15}px`, // scaled down for card preview
      lineHeight: 1.2,
      overflow: 'hidden',
    }}
  >
    {tb.text}
  </div>
))}
```

### Step 2: Commit

```bash
git add apps/web/src/components/campaign/FormatCard.tsx
git commit -m "feat(campaign): show text overlay preview on FormatCard"
```

---

## Task 7: Canvas Export with Text Compositing

**Files:**
- Create: `apps/web/src/lib/canvas-export.ts`
- Modify: `apps/web/src/components/campaign/Step4Review.tsx`

### Step 1: Create canvas-export utility

```typescript
// canvas-export.ts
// compositeAsset(imageUrl, textBoxes, width, height): Promise<Blob>
// - Creates offscreen canvas at native resolution
// - Draws background image
// - Renders each text box with correct position, font, color, size
// - Returns PNG blob
```

### Step 2: Update Step4Review export handlers

Replace direct image download with canvas compositing:

```typescript
const handleExportSingle = useCallback(async (asset: CampaignAsset) => {
  const fmt = selectedFormats.find((f) => f.id === asset.formatId);
  if (!asset.imageUrl || !fmt) return;
  const blob = await compositeAsset(asset.imageUrl, asset.textBoxes, fmt.width, fmt.height);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fmt.label}_${fmt.width}x${fmt.height}.png`;
  a.click();
  URL.revokeObjectURL(url);
}, [selectedFormats]);
```

### Step 3: Add text overlay to Step4Review preview images

Show text overlay on the final preview grid (same pattern as FormatCard).

### Step 4: Commit

```bash
git add apps/web/src/lib/canvas-export.ts apps/web/src/components/campaign/Step4Review.tsx
git commit -m "feat(campaign): canvas export with text compositing"
```

---

## Task 8: Brand DNA Modal in Step1

**Files:**
- Modify: `apps/web/src/components/campaign/BrandPresetCard.tsx`
- Modify: `apps/web/src/components/campaign/Step1Setup.tsx`

### Step 1: Add "새 브랜드 추출" to BrandPresetCard

Add `onExtractNew` prop. Show "새 브랜드 추출" button alongside existing buttons when no brand is selected:

```tsx
interface BrandPresetCardProps {
  brandDna: CampaignBrandDna | null;
  onChangeBrand: () => void;
  onExtractNew: () => void;
  onSkip: () => void;
}
```

In the "no brand" state, add button:
```tsx
<button onClick={onExtractNew} className="px-4 py-2 text-xs font-medium bg-pink-500 text-white rounded-lg hover:bg-pink-400">
  새 브랜드 추출
</button>
```

### Step 2: Integrate BrandDNAModal in Step1Setup

Import `BrandDNAModal` and add state:

```tsx
import { BrandDNAModal } from '@/components/brand/BrandDNAModal';
// ...
const [showBrandDnaModal, setShowBrandDnaModal] = useState(false);
```

Pass `onExtractNew` to BrandPresetCard:
```tsx
<BrandPresetCard
  brandDna={data.brandDna}
  onChangeBrand={() => setShowBrandModal(true)}
  onExtractNew={() => setShowBrandDnaModal(true)}
  onSkip={() => { update('brandId', null); update('brandDna', null); }}
/>
```

Add modal at the end of the component:
```tsx
<BrandDNAModal open={showBrandDnaModal} onClose={() => {
  setShowBrandDnaModal(false);
  // Reload brands + pick latest
  fetch('/api/brands').then(r => r.json()).then(d => {
    setBrands(d.brands || []);
    if (d.brands?.[0]) {
      selectBrand(d.brands[0]);
    }
  });
}} />
```

### Step 3: Commit

```bash
git add apps/web/src/components/campaign/BrandPresetCard.tsx apps/web/src/components/campaign/Step1Setup.tsx
git commit -m "feat(campaign): integrate BrandDNAModal in Step1 for new brand extraction"
```

---

## Task 9: Supabase Unused Table Cleanup

**Files:**
- Create: `supabase/migrations/009_remove_unused_tables.sql`

### Step 1: Write migration

```sql
-- Remove unused tables: templates, campaign_ideas, jobs
-- These tables were created in 001_initial_schema.sql but never integrated with any API routes.

-- Drop RLS policies first
DROP POLICY IF EXISTS template_access ON templates;
DROP POLICY IF EXISTS campaign_ideas_access ON campaign_ideas;

-- Drop triggers
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS update_campaign_ideas_updated_at ON campaign_ideas;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;

-- Drop indexes
DROP INDEX IF EXISTS idx_templates_channel;
DROP INDEX IF EXISTS idx_campaign_ideas_campaign;
DROP INDEX IF EXISTS idx_jobs_workspace;
DROP INDEX IF EXISTS idx_jobs_status;

-- Drop tables (CASCADE handles remaining FKs)
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS campaign_ideas CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Also drop exports table (no API routes exist)
DROP TABLE IF EXISTS exports CASCADE;
```

### Step 2: Commit

```bash
git add supabase/migrations/009_remove_unused_tables.sql
git commit -m "chore(db): remove unused tables — templates, campaign_ideas, jobs, exports"
```

---

## Task 10: Build Verification and Final Push

### Step 1: Run type check

```bash
cd apps/web && npx tsc --noEmit
```

### Step 2: Run production build

```bash
cd apps/web && npx next build
```

### Step 3: Fix any remaining issues

### Step 4: Push all commits

```bash
git push origin main
```
