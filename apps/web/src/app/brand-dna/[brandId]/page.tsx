'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Palette, Type, AudioWaveform, LayoutGrid, LogOut, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricBar } from '@/components/ui/MetricBar';

interface BrandDna {
  brandName?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    palette?: string[];
  };
  typography?: {
    heading?: string;
    body?: string;
    style?: string;
  };
  tone?: {
    keywords?: string[];
    metrics?: Record<string, number>;
    voiceDescription?: string;
  };
}

const DEMO_DNA: BrandDna = {
  brandName: 'Example Brand',
  colors: {
    primary: '#18181B',
    secondary: '#FFD700',
    accent: '#FFD700',
    background: '#FAFAFA',
  },
  typography: { heading: 'Pretendard', body: 'System Sans', style: 'sans-serif' },
  tone: {
    keywords: ['Minimalist', 'Professional', 'Confident'],
    metrics: { professional: 85, minimalist: 92, energetic: 40 },
  },
};

export default function BrandDNADashboardPage() {
  const router = useRouter();
  const [dna, setDna] = useState<BrandDna>(DEMO_DNA);
  const [siteUrl, setSiteUrl] = useState('example.com');

  useEffect(() => {
    const stored = sessionStorage.getItem('brandDna');
    const storedUrl = sessionStorage.getItem('brandDnaUrl');
    if (stored) {
      try { setDna(JSON.parse(stored)); } catch { /* use demo */ }
    }
    if (storedUrl) setSiteUrl(storedUrl);
  }, []);

  const colors = dna.colors ?? DEMO_DNA.colors!;
  const typo = dna.typography ?? DEMO_DNA.typography!;
  const tone = dna.tone ?? DEMO_DNA.tone!;
  const metrics = tone.metrics ?? { professional: 85, minimalist: 92, energetic: 40 };

  const swatches = [
    { label: 'Primary', hex: colors.primary ?? '#18181B' },
    { label: 'Accent', hex: colors.accent ?? '#FFD700' },
    { label: 'Background', hex: colors.background ?? '#FAFAFA' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/80 relative z-20 w-full overflow-x-hidden text-sm font-normal selection:bg-zinc-200 selection:text-zinc-900">
      {/* Global Noise & Gradient */}
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      {/* Dashboard Header */}
      <header className="h-14 bg-white/50 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Pink Spade" className="w-6 h-6" />
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-900 hidden sm:block">Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            <span className="text-sm text-zinc-500 font-mono bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
              {siteUrl}
            </span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 md:py-14 animate-fade-up">
        {/* Premium Glass Profile Header */}
        <GlassCard className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 pr-8 pb-6 pl-8 gap-x-6 gap-y-6 mb-8">
          {/* Left: Brand avatar + name + URL */}
          <div className="flex items-center gap-5 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-white/80 shadow-md text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: colors.primary ?? '#18181B' }}
            >
              {(dna.brandName ?? 'B').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 truncate">
                {dna.brandName || 'Brand DNA'}
              </h1>
              <p className="text-xs font-medium text-zinc-400 mt-1 font-mono truncate">
                {siteUrl}
              </p>
            </div>
          </div>

          {/* Right: Palette + tone chips + CTA */}
          <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
            {/* Color palette swatches */}
            <div className="flex items-center gap-1.5">
              {[colors.primary, colors.secondary, colors.accent, colors.background, colors.text]
                .filter(Boolean)
                .slice(0, 5)
                .map((hex, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
            </div>
            {/* Tone keyword chips */}
            {tone.keywords && tone.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {tone.keywords.slice(0, 4).map((kw) => (
                  <span
                    key={kw}
                    className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push('/studio/demo')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-zinc-900 rounded-full py-2 px-5 hover:bg-zinc-800 transition shadow-lg shadow-zinc-900/10"
            >
              Open Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* Glassmorphic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {/* Card 1: Color Signature */}
          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <Palette className="w-4 h-4" />
                Color Signature
              </div>
              <span className="text-xs text-zinc-400 font-mono">Synced</span>
            </div>

            <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner border border-zinc-200/40 mb-2">
              <div className="h-full w-[50%] border-r border-white/20" style={{ backgroundColor: colors.primary ?? '#18181B' }} />
              <div className="h-full w-[30%] border-r border-white/20" style={{ backgroundColor: colors.accent ?? '#FFD700' }} />
              <div className="h-full w-[20%]" style={{ backgroundColor: colors.background ?? '#FAFAFA' }} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-auto">
              {swatches.map((swatch) => (
                <div
                  key={swatch.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/60 border border-zinc-100 text-center"
                >
                  <div className="w-6 h-6 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: swatch.hex }} />
                  <span className="text-xs uppercase tracking-widest text-zinc-400">{swatch.label}</span>
                  <span className="text-xs font-semibold text-zinc-900">{swatch.hex}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Card 2: Typographic Genome */}
          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              <Type className="w-4 h-4" />
              Typographic Genome
            </div>

            <div className="flex items-center gap-5 mb-4">
              <div className="text-6xl font-semibold tracking-tighter text-zinc-900 leading-none" style={{ fontFamily: typo.heading }}>Aa</div>
              <div className="flex flex-col">
                <h3 className="text-3xl font-semibold tracking-tight text-zinc-900">{typo.heading}</h3>
                <p className="text-xs font-medium text-zinc-400 mt-1">{typo.style || 'Sans Serif'} · Variable</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/60 border border-zinc-100">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">Headings</span>
                <span className="text-lg font-semibold tracking-tight text-zinc-900 truncate" style={{ fontFamily: typo.heading }}>
                  The quick brown fox jumps
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/60 border border-zinc-100">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">Body Copy · {typo.body}</span>
                <span className="text-sm font-normal text-zinc-600 truncate" style={{ fontFamily: typo.body }}>
                  Sphinx of black quartz, judge my vow.
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Card 3: Voice Resonance */}
          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <AudioWaveform className="w-4 h-4" />
                Voice Resonance
              </div>
              {tone.keywords && (
                <div className="flex gap-1">
                  {tone.keywords.slice(0, 3).map((kw) => (
                    <span key={kw} className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 mt-auto">
              {Object.entries(metrics).slice(0, 5).map(([label, value], i) => (
                <MetricBar
                  key={label}
                  label={label.charAt(0).toUpperCase() + label.slice(1)}
                  value={value}
                  delay={i * 100}
                  color={value >= 60 ? 'dark' : 'light'}
                />
              ))}
            </div>
          </GlassCard>

          {/* Card 4: Application (Dark Mode) */}
          <div className="relative rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col p-6 min-h-[260px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] group">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            <div className="absolute left-6 top-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 z-10">
              <LayoutGrid className="w-4 h-4" />
              Application
            </div>

            <div className="m-auto flex flex-col items-center justify-center gap-5 relative z-10 w-full pt-8">
              <div className="px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-white uppercase tracking-widest">
                DNA Injector Active
              </div>
              <button
                onClick={() => router.push('/studio/demo')}
                className="px-6 py-3 bg-white text-zinc-900 rounded-full text-sm font-semibold shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
              >
                Generate Assets <Sparkles className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
