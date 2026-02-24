import type { Metadata } from 'next';
import HomeContent from './HomeContent';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: {
    absolute: 'Pink Spade — AI 브랜드 디자인 자동화 스튜디오',
  },
  description:
    'AI 기반 브랜드 디자인 자동화 스튜디오. 브랜드 DNA 추출, 멀티채널 에셋 자동 생성, 컴플라이언스 가드까지.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Pink Spade',
          url: 'https://pinkspade.app',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'KRW',
            description: '무료 플랜 (월 500 크레딧)',
          },
        }}
      />
      <HomeContent />
    </>
  );
}
