'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CreditUsageChart } from '@/components/dashboard/CreditUsageChart';
import { PlanCard } from '@/components/dashboard/PlanCard';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BalanceData {
  balance: number;
  plan: string;
  monthlyQuota: number;
  resetAt: string | null;
}

interface UsageData {
  totalUsed: number;
  dailyUsage: { date: string; credits: number }[];
  modelUsage: { model_id: string; total_credits: number; count: number }[];
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShowCheckoutSuccess(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/dashboard');
        return;
      }

      Promise.all([
        fetch('/api/credits/balance').then((r) => r.ok ? r.json() : null),
        fetch('/api/credits/usage').then((r) => r.ok ? r.json() : null),
      ]).then(([balance, usage]) => {
        setBalanceData(balance);
        setUsageData(usage);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    });
  }, [router]);

  return (
    <>
      {/* Checkout success banner */}
      {showCheckoutSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-900">Payment successful!</p>
            <p className="text-xs text-green-700 mt-0.5">Your plan has been upgraded and credits have been refreshed.</p>
          </div>
          <button
            onClick={() => setShowCheckoutSuccess(false)}
            className="text-xs text-green-600 hover:text-green-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-zinc-900">Dashboard</h1>
            <p className="text-xs text-zinc-500">Monitor your usage and manage your plan.</p>
          </div>
        </div>
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Go to Workspace
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-32 bg-zinc-100 rounded-xl" />
          <div className="h-64 bg-zinc-100 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {balanceData && (
            <PlanCard
              plan={balanceData.plan}
              balance={balanceData.balance}
              monthlyQuota={balanceData.monthlyQuota}
              resetAt={balanceData.resetAt}
            />
          )}

          {usageData && balanceData && (
            <div className="border border-zinc-200 rounded-xl p-6">
              <h2 className="text-sm font-medium text-zinc-900 mb-4">Credit Usage</h2>
              <CreditUsageChart
                dailyUsage={usageData.dailyUsage}
                modelUsage={usageData.modelUsage}
                totalUsed={usageData.totalUsed}
                monthlyQuota={balanceData.monthlyQuota}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/workspace"
              className="border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all group"
            >
              <h3 className="text-xs font-medium text-zinc-900 group-hover:text-zinc-700">Workspace</h3>
              <p className="text-[10px] text-zinc-400 mt-1">Manage brands and designs</p>
            </Link>
            <Link
              href="/pricing"
              className="border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all group"
            >
              <h3 className="text-xs font-medium text-zinc-900 group-hover:text-zinc-700">Pricing</h3>
              <p className="text-[10px] text-zinc-400 mt-1">View plans and upgrade</p>
            </Link>
            <Link
              href="/gallery"
              className="border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all group"
            >
              <h3 className="text-xs font-medium text-zinc-900 group-hover:text-zinc-700">Gallery</h3>
              <p className="text-[10px] text-zinc-400 mt-1">Browse design templates</p>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <Suspense fallback={
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-zinc-100 rounded-xl" />
            <div className="h-64 bg-zinc-100 rounded-xl" />
          </div>
        }>
          <DashboardContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
