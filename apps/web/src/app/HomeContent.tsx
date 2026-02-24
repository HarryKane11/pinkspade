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
  Eye,
  Lock,
  PlusCircle,
  Text,
  Upload,
  Fingerprint,
  MessageSquare,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BrandDNAModal } from '@/components/brand/BrandDNAModal';

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

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-24 px-6 flex flex-col items-center text-center relative z-10">
        {/* Ping Badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200/80 text-xs mb-8 shadow-sm opacity-0"
          style={{ animationDelay: '100ms' }}
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          </span>
          <span className="text-zinc-600 font-medium">Pink Spade 2.0 — now live</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Hero Heading with Text Cycling */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-zinc-900 max-w-4xl leading-tight mb-6 flex flex-wrap justify-center gap-x-3 gap-y-1 md:gap-y-2">
          {['Your', 'brand,', 'everywhere'].map((word, i) => (
            <span
              key={word}
              className="animate-fade-up inline-block opacity-0"
              style={{ animationDelay: `${200 + i * 80}ms` }}
            >
              {word}
            </span>
          ))}
          <br className="hidden md:block" />
          <div
            className="cycle-wrapper h-[1.1em] md:h-[1.2em] animate-fade-up text-left opacity-0"
            style={{ animationDelay: '450ms' }}
          >
            <span className="cycle-text cycle-1 text-zinc-400">consistent.</span>
            <span className="cycle-text cycle-2 text-zinc-400">on message.</span>
            <span className="cycle-text cycle-3 text-zinc-400">on time.</span>
            <span className="opacity-0 pointer-events-none">on message.</span>
          </div>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-up text-base md:text-lg text-zinc-500 max-w-2xl font-light mb-10 leading-relaxed opacity-0"
          style={{ animationDelay: '600ms' }}
        >
          The design studio that keeps your brand consistent across every touchpoint.
          From social to web, one canvas handles it all.
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-fade-up flex items-center gap-4 mb-20 opacity-0"
          style={{ animationDelay: '750ms' }}
        >
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm font-medium bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10 flex items-center gap-2"
          >
            Start designing
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#"
            className="text-sm font-medium text-zinc-600 bg-white border border-zinc-200 px-6 py-3 rounded-full hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm flex items-center gap-2"
          >
            <PlayCircle className="w-[18px] h-[18px]" />
            Watch demo
          </a>
        </div>

        {/* Product Mockup */}
        <div
          className="animate-fade-up w-full max-w-[1200px] mx-auto rounded-xl md:rounded-2xl border border-zinc-200/80 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative group opacity-0"
          style={{ animationDelay: '900ms' }}
        >
          {/* Browser Chrome */}
          <div className="h-10 bg-zinc-50 border-b border-zinc-200 flex items-center px-4 gap-2 absolute top-0 w-full z-30">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <div className="mx-auto text-xs text-zinc-400 font-medium font-mono flex items-center gap-2">
              <Lock className="w-3 h-3" />
              studio.pinkspade.com
            </div>
          </div>

          {/* Studio Mockup */}
          <div className="flex h-[600px] w-full pt-10 text-left bg-zinc-100">
            {/* Side Nav */}
            <nav className="w-14 border-r border-zinc-200 bg-white flex flex-col items-center py-4 z-10 flex-shrink-0 hidden md:flex">
              <img src="/logo.png" alt="Pink Spade" className="w-8 h-8 mb-6" />
              <div className="flex flex-col gap-4 w-full px-2">
                <button className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </button>
                <button className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                </button>
                <button className="p-2 rounded-md bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-sm border border-zinc-200/50">
                  <Layers className="w-5 h-5" />
                </button>
              </div>
            </nav>

            {/* Layers Panel */}
            <aside className="w-60 border-r border-zinc-200 bg-white flex flex-col z-10 flex-shrink-0 hidden lg:flex">
              <div className="h-12 border-b border-zinc-200 flex items-center px-4 justify-between">
                <span className="text-xs font-medium text-zinc-900 tracking-wide uppercase">Layers</span>
                <PlusCircle className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-900 cursor-pointer shadow-sm">
                  <Text className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs truncate flex-1 font-medium">Headline Copy</span>
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 cursor-pointer transition-colors">
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs text-zinc-600 truncate flex-1">Product Cutout</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 cursor-pointer transition-colors">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs text-zinc-600 truncate flex-1">Gradient Overlay</span>
                </div>
              </div>
            </aside>

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col relative overflow-hidden z-0">
              <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-200 bg-white/80 backdrop-blur-md absolute top-0 w-full z-20">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900 tracking-tight">Summer Launch IG Feed</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200 hidden sm:inline-block">Draft</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Compliance Guard</span>
                    <div className="w-8 h-4 bg-zinc-900 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" />
                    </div>
                  </div>
                  <button className="text-xs px-4 py-1.5 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm">
                    Export <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 flex items-center justify-center p-8 mt-12 overflow-auto relative">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* Canvas Mockup */}
                <div className="w-[320px] h-[400px] md:w-[360px] md:h-[450px] bg-zinc-900 relative shadow-2xl ring-1 ring-zinc-200/50 flex-shrink-0 z-10">
                  <img
                    src="/gallery/gallery-2.webp"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    alt="Background"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-40 h-40 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md border border-white/20 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                  </div>

                  <div className="absolute bottom-16 left-6 right-6 layer-selected bg-white/5 backdrop-blur-sm p-2 -m-2 rounded">
                    <div className="layer-handle handle-tr" />
                    <div className="layer-handle handle-bl" />
                    <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white leading-tight break-words">
                      올여름을 위한<br />가장 <span className="text-amber-400">완벽한</span> 선택
                    </h2>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-center gap-2 opacity-80">
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <p className="text-[10px] text-zinc-300 font-normal tracking-wide uppercase">
                      Pink Spade Official
                    </p>
                  </div>
                </div>
              </div>
            </main>

            {/* Right Property Panel */}
            <aside className="w-72 border-l border-zinc-200 bg-white flex flex-col overflow-y-auto z-10 flex-shrink-0 hidden md:flex">
              <div className="flex h-12 border-b border-zinc-200">
                <button className="flex-1 flex items-center justify-center text-xs text-zinc-900 font-medium border-b-2 border-zinc-900">
                  Design
                </button>
              </div>
              <div className="p-4 flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700">Typography</span>
                    <Text className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <select className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md px-3 py-2 appearance-none outline-none">
                    <option>Pretendard</option>
                  </select>
                </div>
                <div className="w-full h-px bg-zinc-100" />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-zinc-700">AI Copy Editor</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 border border-zinc-200 px-1.5 rounded bg-zinc-50">Flash</span>
                  </div>
                  <textarea
                    className="w-full h-20 bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md p-3 outline-none resize-none"
                    defaultValue={`올여름을 위한\n가장 완벽한 선택`}
                    readOnly
                  />
                  <div className="bg-red-50 border border-red-100 rounded-md p-2.5 flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-red-600 font-medium">Compliance Alert</span>
                      <span className="text-[10px] text-zinc-600 leading-tight">
                        과장 광고 소지가 있는 단어 (&apos;완벽한&apos;)가 감지되었습니다.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
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
            <img
              src="/gallery/gallery-1.webp"
              alt="Fluid abstract pink aura"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            <img
              src="/gallery/gallery-2.webp"
              alt="Layered rose wave design"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            <img
              src="/gallery/gallery-3.webp"
              alt="Translucent pink organic forms"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
              <button className="w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-zinc-100 transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Asset 4 */}
          <div className="md:col-span-1 md:row-span-2 group bento-card relative overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 aspect-[3/4] md:aspect-auto shadow-sm">
            <img
              src="/gallery/gallery-4.webp"
              alt="Soft pink gradient waves"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
