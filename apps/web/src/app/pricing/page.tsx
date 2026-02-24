import type { Metadata } from 'next';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: '요금제',
  description:
    'Pink Spade 요금제 안내. 무료 플랜부터 프로, 엔터프라이즈까지 — AI 디자인 자동화를 시작하세요.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
