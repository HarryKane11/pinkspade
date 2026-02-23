'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Link2,
  Globe,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { saveBrand, type StoredBrandDna } from '@/lib/brand-storage';

type ModalState = 'input' | 'analyzing' | 'success';

interface Step {
  label: string;
  result?: React.ReactNode;
  completed: boolean;
  active: boolean;
}

interface ExtractedBrandDna {
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

interface ExtractedData {
  brandDna: ExtractedBrandDna;
  metadata: {
    rawColors: string[];
    rawFonts: string[];
  };
}

interface BrandDNAModalProps {
  open: boolean;
  onClose: () => void;
}

export function BrandDNAModal({ open, onClose }: BrandDNAModalProps) {
  const router = useRouter();
  const [state, setState] = useState<ModalState>('input');
  const [url, setUrl] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Scanning DOM structure', completed: false, active: false },
    { label: 'Extracting color palette', completed: false, active: false },
    { label: 'Identifying typography', completed: false, active: false },
    { label: 'Defining brand voice', completed: false, active: false },
  ]);

  const resetState = useCallback(() => {
    setState('input');
    setUrl('');
    setDisplayUrl('');
    setExtractedData(null);
    setSteps([
      { label: 'Scanning DOM structure', completed: false, active: false },
      { label: 'Extracting color palette', completed: false, active: false },
      { label: 'Identifying typography', completed: false, active: false },
      { label: 'Defining brand voice', completed: false, active: false },
    ]);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(resetState, 500);
  }, [onClose, resetState]);

  const completeStep = useCallback((index: number) => {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i === index) return { ...step, completed: true, active: false };
        if (i === index + 1) return { ...step, active: true };
        return step;
      })
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      let hostname = url;
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        hostname = urlObj.hostname;
        setDisplayUrl(hostname);
      } catch {
        setDisplayUrl(url);
      }

      setState('analyzing');
      setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, active: true } : s)));

      // Start visual step animation while API works
      const stepTimers = [
        setTimeout(() => completeStep(0), 1500),
        setTimeout(() => completeStep(1), 3500),
        setTimeout(() => completeStep(2), 5500),
      ];

      try {
        const res = await fetch('/api/brand-dna/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        // Clear remaining timers and fast-forward steps
        stepTimers.forEach(clearTimeout);
        setSteps((prev) => prev.map((s, i) => (i < 3 ? { ...s, completed: true, active: false } : { ...s, active: true })));

        if (res.ok) {
          const data = await res.json();
          // Store in component state for step results display
          setExtractedData({ brandDna: data.brandDna, metadata: data.metadata });
          // Store brand DNA in sessionStorage for dashboard
          sessionStorage.setItem('brandDna', JSON.stringify(data.brandDna));
          sessionStorage.setItem('brandDnaMeta', JSON.stringify(data.metadata));
          sessionStorage.setItem('brandDnaUrl', hostname);

          // Persist to localStorage for workspace
          const stored: StoredBrandDna = {
            id: crypto.randomUUID(),
            brandName: data.brandDna.brandName || hostname,
            websiteUrl: hostname,
            extractedAt: new Date().toISOString(),
            colors: data.brandDna.colors ?? {},
            typography: data.brandDna.typography ?? {},
            tone: data.brandDna.tone ?? {},
          };
          saveBrand(stored);
        }

        // Complete final step
        setTimeout(() => completeStep(3), 500);

        // Show success
        setTimeout(() => {
          setState('success');
          setTimeout(() => {
            handleClose();
            router.push('/brand-dna/extracted');
          }, 1500);
        }, 1500);
      } catch {
        // On error, fast-forward with demo data and continue
        stepTimers.forEach(clearTimeout);
        setSteps((prev) => prev.map((s) => ({ ...s, completed: true, active: false })));
        sessionStorage.removeItem('brandDna');

        setTimeout(() => {
          setState('success');
          setTimeout(() => {
            handleClose();
            router.push('/brand-dna/demo');
          }, 1500);
        }, 500);
      }
    },
    [url, completeStep, handleClose, router]
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const dna = extractedData?.brandDna;
  const meta = extractedData?.metadata;

  // Build color swatches from extracted data
  const colorSwatches = dna?.colors
    ? [dna.colors.primary, dna.colors.secondary, dna.colors.accent, dna.colors.background].filter(Boolean)
    : null;

  const stepResults: React.ReactNode[] = [
    // Step 0: Scanning DOM — show count of raw tokens found
    <span key="r1" className="text-xs text-zinc-500 font-mono">
      {meta
        ? `Found ${(meta.rawColors?.length ?? 0) + (meta.rawFonts?.length ?? 0)} style definitions`
        : 'Analyzing page structure…'}
    </span>,

    // Step 1: Color palette — show actual extracted colors
    colorSwatches ? (
      <div key="r2" className="flex items-center gap-2 mt-1">
        {colorSwatches.map((hex, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full shadow-sm border border-black/10"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    ) : (
      <span key="r2" className="text-xs text-zinc-500 font-mono">Extracting colors…</span>
    ),

    // Step 2: Typography — show actual font names
    dna?.typography ? (
      <div key="r3" className="text-xs text-zinc-900 font-medium">
        <span className="bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
          {dna.typography.heading || 'Sans Serif'}
        </span>
        {dna.typography.body && dna.typography.body !== dna.typography.heading && (
          <>
            <span className="text-zinc-400 mx-1">+</span>
            <span className="bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
              {dna.typography.body}
            </span>
          </>
        )}
      </div>
    ) : (
      <span key="r3" className="text-xs text-zinc-500 font-mono">Identifying fonts…</span>
    ),

    // Step 3: Voice — show actual tone keywords
    dna?.tone?.keywords ? (
      <span key="r4" className="text-xs text-zinc-600">
        {dna.tone.keywords.slice(0, 3).join(', ')}
      </span>
    ) : (
      <span key="r4" className="text-xs text-zinc-500 font-mono">Defining voice…</span>
    ),
  ];

  return (
    <div
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl transition-all duration-500 flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-8 md:p-10 relative transform transition-all duration-700 ease-out">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-50 hover:bg-zinc-100 rounded-full w-8 h-8 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* State 1: URL Input */}
        {state === 'input' && (
          <div className="flex flex-col">
            <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center mb-6 shadow-sm">
              <Link2 className="w-6 h-6 text-zinc-900" />
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-zinc-900 mb-2">
              Start with your website
            </h2>
            <p className="text-sm text-zinc-500 mb-8 font-light leading-relaxed">
              Enter your URL or product page. We&apos;ll automatically extract your brand&apos;s DNA
              to configure your workspace.
            </p>

            <form onSubmit={handleSubmit} className="relative flex items-center">
              <div className="absolute left-4 flex items-center justify-center text-zinc-400">
                <Globe className="w-[18px] h-[18px]" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://example.com"
                className="w-full pl-11 pr-14 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 focus:bg-white transition-all placeholder:text-zinc-400 font-medium text-zinc-900"
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1.5 p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* State 2: Analyzing */}
        {state === 'analyzing' && (
          <div className="flex flex-col">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 shadow-md relative">
              <div className="pulse-ring" />
              <img src="/logo.png" alt="Pink Spade" className="w-6 h-6 relative z-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-zinc-900 mb-2">
              Extracting Brand DNA
            </h2>
            <p className="text-sm text-zinc-500 mb-8 font-light flex items-center gap-2 truncate">
              Analyzing{' '}
              <span className="font-medium text-zinc-900 truncate max-w-[200px]">
                {displayUrl}
              </span>
            </p>

            <div className="flex flex-col gap-5">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 transition-all duration-300 ${
                    !step.active && !step.completed ? 'opacity-50' : ''
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      step.completed
                        ? 'bg-zinc-900 border border-zinc-900'
                        : 'bg-zinc-50 border border-zinc-200'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        step.completed ? 'text-zinc-900' : 'text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.completed && (
                      <div className="animate-slide-in-right">{stepResults[i]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State 3: Success */}
        {state === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100 transition-transform duration-500 ease-out scale-100">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-zinc-900 mb-2">
              Workspace Ready
            </h2>
            <p className="text-sm text-zinc-500 font-light">
              Your brand assets have been imported successfully.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
