'use client';

import Link from 'next/link';
import { Crown, Zap, User } from 'lucide-react';

interface PlanCardProps {
  plan: string;
  balance: number;
  monthlyQuota: number;
  resetAt: string | null;
}

const PLAN_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  enterprise: { label: 'Enterprise', icon: Crown, color: 'text-purple-700', bg: 'bg-purple-100' },
  pro: { label: 'Pro', icon: Zap, color: 'text-blue-700', bg: 'bg-blue-100' },
  free: { label: 'Free', icon: User, color: 'text-zinc-600', bg: 'bg-zinc-100' },
};

export function PlanCard({ plan, balance, monthlyQuota, resetAt }: PlanCardProps) {
  const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const Icon = config.icon;

  const resetDate = resetAt ? new Date(resetAt) : null;
  const daysUntilReset = resetDate
    ? Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="border border-zinc-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-900">{config.label} Plan</h3>
            <p className="text-[11px] text-zinc-400">
              {monthlyQuota.toLocaleString()} credits / month
            </p>
          </div>
        </div>
        {plan === 'free' && (
          <Link
            href="/pricing"
            className="text-[11px] font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-500 mb-1">Remaining Credits</p>
          <p className="text-xl font-semibold text-zinc-900">{balance.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-50 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-500 mb-1">Resets In</p>
          <p className="text-xl font-semibold text-zinc-900">
            {daysUntilReset !== null ? `${daysUntilReset}d` : '—'}
          </p>
          {resetDate && (
            <p className="text-[9px] text-zinc-400 mt-0.5">
              {resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
