'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CampaignWizard } from '@/components/campaign/CampaignWizard';

function CampaignPageInner() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('id');
  return <CampaignWizard campaignId={campaignId} />;
}

export default function NewCampaignPage() {
  return (
    <Suspense>
      <CampaignPageInner />
    </Suspense>
  );
}
