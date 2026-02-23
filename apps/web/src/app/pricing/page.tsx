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
          Start for free. Scale when you&apos;re ready.
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
