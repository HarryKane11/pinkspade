'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Palette, Type, AudioWaveform, LayoutGrid, LogOut, Sparkles, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricBar } from '@/components/ui/MetricBar';

const DEMO_DNA = {
  brandName: 'Demo Brand',
  colors: {
    primary: '#18181B',
    secondary: '#6366F1',
    accent: '#F59E0B',
    background: '#FAFAFA',
    text: '#27272A',
  },
  typography: { heading: 'Inter', body: 'System Sans', style: 'sans-serif' },
  tone: {
    keywords: ['Modern', 'Professional', 'Friendly'],
    metrics: { professional: 82, modern: 88, friendly: 70, energetic: 45 } as Record<string, number>,
  },
};

export default function DemoContent() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const colors = DEMO_DNA.colors;
  const typo = DEMO_DNA.typography;
  const tone = DEMO_DNA.tone;
  const metrics = tone.metrics;

  const swatches = [
    { label: 'Primary', hex: colors.primary },
    { label: 'Accent', hex: colors.accent },
    { label: 'Background', hex: colors.background },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/80 relative z-20 w-full overflow-x-hidden text-sm font-normal selection:bg-zinc-200 selection:text-zinc-900">
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      <header className="h-14 bg-white/50 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/company_logo.png" alt="Pink Spade" className="w-6 h-6" />
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-900 hidden sm:block">Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            <span className="text-sm text-zinc-500 font-mono bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
              demo
            </span>
          </div>
          <button
            onClick={() => router.push('/workspace')}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-14 animate-fade-up">
        {/* Demo notice */}
        {!dismissed && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">Demo Mode</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Brand extraction was unavailable. Showing sample data. You can still explore the studio.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium flex-shrink-0 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        <GlassCard className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 pr-8 pb-6 pl-8 gap-x-6 gap-y-6 mb-8">
          <div className="flex items-center gap-5 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-white/80 shadow-md text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: colors.primary }}
            >
              D
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 truncate">
                {DEMO_DNA.brandName}
              </h1>
              <p className="text-xs font-medium text-zinc-400 mt-1 font-mono truncate">
                demo
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {[colors.primary, colors.secondary, colors.accent, colors.background, colors.text]
                .filter(Boolean)
                .map((hex, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
            </div>
            {tone.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {tone.keywords.map((kw) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <Palette className="w-4 h-4" />
                Color Signature
              </div>
              <span className="text-xs text-amber-500 font-medium">Demo</span>
            </div>
            <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner border border-zinc-200/40 mb-2">
              <div className="h-full w-[50%] border-r border-white/20" style={{ backgroundColor: colors.primary }} />
              <div className="h-full w-[30%] border-r border-white/20" style={{ backgroundColor: colors.accent }} />
              <div className="h-full w-[20%]" style={{ backgroundColor: colors.background }} />
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

          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              <Type className="w-4 h-4" />
              Typographic Genome
            </div>
            <div className="flex items-center gap-5 mb-4">
              <div className="text-6xl font-semibold tracking-tighter text-zinc-900 leading-none">Aa</div>
              <div className="flex flex-col">
                <h3 className="text-3xl font-semibold tracking-tight text-zinc-900">{typo.heading}</h3>
                <p className="text-xs font-medium text-zinc-400 mt-1">{typo.style} · Variable</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/60 border border-zinc-100">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">Headings</span>
                <span className="text-lg font-semibold tracking-tight text-zinc-900 truncate">
                  The quick brown fox jumps
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/60 border border-zinc-100">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">Body Copy · {typo.body}</span>
                <span className="text-sm font-normal text-zinc-600 truncate">
                  Sphinx of black quartz, judge my vow.
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <AudioWaveform className="w-4 h-4" />
                Voice Resonance
              </div>
              <div className="flex gap-1">
                {tone.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                    {kw}
                  </span>
                ))}
              </div>
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

          <div className="relative rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col p-6 min-h-[260px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]">
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
                Demo Mode
              </div>
              <button
                onClick={() => router.push('/studio/demo')}
                className="px-6 py-3 bg-white text-zinc-900 rounded-full text-sm font-semibold shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
              >
                Try Studio <Sparkles className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
