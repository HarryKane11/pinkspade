'use client';

import { useState } from 'react';
import {
  Users,
  PenSquare,
  ShieldCheck,
  Rocket,
  Lock,
  ScanLine,
  Boxes,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BrandDNAModal } from '@/components/brand/BrandDNAModal';

export default function AboutContent() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="w-full overflow-x-hidden text-base font-light selection:bg-zinc-200 selection:text-zinc-900 relative">
      {/* Global Noise */}
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      {/* Brand DNA Modal */}
      <BrandDNAModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Navigation */}
      <Navbar onStartSetup={() => setModalOpen(true)} />

      {/* About Hero Section */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-24 px-6 flex flex-col items-center text-center relative z-10">
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200/80 text-sm mb-8 shadow-sm opacity-0"
          style={{ animationDelay: '100ms' }}
        >
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-600 font-normal">About Pink Spade</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal tracking-tighter text-zinc-900 max-w-4xl leading-[1.1] mb-8">
          <span className="animate-fade-up inline-block opacity-0" style={{ animationDelay: '200ms' }}>
            Designing
          </span>{' '}
          <span className="animate-fade-up inline-block opacity-0" style={{ animationDelay: '250ms' }}>
            the
          </span>{' '}
          <span className="animate-fade-up inline-block opacity-0" style={{ animationDelay: '300ms' }}>
            intelligence
          </span>
          <br className="hidden md:block" />
          <span className="animate-fade-up inline-block text-zinc-400 opacity-0" style={{ animationDelay: '350ms' }}>
            behind the brand.
          </span>
        </h1>

        <p
          className="animate-fade-up text-lg md:text-xl text-zinc-500 max-w-2xl font-extralight mb-10 leading-relaxed opacity-0"
          style={{ animationDelay: '450ms' }}
        >
          We believe that brand consistency shouldn&apos;t bottleneck creativity. Our mission is to
          automate the mundane constraints of design so creative teams can focus entirely on the
          extraordinary.
        </p>
      </section>

      {/* Visual Premium Image Divider */}
      <section
        className="w-full max-w-[100vw] mx-auto mb-32 relative z-10 flex flex-col items-center overflow-hidden py-16 animate-fade-up opacity-0"
        style={{ animationDelay: '600ms' }}
      >
        {/* Large Background Typography */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
          <span className="text-[25vw] font-normal tracking-tighter text-zinc-900 whitespace-nowrap -rotate-6">
            AESTHETIC
          </span>
        </div>

        <div className="relative w-full max-w-6xl px-6 flex justify-center items-center">
          {/* Floating Text Left */}
          <div className="absolute left-2 md:-left-12 top-[15%] md:top-1/4 -rotate-[12deg] z-20 pointer-events-none">
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-6 py-3 md:px-10 md:py-4 rounded-full flex items-center gap-3">
              <span className="text-xl md:text-4xl font-normal tracking-tighter text-zinc-800">
                Unbound
              </span>
            </div>
          </div>

          {/* Image Container */}
          <div className="w-full aspect-[4/3] md:aspect-[21/9] rounded-3xl overflow-hidden relative shadow-2xl border border-zinc-200/50 transform transition-transform duration-1000 hover:scale-[1.01] z-10 bg-zinc-100">
            <img
              src="/about-texture.png"
              alt="Textured Aesthetic Vision"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900/10 via-transparent to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl" />
          </div>

          {/* Floating Text Right */}
          <div className="absolute right-2 md:-right-12 bottom-[15%] md:bottom-1/4 -rotate-[12deg] z-20 pointer-events-none">
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-6 py-3 md:px-10 md:py-4 rounded-full flex items-center gap-3">
              <span className="text-xl md:text-4xl font-normal tracking-tighter text-zinc-800">
                Imagination
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-16 md:py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
            <div className="md:col-span-4">
              <h2 className="text-sm font-normal text-zinc-400 uppercase tracking-widest sticky top-24">
                The Problem
              </h2>
            </div>
            <div className="md:col-span-8 space-y-8 text-lg text-zinc-600 font-extralight leading-relaxed">
              <p className="text-xl md:text-2xl font-normal tracking-tight text-zinc-900 leading-snug">
                In the modern digital landscape, brands are required to produce an unprecedented
                volume of content across countless channels. Yet, the tools used to create this
                content haven&apos;t fundamentally changed in decades.
              </p>
              <p>
                Creative teams spend more time resizing assets, checking legal guidelines, and
                replacing copy than doing actual design work. The result? Creative burnout,
                compromised brand identity, and delayed campaigns across the board.
              </p>
              <p>
                Pink Spade was born out of this frustration. We built an intelligent engine that
                understands your brand&apos;s DNA—typography, color theory, voice, and strict
                compliance rules—and applies them automatically to every generation, ensuring
                absolute perfection at infinite scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-6 bg-zinc-50 border-y border-zinc-200 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-zinc-900 mb-16 text-center md:text-left">
            Principles we build by
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <PenSquare className="w-6 h-6" />,
                title: 'Creativity unchained',
                description:
                  "AI shouldn't replace designers; it should replace tedious pixel-pushing. We build tools that amplify human creativity by removing structural friction.",
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: 'Compliance by default',
                description:
                  'Brand safety is non-negotiable. Our architecture ensures that every generated asset automatically adheres to legal and stylistic brand guidelines.',
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: 'Built for infinite scale',
                description:
                  'Whether you need ten variations or ten thousand, the system adapts dynamically without a single drop in quality or performance.',
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: 'Privacy & Security',
                description:
                  'Your brand DNA is your most valuable asset. We employ enterprise-grade encryption to ensure your data and intellectual property remain entirely yours.',
              },
            ].map((value) => (
              <div
                key={value.title}
                className="p-8 md:p-10 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6 text-zinc-900">
                  {value.icon}
                </div>
                <h3 className="text-xl font-normal tracking-tight text-zinc-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-base text-zinc-500 font-extralight leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision / Roadmap */}
      <section className="py-24 md:py-32 px-6 relative z-10 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 flex flex-col items-center text-center">
            <h2 className="text-sm font-normal text-zinc-400 uppercase tracking-widest mb-4">
              The Road Ahead
            </h2>
            <h3 className="text-4xl md:text-5xl font-normal tracking-tight text-zinc-900 max-w-2xl leading-tight">
              Pioneering the next era of aesthetic automation.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-[52px] left-[16.66%] right-[16.66%] h-px bg-zinc-200 z-0" />

            {[
              {
                icon: <ScanLine className="w-6 h-6" />,
                phase: 'Phase 01',
                title: 'Contextual Generation',
                description:
                  'Perfecting static asset creation by deeply understanding brand guidelines, typography systems, and color theory semantics.',
                filled: true,
              },
              {
                icon: <Boxes className="w-6 h-6" />,
                phase: 'Phase 02 · Upcoming',
                title: 'Spatial & Motion',
                description:
                  'Extending our engine to natively support 3D environments, complex motion graphics, and dynamic spatial branding.',
                filled: false,
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                phase: 'Phase 03 · Horizon',
                title: 'Predictive Resonance',
                description:
                  'Anticipating cultural shifts and market trends to automatically evolve and suggest assets that maximize engagement.',
                dashed: true,
                filled: false,
              },
            ].map((phase) => (
              <div key={phase.title} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-28 h-28 rounded-full bg-white border-8 border-zinc-50 flex items-center justify-center mb-8 shadow-sm group-hover:border-zinc-100 transition-colors">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${phase.filled
                        ? 'bg-zinc-900 text-white'
                        : phase.dashed
                          ? 'bg-white text-zinc-400 border border-zinc-200 border-dashed'
                          : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
                      }`}
                  >
                    {phase.icon}
                  </div>
                </div>
                <div className="px-4">
                  <span className="text-sm font-normal text-zinc-400 tracking-wider uppercase mb-3 block">
                    {phase.phase}
                  </span>
                  <h4 className="text-2xl font-normal tracking-tight text-zinc-900 mb-4">
                    {phase.title}
                  </h4>
                  <p className="text-base text-zinc-500 font-extralight leading-relaxed">
                    {phase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 border-t border-zinc-200 bg-zinc-900 relative z-10 text-center px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-normal tracking-tighter text-white mb-6">
            Experience the future of design.
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 font-extralight mb-12">
            Join thousands of teams creating brand-perfect campaigns in seconds.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 text-base font-normal bg-white text-zinc-900 px-10 py-5 rounded-full hover:bg-zinc-100 transition-colors shadow-lg"
          >
            Start for free today
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
