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
