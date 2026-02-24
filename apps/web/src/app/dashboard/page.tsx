'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CreditUsageChart } from '@/components/dashboard/CreditUsageChart';
import { PlanCard } from '@/components/dashboard/PlanCard';
import { useCreditData } from '@/contexts/credit-context';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UsageData {
  totalUsed: number;
  dailyUsage: { date: string; credits: number }[];
  modelUsage: { model_id: string; total_credits: number; count: number }[];
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { balance, plan, monthlyQuota, resetAt, isLoading: balanceLoading } = useCreditData();
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShowCheckoutSuccess(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  // Fetch only usage data — balance comes from CreditProvider
  useEffect(() => {
    fetch('/api/credits/usage')
      .then((r) => r.ok ? r.json() : null)
      .then((usage) => {
        setUsageData(usage);
        setUsageLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch usage data:', err);
        setFetchError(true);
        setUsageLoading(false);
      });
  }, []);

  const loading = balanceLoading && balance === null || usageLoading;

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
      ) : fetchError ? (
        <div className="border border-red-200 bg-red-50 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-red-900 mb-1">Failed to load dashboard data</p>
          <p className="text-xs text-red-700 mb-4">Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {balance !== null && (
            <PlanCard
              plan={plan}
              balance={balance}
              monthlyQuota={monthlyQuota}
              resetAt={resetAt}
            />
          )}

          {usageData && balance !== null && (
            <div className="border border-zinc-200 rounded-xl p-6">
              <h2 className="text-sm font-medium text-zinc-900 mb-4">Credit Usage</h2>
              <CreditUsageChart
                dailyUsage={usageData.dailyUsage}
                modelUsage={usageData.modelUsage}
                totalUsed={usageData.totalUsed}
                monthlyQuota={monthlyQuota}
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
