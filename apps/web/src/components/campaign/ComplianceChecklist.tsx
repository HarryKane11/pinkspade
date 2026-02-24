'use client';

import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import type { ComplianceCheck } from './CampaignWizard';

interface ComplianceChecklistProps {
  checks: ComplianceCheck[];
  onFixClick: (assetId: string) => void;
}

export function ComplianceChecklist({ checks, onFixClick }: ComplianceChecklistProps) {
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warning').length;

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">컴플라이언스 검사</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600">{passCount}개 통과</span>
          {warnCount > 0 && <span className="text-amber-600">{warnCount}개 경고</span>}
        </div>
      </div>
      <div className="divide-y divide-zinc-100">
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {check.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-500" />}
              <div>
                <p className="text-sm text-zinc-700">{check.label}</p>
                {check.message && <p className="text-xs text-zinc-400">{check.message}</p>}
                {check.suggestion && (
                  <p className="text-xs text-blue-500 mt-0.5">제안: {check.suggestion}</p>
                )}
              </div>
            </div>
            {check.status !== 'pass' && check.assetId && (
              <button
                onClick={() => onFixClick(check.assetId!)}
                className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors"
              >
                수정하기 <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
