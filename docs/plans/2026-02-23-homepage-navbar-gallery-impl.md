# Homepage, Navbar & Gallery Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify Navbar across all pages, rewrite homepage features/stats sections, create Gallery and Pricing pages.

**Architecture:** All changes are in the Next.js App Router frontend (`apps/web/`). Navbar becomes a single stateless component. Gallery page uses CSS-only infinite scroll animation for brand chips plus a client-side filter. No backend changes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons

---

### Task 1: Unify Navbar

**Files:**
- Modify: `apps/web/src/components/layout/Navbar.tsx` (full rewrite)

**Step 1: Rewrite Navbar to remove conditional logic**

Replace the entire file with a unified navigation. Remove `isAbout`/`isWorkspace` conditional rendering. Add active link highlighting based on `pathname`.

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  onStartSetup?: () => void;
}

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function Navbar({ onStartSetup }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-medium tracking-tight text-zinc-900 text-base flex items-center gap-2"
          >
            <img src="/logo.png" alt="Pink Spade" className="w-6 h-6" />
            Pink Spade
          </Link>
          <div className="hidden md:flex items-center gap-6 text-xs text-zinc-500 font-medium">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === '/about'
                  ? pathname === '/about'
                  : href === '/gallery'
                    ? pathname === '/gallery'
                    : href === '/pricing'
                      ? pathname === '/pricing'
                      : false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    isActive
                      ? 'text-zinc-900 transition-colors'
                      : 'hover:text-zinc-900 transition-colors'
                  }
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block"
          >
            Log in
          </a>
          <button
            onClick={onStartSetup}
            className="text-xs font-medium bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Start for free
          </button>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Verify** — Run `npm run build --prefix apps/web` to check for TS errors. Visually verify nav is consistent on `/`, `/about`, `/workspace`.

**Step 3: Commit** — `git add apps/web/src/components/layout/Navbar.tsx && git commit -m "refactor: unify Navbar across all pages"`

---

### Task 2: Replace Logo Cloud with Stats Bar

**Files:**
- Modify: `apps/web/src/app/page.tsx` (lines 266-280)

**Step 1: Replace the Logo Cloud section**

Find the `{/* Logo Cloud */}` section (lines 266-280) and replace with:

```tsx
      {/* Stats Bar */}
      <section className="py-10 border-y border-zinc-200 bg-zinc-50/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {[
            { value: '10+', label: 'formats supported' },
            { value: '✓', label: 'Brand-safe by default' },
            { value: '<1m', label: 'to export assets' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="text-2xl font-semibold tracking-tight text-zinc-900">{stat.value}</span>
              <span className="text-xs text-zinc-500 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
```

**Step 2: Verify** — Build passes, visually check homepage.

**Step 3: Commit** — `git commit -m "feat: replace logo cloud with product stats bar"`

---

### Task 3: Rewrite Features Section

**Files:**
- Modify: `apps/web/src/app/page.tsx` (lines 398-454, plus imports)

**Step 1: Update imports**

In the import block (lines 4-21), replace:
- Remove: `Maximize2` (no longer used)
- Add: `Fingerprint`, `MessageSquare`

The new import should be:
```tsx
import {
  ArrowRight,
  PlayCircle,
  Smartphone,
  Image as ImageIcon,
  Monitor,
  Play,
  Download,
  Layers,
  Eye,
  Lock,
  PlusCircle,
  Text,
  Upload,
  Fingerprint,
  MessageSquare,
} from 'lucide-react';
```

**Step 2: Replace the Features Section**

Replace the `{/* Features Section */}` block (lines 398-454) with:

```tsx
      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 px-6 bg-zinc-50 border-t border-zinc-200 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tighter text-zinc-900 mb-6">
              One design. Every channel.
            </h2>
            <p className="text-base text-zinc-500 font-light leading-relaxed">
              브랜드 DNA를 한 번 설정하면, 모든 채널에 맞는 캠페인 에셋이 자동으로 만들어집니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Layers className="w-5 h-5" />,
                iconColor: 'text-zinc-700 group-hover:text-zinc-900',
                title: 'Multi-format Export',
                description:
                  '하나의 디자인에서 IG Story, Feed, Web Banner, Reel 등 모든 포맷을 한 번에 생성합니다.',
              },
              {
                icon: <Fingerprint className="w-5 h-5" />,
                iconColor: 'text-pink-500 group-hover:text-pink-600',
                title: 'Brand DNA Engine',
                description:
                  '브랜드 URL만 넣으면 컬러, 폰트, 톤을 자동으로 추출합니다. 모든 에셋에 일관되게 적용됩니다.',
              },
              {
                icon: <MessageSquare className="w-5 h-5" />,
                iconColor: 'text-amber-500 group-hover:text-amber-600',
                title: 'Copy that converts',
                description:
                  '채널과 포맷에 맞는 마케팅 카피를 자동 생성합니다. 컴플라이언스 검사가 내장되어 있습니다.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl border border-zinc-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 shadow-sm flex items-center justify-center mb-6 ${feature.iconColor} transition-colors`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium tracking-tight text-zinc-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
```

**Step 3: Also remove unused imports** — Remove `ShieldCheck`, `Wand2` if no longer used elsewhere in page.tsx. Check for remaining usage before removing.

**Step 4: Verify** — Build passes. Visually check features section.

**Step 5: Commit** — `git commit -m "feat: rewrite features section to emphasize multi-channel asset creation"`

---

### Task 4: Create Pricing Placeholder Page

**Files:**
- Create: `apps/web/src/app/pricing/page.tsx`

**Step 1: Create the page**

```tsx
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PricingPage() {
  return (
    <div className="w-full overflow-x-hidden text-sm font-normal relative">
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      <Navbar />

      <section className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tighter text-zinc-900 mb-6">
          Simple, transparent pricing.
        </h1>
        <p className="text-base md:text-lg text-zinc-500 max-w-xl font-light leading-relaxed mb-16">
          Start for free. Scale when you're ready.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl border border-zinc-200 bg-white text-left">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Free</p>
            <p className="text-4xl font-semibold tracking-tight text-zinc-900 mb-1">$0</p>
            <p className="text-xs text-zinc-400 mb-8">forever</p>
            <ul className="flex flex-col gap-3 text-sm text-zinc-600 font-light mb-8">
              <li>3 brand profiles</li>
              <li>50 asset exports / month</li>
              <li>All formats included</li>
            </ul>
            <button className="w-full text-sm font-medium border border-zinc-200 text-zinc-900 px-6 py-3 rounded-full hover:bg-zinc-50 transition-colors">
              Get started
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-2xl border-2 border-zinc-900 bg-zinc-900 text-left relative">
            <span className="absolute -top-3 left-8 px-3 py-0.5 bg-zinc-900 text-white text-[10px] font-medium uppercase tracking-wider rounded-full border border-zinc-700">
              Popular
            </span>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Pro</p>
            <p className="text-4xl font-semibold tracking-tight text-white mb-1">$29</p>
            <p className="text-xs text-zinc-500 mb-8">/ month</p>
            <ul className="flex flex-col gap-3 text-sm text-zinc-300 font-light mb-8">
              <li>Unlimited brand profiles</li>
              <li>Unlimited exports</li>
              <li>Priority generation</li>
              <li>Team collaboration</li>
            </ul>
            <button className="w-full text-sm font-medium bg-white text-zinc-900 px-6 py-3 rounded-full hover:bg-zinc-100 transition-colors">
              Start free trial
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

**Step 2: Verify** — Navigate to `/pricing`, page renders correctly.

**Step 3: Commit** — `git commit -m "feat: add pricing placeholder page"`

---

### Task 5: Create Asset Gallery Page

**Files:**
- Create: `apps/web/src/app/gallery/page.tsx`
- Modify: `apps/web/src/app/globals.css` (add marquee animation)

**Step 1: Add CSS marquee animation to globals.css**

Append to `globals.css`:

```css
/* Brand chip marquee animation */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
```

**Step 2: Create the Gallery page**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Smartphone, Image as ImageIcon, Monitor, Play } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const BRANDS = [
  { name: 'Nike', color: '#111' },
  { name: 'Apple', color: '#555' },
  { name: 'Spotify', color: '#1DB954' },
  { name: 'Airbnb', color: '#FF5A5F' },
  { name: 'Starbucks', color: '#00704A' },
  { name: 'Netflix', color: '#E50914' },
  { name: 'Tesla', color: '#CC0000' },
  { name: 'Notion', color: '#000' },
  { name: 'Figma', color: '#A259FF' },
  { name: 'Slack', color: '#4A154B' },
  { name: 'Discord', color: '#5865F2' },
  { name: 'Stripe', color: '#635BFF' },
];

const FORMATS = [
  { label: 'IG Story', ratio: '9:16', icon: Smartphone },
  { label: 'Feed', ratio: '1:1', icon: ImageIcon },
  { label: 'Web Banner', ratio: '16:9', icon: Monitor },
  { label: 'Reel Cover', ratio: '9:16', icon: Play },
];

// Placeholder assets per brand — replace with real AI-generated images later
function getAssetsForBrand(brandName: string) {
  return FORMATS.map((format) => ({
    brand: brandName,
    format: format.label,
    ratio: format.ratio,
    icon: format.icon,
    // Placeholder: use existing gallery images cyclically
    image: `/gallery/gallery-${(FORMATS.indexOf(format) % 4) + 1}.webp`,
  }));
}

export default function GalleryPage() {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  const displayBrands = activeBrand
    ? BRANDS.filter((b) => b.name === activeBrand)
    : BRANDS.slice(0, 6);

  return (
    <div className="w-full overflow-x-hidden text-sm font-normal relative">
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-48 md:pb-16 px-6 flex flex-col items-center text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tighter text-zinc-900 max-w-3xl leading-tight mb-6">
          See what Pink Spade can create.
        </h1>
        <p className="text-base md:text-lg text-zinc-500 max-w-xl font-light leading-relaxed">
          유명 브랜드 기준으로 만든 캠페인 에셋 레퍼런스입니다. 클릭해서 포맷별 결과물을 확인해보세요.
        </p>
      </section>

      {/* Brand Chips Marquee */}
      <section className="py-8 border-y border-zinc-200 bg-zinc-50/50 relative z-10 overflow-hidden">
        <div className="flex animate-marquee w-max">
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <button
              key={`${brand.name}-${i}`}
              onClick={() =>
                setActiveBrand(activeBrand === brand.name ? null : brand.name)
              }
              className={`flex items-center gap-2.5 px-5 py-2.5 mx-2 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
                activeBrand === brand.name
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:shadow-sm'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: brand.color }}
              />
              {brand.name}
            </button>
          ))}
        </div>
      </section>

      {/* Filter indicator */}
      {activeBrand && (
        <div className="max-w-7xl mx-auto px-6 pt-8 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-900 font-medium">
              Showing: {activeBrand}
            </span>
            <button
              onClick={() => setActiveBrand(null)}
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors underline"
            >
              Show all
            </button>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      <section className="py-16 md:py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          {displayBrands.map((brand) => {
            const assets = getAssetsForBrand(brand.name);
            return (
              <div key={brand.name}>
                <div className="flex items-center gap-3 mb-8">
                  <span
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: brand.color }}
                  />
                  <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
                    {brand.name}
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assets.map((asset) => {
                    const Icon = asset.icon;
                    const isVertical = asset.ratio === '9:16';
                    return (
                      <div
                        key={`${asset.brand}-${asset.format}`}
                        className={`group relative overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 shadow-sm ${
                          isVertical ? 'aspect-[9/16]' : 'aspect-video'
                        }`}
                      >
                        <img
                          src={asset.image}
                          alt={`${asset.brand} ${asset.format}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-medium text-zinc-900 shadow-sm flex items-center gap-1">
                            <Icon className="w-3 h-3" /> {asset.format} {asset.ratio}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-xs font-medium text-white">{asset.brand} Campaign</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-zinc-200 bg-zinc-900 relative z-10 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-white mb-4">
            Try it with your brand.
          </h2>
          <p className="text-base text-zinc-400 font-light mb-8">
            브랜드 URL만 입력하면 동일한 퀄리티의 에셋을 바로 만들 수 있습니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium bg-white text-zinc-900 px-8 py-4 rounded-full hover:bg-zinc-100 transition-colors shadow-lg"
          >
            Start creating
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

**Step 3: Verify** — Navigate to `/gallery`, check marquee animation, brand filtering, layout.

**Step 4: Commit** — `git commit -m "feat: add asset gallery page with brand showcase"`

---

### Task 6: Update homepage gallery link

**Files:**
- Modify: `apps/web/src/app/page.tsx` (line ~297)

**Step 1:** Change the "View asset library" link from `href="#"` to `href="/gallery"`:

```tsx
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center gap-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 px-5 py-2.5 rounded-full hover:bg-zinc-50 transition-colors shadow-sm whitespace-nowrap"
          >
            View asset library
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
```

Note: Need to add `import Link from 'next/link';` at top of page.tsx if not already present.

**Step 2: Verify** — Click "View asset library" on homepage navigates to `/gallery`.

**Step 3: Commit** — `git commit -m "feat: link homepage gallery section to /gallery page"`

---

### Task 7: Final verification

**Step 1:** Run `npm run build --prefix apps/web` — ensure zero errors.

**Step 2:** Manual smoke test:
- `/` — Stats bar shows, features rewritten, gallery link works
- `/gallery` — Marquee scrolls, brand filter works, assets display
- `/pricing` — Two tiers render
- `/about` — Navbar is unified (same as homepage)
- `/workspace` — Navbar is unified

**Step 3:** Commit all remaining changes if any.
