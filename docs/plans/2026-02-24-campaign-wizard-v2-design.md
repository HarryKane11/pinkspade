# Campaign Wizard v2 — Text Overlay, Format Display, Brand UX

**Date**: 2026-02-24
**Status**: Approved

## Problems

1. FormatCard uses fixed `aspect-video` (16:9), cropping 1:1 and other aspect ratio images
2. Korean headline/description text renders in English because text is baked into the AI prompt
3. No way for users to position text (headline, description) on generated images
4. No Brand DNA creation flow when user has no brand in Step 1
5. Unused Supabase tables cluttering the schema

## Design Decisions

### 1. Dynamic Aspect Ratio in FormatCard

**Change**: Replace `aspect-video` with dynamic `aspectRatio` based on format `width/height`.

- FormatCard receives `width` and `height` props
- Uses `style={{ aspectRatio: ${width}/${height} }}` on the image container
- Extreme ratios (e.g. 728x90 banners) get max-height clamping
- ConceptRow switches from grid to flex-wrap for varied card sizes
- Step4Review preview grid also uses dynamic aspect ratios

### 2. Text Overlay System (replaces AI-rendered text)

**Core change**: AI generates background-only images. Text is CSS overlay, composited at export via Canvas.

#### Data Model

Add `textBoxes` to `CampaignAsset`:

```typescript
interface TextBox {
  id: string;
  type: 'headline' | 'description';
  x: number;      // % from left (0-100)
  y: number;      // % from top (0-100)
  width: number;  // % of container width
  height: number; // % of container height
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
}
```

Default positions:
- Headline: top-center area (x:10, y:10, width:80, height:20)
- Description: below headline (x:10, y:35, width:80, height:15)

#### Prompt Change

Remove headline/description text from the AI prompt. Instead:
- Prompt focuses on visual style, mood, brand colors, composition
- Add instruction: "Leave clean space for text overlay" or "Design a background with room for text"

#### Edit Panel (Step3EditPanel)

Extend the existing edit panel:
- **Image preview area**: Shows generated image with draggable text boxes
- **Drag**: Move text boxes by dragging
- **Resize**: Corner handles to resize
- **Real-time WYSIWYG**: Text renders live on the preview
- Position controls (x, y, width, height) as numeric inputs for precision
- Existing color/font controls remain

#### Export

When downloading (Step4Review):
- Use Canvas API to composite: background image + text boxes
- Render text with exact position, font, color, size
- Output as PNG at the format's native resolution

### 3. Brand DNA Modal in Step1

- When `data.brandDna` is null in Step1, BrandPresetCard shows:
  - "새 브랜드 추출" button (opens BrandDNAModal)
  - "브랜드 선택" button (opens existing brand selector modal)
  - "건너뛰기" button (skip)
- After BrandDNAModal completes extraction, update `data.brandDna` and `data.brandId`

### 4. Unused Table Cleanup

Create migration `009_remove_unused_tables.sql`:
- DROP TABLE `templates` (no API routes, not referenced)
- DROP TABLE `campaign_ideas` (wizard uses client state, not this table)
- DROP TABLE `jobs` (async job queue never implemented)
- Drop associated RLS policies, indexes, triggers

## Files to Modify

### New Files
- `apps/web/src/components/campaign/TextBoxOverlay.tsx` — Draggable/resizable text box component
- `apps/web/src/lib/canvas-export.ts` — Canvas compositing for PNG export
- `supabase/migrations/009_remove_unused_tables.sql` — Table cleanup

### Modified Files
- `FormatCard.tsx` — Dynamic aspect ratio
- `ConceptRow.tsx` — Flex layout for varied card sizes
- `Step3Generate.tsx` — Initialize textBoxes on assets, remove text from prompt
- `Step3EditPanel.tsx` — Add text box drag/resize preview, position controls
- `Step4Review.tsx` — Use canvas export instead of direct image download
- `CampaignWizard.tsx` — Add textBoxes to CampaignAsset interface
- `BrandPresetCard.tsx` — Add "새 브랜드 추출" button
- `Step1Setup.tsx` — Integrate BrandDNAModal
- `/api/media/generate/route.ts` — Clean prompt (no headline/description text)

## Implementation Order

1. FormatCard aspect ratio fix (quick win, immediately visible)
2. CampaignAsset type update + textBoxes data model
3. Text overlay component (TextBoxOverlay)
4. Step3EditPanel WYSIWYG preview with drag/resize
5. Prompt cleanup (remove text from AI prompt)
6. Canvas export for final PNG download
7. Brand DNA modal in Step1
8. Supabase table cleanup migration
