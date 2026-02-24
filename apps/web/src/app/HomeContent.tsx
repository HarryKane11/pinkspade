'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  Wand2,
  Smartphone,
  Image as ImageIcon,
  Monitor,
  Play,
  Download,
  Layers,
  Fingerprint,
  MessageSquare,
} from 'lucide-react';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BrandDNAModal } from '@/components/brand/BrandDNAModal';

/* ── Hero format cards ── */
const HERO_FORMATS = [
  { logo: '/channel-logos/instagram.png', label: 'IG Story', dims: '1080×1920', ratio: '9:16', image: '/gallery/gallery-1.webp' },
  { logo: '/channel-logos/instagram.png', label: 'IG Feed', dims: '1080×1080', ratio: '1:1', image: '/gallery/gallery-2.webp' },
  { logo: '/channel-logos/youtube.png', label: 'YouTube', dims: '1280×720', ratio: '16:9', image: '/gallery/gallery-3.webp' },
  { logo: '/channel-logos/kakao.png', label: '카카오 광고', dims: '1200×628', ratio: '1200:628', image: '/gallery/gallery-4.webp' },
  { logo: '/channel-logos/naver.webp', label: '네이버 GFA', dims: '1200×600', ratio: '2:1', image: '/gallery/gallery-2.webp' },
];

const CHANNEL_LOGOS = [
  { src: '/channel-logos/instagram.png', alt: 'Instagram' },
  { src: '/channel-logos/kakao.png', alt: 'Kakao' },
  { src: '/channel-logos/naver.webp', alt: 'Naver' },
  { src: '/channel-logos/youtube.png', alt: 'YouTube' },
  { src: '/channel-logos/facebook.png', alt: 'Facebook' },
  { src: '/channel-logos/google.png', alt: 'Google' },
];

export default function HomeContent() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="w-full overflow-x-hidden text-sm font-normal relative">
      {/* Global Noise & Gradient */}
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      {/* Navbar */}
      <Navbar onStartSetup={() => setModalOpen(true)} />

      {/* Brand DNA Modal */}
      <BrandDNAModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ═══════════ Hero Section ═══════════ */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left — Copy */}
          <div className="flex-1 max-w-xl text-center lg:text-left">
            {/* Badge */}
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200/80 text-xs mb-8 shadow-sm opacity-0"
              style={{ animationDelay: '100ms' }}
            >
              <span className="flex h-2 w-2 rounded-full bg-pink-400 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              </span>
              <span className="text-zinc-600 font-medium">AI 멀티채널 에셋 자동화</span>
            </div>

            {/* Heading */}
            <h1
              className="animate-fade-up text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-zinc-900 leading-[1.1] mb-6 opacity-0"
              style={{ animationDelay: '200ms' }}
            >
              One image.
              <br />
              <span className="text-zinc-400">Every channel.</span>
            </h1>

            {/* Subtitle */}
            <p
              className="animate-fade-up text-base md:text-lg text-zinc-500 font-light mb-10 leading-relaxed opacity-0"
              style={{ animationDelay: '400ms' }}
            >
              제품 이미지 하나로 Instagram, Kakao, Naver, YouTube 등
              <br className="hidden sm:block" />
              모든 채널에 맞는 마케팅 에셋을 한 번에 생성하세요.
            </p>

            {/* CTAs */}
            <div
              className="animate-fade-up flex items-center justify-center lg:justify-start gap-4 mb-10 opacity-0"
              style={{ animationDelay: '550ms' }}
            >
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm font-medium bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10 flex items-center gap-2"
              >
                시작하기
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="text-sm font-medium text-zinc-600 bg-white border border-zinc-200 px-6 py-3 rounded-full hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm flex items-center gap-2"
              >
                <PlayCircle className="w-[18px] h-[18px]" />
                더 알아보기
              </a>
            </div>

            {/* Channel logos */}
            <div
              className="animate-fade-up flex items-center justify-center lg:justify-start gap-4 opacity-0"
              style={{ animationDelay: '700ms' }}
            >
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Channels</span>
              <div className="flex items-center gap-3">
                {CHANNEL_LOGOS.map((ch) => (
                  <img
                    key={ch.alt}
                    src={ch.src}
                    alt={ch.alt}
                    className="w-5 h-5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right — Format showcase grid */}
          <div
            className="flex-1 w-full max-w-[620px] animate-fade-up opacity-0"
            style={{ animationDelay: '300ms' }}
          >
            <div className="grid grid-cols-[2fr_3fr_2fr] grid-rows-2 gap-2.5 h-[380px] sm:h-[440px] lg:h-[520px]">
              {/* IG Story 9:16 — tall, spans 2 rows */}
              <div
                className="row-span-2 rounded-xl overflow-hidden relative group border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={HERO_FORMATS[0].image}
                  fill
                  sizes="200px"
                  alt={HERO_FORMATS[0].label}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Sample headline on the tall card */}
                <div className="absolute bottom-12 left-3 right-3">
                  <p className="text-[11px] sm:text-sm font-medium text-white leading-snug drop-shadow-lg">
                    올여름을 위한
                    <br />
                    완벽한 선택
                  </p>
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5">
                  <img src={HERO_FORMATS[0].logo} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  <span className="text-[10px] font-medium text-white/90">{HERO_FORMATS[0].label}</span>
                  <span className="text-[8px] text-white/50 font-mono ml-auto">{HERO_FORMATS[0].dims}</span>
                </div>
              </div>

              {/* IG Feed 1:1 */}
              <div
                className="rounded-xl overflow-hidden relative group border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={HERO_FORMATS[1].image}
                  fill
                  sizes="300px"
                  alt={HERO_FORMATS[1].label}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5">
                  <img src={HERO_FORMATS[1].logo} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  <span className="text-[10px] font-medium text-white/90">{HERO_FORMATS[1].label}</span>
                  <span className="text-[8px] text-white/50 font-mono ml-auto">{HERO_FORMATS[1].dims}</span>
                </div>
              </div>

              {/* YouTube 16:9 */}
              <div
                className="rounded-xl overflow-hidden relative group border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={HERO_FORMATS[2].image}
                  fill
                  sizes="200px"
                  alt={HERO_FORMATS[2].label}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5">
                  <img src={HERO_FORMATS[2].logo} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  <span className="text-[10px] font-medium text-white/90">{HERO_FORMATS[2].label}</span>
                  <span className="text-[8px] text-white/50 font-mono ml-auto">{HERO_FORMATS[2].dims}</span>
                </div>
              </div>

              {/* 카카오 광고 */}
              <div
                className="rounded-xl overflow-hidden relative group border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={HERO_FORMATS[3].image}
                  fill
                  sizes="300px"
                  alt={HERO_FORMATS[3].label}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5">
                  <img src={HERO_FORMATS[3].logo} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  <span className="text-[10px] font-medium text-white/90">{HERO_FORMATS[3].label}</span>
                  <span className="text-[8px] text-white/50 font-mono ml-auto">{HERO_FORMATS[3].dims}</span>
                </div>
              </div>

              {/* 네이버 GFA */}
              <div
                className="rounded-xl overflow-hidden relative group border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={HERO_FORMATS[4].image}
                  fill
                  sizes="200px"
                  alt={HERO_FORMATS[4].label}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5">
                  <img src={HERO_FORMATS[4].logo} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  <span className="text-[10px] font-medium text-white/90">{HERO_FORMATS[4].label}</span>
                  <span className="text-[8px] text-white/50 font-mono ml-auto">{HERO_FORMATS[4].dims}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

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

      {/* Asset Gallery */}
      <section id="gallery" className="py-24 md:py-32 bg-white relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-zinc-900 mb-4">
              One canvas.
              <br className="hidden sm:block" />
              Every format.
            </h2>
            <p className="text-base text-zinc-500 font-light leading-relaxed">
              Create variations that stay true to your brand — for any channel,
              any campaign, any size.
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center gap-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 px-5 py-2.5 rounded-full hover:bg-zinc-50 transition-colors shadow-sm whitespace-nowrap"
          >
            View asset library
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 md:grid-rows-[240px_240px] gap-4">
          {/* Asset 1 */}
          <div className="md:col-span-1 md:row-span-2 group bento-card relative overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 aspect-[3/4] md:aspect-auto shadow-sm">
            <Image
              src="/gallery/gallery-1.webp"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              alt="Fluid abstract pink aura"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-medium text-zinc-900 shadow-sm flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Story 9:16
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              <div className="flex items-center gap-2 text-[10px] text-white/90 mb-1 font-medium tracking-wide uppercase">
                <ShieldCheck className="w-3 h-3 text-green-400" /> Brand Approved
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-full rounded-full" />
              </div>
            </div>
          </div>

          {/* Asset 2 */}
          <div className="md:col-span-2 md:row-span-1 group bento-card relative overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 aspect-video md:aspect-auto shadow-sm">
            <Image
              src="/gallery/gallery-2.webp"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              alt="Layered rose wave design"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-medium text-zinc-900 shadow-sm flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-zinc-400" /> Feed 1:1
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              <div className="flex items-center gap-2 text-[10px] text-white/90 mb-1 font-medium tracking-wide uppercase">
                <Wand2 className="w-3 h-3 text-amber-400" /> Auto-generated Copy
              </div>
              <p className="text-sm font-medium text-white truncate">
                See the world through a new lens.
              </p>
            </div>
          </div>

          {/* Asset 3 */}
          <div className="md:col-span-2 md:row-span-1 group bento-card relative overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 aspect-video md:aspect-auto shadow-sm">
            <Image
              src="/gallery/gallery-3.webp"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              alt="Translucent pink organic forms"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-medium text-zinc-900 shadow-sm flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Web Banner 16:9
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 text-[10px] text-white/90 mb-1 font-medium tracking-wide uppercase">
                  <Layers className="w-3 h-3 text-blue-400" /> Locked Layers: 3
                </div>
                <p className="text-sm font-medium text-white">Premium Card Launch</p>
              </div>
              <button aria-label="Download" className="w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-zinc-100 transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Asset 4 */}
          <div className="md:col-span-1 md:row-span-2 group bento-card relative overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 aspect-[3/4] md:aspect-auto shadow-sm">
            <Image
              src="/gallery/gallery-4.webp"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              alt="Soft pink gradient waves"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-medium text-zinc-900 shadow-sm flex items-center gap-1">
                <Play className="w-3 h-3" /> Reel Cover
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              <div className="flex items-center gap-2 text-[10px] text-white/90 mb-1 font-medium tracking-wide uppercase">
                <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" /></svg>
                Dynamic Background
              </div>
              <p className="text-xs text-zinc-300">Generated using brand color palette.</p>
            </div>
          </div>
        </div>
      </section>

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

      {/* Bottom CTA */}
      <section className="py-24 border-t border-zinc-200 bg-zinc-900 relative z-10 text-center px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tighter text-white mb-6">
            Get your team on the same page.
          </h2>
          <p className="text-base text-zinc-400 font-light mb-10">
            Brand consistency shouldn&apos;t be this hard. Now it isn&apos;t.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-medium bg-white text-zinc-900 px-8 py-4 rounded-full hover:bg-zinc-100 transition-colors shadow-lg"
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
