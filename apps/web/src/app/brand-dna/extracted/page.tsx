'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /brand-dna/extracted — thin redirect.
 * BrandDNAModal stores the extracted data in sessionStorage
 * and the activeBrandId, then navigates here.
 * We redirect to /brand-dna/[brandId] (which reads sessionStorage)
 * or fall back to /workspace if no ID is present.
 */
export default function BrandDnaExtractedPage() {
  const router = useRouter();

  useEffect(() => {
    const brandId = sessionStorage.getItem('activeBrandId');
    if (brandId) {
      router.replace(`/brand-dna/${brandId}`);
    } else {
      // No brand ID but may have sessionStorage data — [brandId] page reads it anyway
      router.replace('/brand-dna/latest');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Loading brand profile...</p>
      </div>
    </div>
  );
}
