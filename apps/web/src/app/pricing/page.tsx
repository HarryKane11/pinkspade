'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Check } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: '500',
    features: [
      '500 credits / month',
      'Basic AI models',
      '3 brand profiles',
      'PNG export',
      'All channel formats',
    ],
    cta: 'Get started',
    popular: false,
    dark: false,
    checkoutId: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 29,
    yearlyPrice: 23,
    credits: '5,000',
    features: [
      '5,000 credits / month',
      'All AI models',
      'Unlimited brand profiles',
      'PNG + PPTX export',
      'Priority generation',
      'Copy AI (channel-tuned)',
    ],
    cta: 'Start Pro',
    popular: true,
    dark: true,
    checkoutId: { monthly: 'pro_monthly', yearly: 'pro_yearly' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 99,
    yearlyPrice: 79,
    credits: 'Unlimited',
    features: [
      'Unlimited credits',
      'All AI models + priority',
      'Unlimited brand profiles',
      'All export formats + API',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Start Enterprise',
    popular: false,
    dark: false,
    checkoutId: { monthly: 'enterprise_monthly', yearly: 'enterprise_yearly' },
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = useCallback(async (plan: typeof PLANS[number]) => {
    if (!plan.checkoutId) {
      router.push('/onboarding');
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const planId = isYearly ? plan.checkoutId.yearly : plan.checkoutId.monthly;
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // If not authenticated, redirect to login
      if (res.status === 401) {
        router.push('/login?redirect=/pricing');
        return;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoadingPlan(null);
    }
  }, [isYearly, router]);

  return (
    <div className="w-full overflow-x-hidden text-sm font-normal relative">
      <div className="noise-bg" />
      <div className="absolute inset-0 landing-gradient -z-10 h-screen w-full pointer-events-none" />

      <Navbar />

      <section className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tighter text-zinc-900 mb-6">
          Simple, transparent pricing.
        </h1>
        <p className="text-base md:text-lg text-zinc-500 max-w-xl font-light leading-relaxed mb-10">
          Start for free. Scale when you&apos;re ready.
        </p>

        {/* Annual toggle */}
        <div className="flex items-center gap-3 mb-16">
          <span className={`text-xs font-medium ${!isYearly ? 'text-zinc-900' : 'text-zinc-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isYearly ? 'bg-zinc-900' : 'bg-zinc-200'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                isYearly ? 'left-7' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${isYearly ? 'text-zinc-900' : 'text-zinc-400'}`}>
            Yearly
          </span>
          {isYearly && (
            <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {PLANS.map((plan) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`p-8 rounded-2xl text-left relative ${
                  plan.dark
                    ? 'border-2 border-zinc-900 bg-zinc-900'
                    : 'border border-zinc-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-8 px-3 py-0.5 bg-zinc-900 text-white text-[10px] font-medium uppercase tracking-wider rounded-full border border-zinc-700">
                    Popular
                  </span>
                )}

                <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${plan.dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-semibold tracking-tight ${plan.dark ? 'text-white' : 'text-zinc-900'}`}>
                    ${price}
                  </span>
                  {price > 0 && (
                    <span className={`text-xs ${plan.dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      / month
                    </span>
                  )}
                </div>
                <p className={`text-xs mb-8 ${plan.dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {price === 0 ? 'forever' : isYearly ? `$${price * 12}/year billed annually` : 'billed monthly'}
                </p>

                <div className={`text-xs font-medium mb-4 px-2.5 py-1.5 rounded-md inline-block ${
                  plan.dark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {plan.credits} credits/month
                </div>

                <ul className={`flex flex-col gap-3 text-sm font-light mb-8 ${plan.dark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.dark ? 'text-green-400' : 'text-green-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 ${
                    plan.dark
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                      : 'border border-zinc-200 text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Loading...' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
