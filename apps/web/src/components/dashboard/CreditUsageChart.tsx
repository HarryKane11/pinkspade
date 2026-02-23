'use client';

interface DailyUsage {
  date: string;
  credits: number;
}

interface ModelUsage {
  model_id: string;
  total_credits: number;
  count: number;
}

interface CreditUsageChartProps {
  dailyUsage: DailyUsage[];
  modelUsage: ModelUsage[];
  totalUsed: number;
  monthlyQuota: number;
}

const MODEL_LABELS: Record<string, string> = {
  'flux-schnell': 'Flux Schnell',
  'flux-dev': 'Flux Dev',
  'flux-pro-ultra': 'Flux Pro Ultra',
  'flux-kontext': 'Flux Kontext',
  'recraft-v4': 'Recraft v4',
  'recraft-v4-pro': 'Recraft v4 Pro',
  'recraft-v4-vector': 'Recraft Vector',
  'nano-banana-pro': 'Gemini 3 Pro',
  'copy': 'Copy Generation',
};

export function CreditUsageChart({
  dailyUsage,
  modelUsage,
  totalUsed,
  monthlyQuota,
}: CreditUsageChartProps) {
  const usagePercent = monthlyQuota > 0 ? Math.min((totalUsed / monthlyQuota) * 100, 100) : 0;
  const remaining = Math.max(monthlyQuota - totalUsed, 0);

  // Get last 14 days for the bar chart
  const maxDaily = Math.max(...dailyUsage.map((d) => d.credits), 1);

  return (
    <div className="space-y-6">
      {/* Overall usage bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-700">Monthly Usage</span>
          <span className="text-xs text-zinc-500">
            {totalUsed.toLocaleString()} / {monthlyQuota.toLocaleString()} credits
          </span>
        </div>
        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-zinc-900'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-zinc-400">{Math.round(usagePercent)}% used</span>
          <span className="text-[10px] text-zinc-400">{remaining.toLocaleString()} remaining</span>
        </div>
      </div>

      {/* Daily bar chart */}
      {dailyUsage.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-700 mb-3">Daily Usage (Last 14 days)</h4>
          <div className="flex items-end gap-1 h-24">
            {dailyUsage.map((day) => {
              const height = (day.credits / maxDaily) * 100;
              const dayLabel = new Date(day.date).getDate().toString();
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: ${day.credits} credits`}>
                  <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                    <div
                      className="w-full max-w-[24px] bg-zinc-200 hover:bg-zinc-400 rounded-t transition-colors"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-400">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model breakdown */}
      {modelUsage.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-700 mb-3">Usage by Model</h4>
          <div className="space-y-2">
            {modelUsage.map((m) => {
              const pct = totalUsed > 0 ? (m.total_credits / totalUsed) * 100 : 0;
              return (
                <div key={m.model_id} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-600 w-28 truncate">
                    {MODEL_LABELS[m.model_id] ?? m.model_id}
                  </span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 w-14 text-right">
                    {m.total_credits}
                  </span>
                  <span className="text-[10px] text-zinc-400 w-10 text-right">
                    {m.count}×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
