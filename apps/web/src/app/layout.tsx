import type { Metadata } from 'next';
import './globals.css';
import { CreditProvider } from '@/contexts/credit-context';
import { JsonLd } from '@/components/seo/JsonLd';

const SITE_URL = 'https://pinkspade.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Pink Spade — AI 브랜드 디자인 자동화 스튜디오',
    template: '%s | Pink Spade',
  },
  description:
    'AI 기반 브랜드 디자인 자동화 스튜디오 — 브랜드 DNA 추출, 컴플라이언스 가드, 무한 스케일 에셋 생성',
  keywords: [
    'AI 디자인',
    'AI 마케팅',
    '브랜드 디자인 자동화',
    '브랜드 DNA',
    '에셋 생성',
    '마케팅 자동화',
    '크리에이티브 자동화',
    'Pink Spade',
  ],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Pink Spade',
    title: 'Pink Spade — AI 브랜드 디자인 자동화 스튜디오',
    description:
      'AI 기반 브랜드 디자인 자동화 스튜디오 — 브랜드 DNA 추출부터 멀티채널 에셋 생성까지',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pink Spade — AI 브랜드 디자인 자동화 스튜디오',
    description:
      'AI 기반 브랜드 디자인 자동화 스튜디오 — 브랜드 DNA 추출부터 멀티채널 에셋 생성까지',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Pink Spade',
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
            description: 'AI 기반 브랜드 디자인 자동화 스튜디오',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Seoul',
              addressCountry: 'KR',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'jsagi2000@gmail.com',
              contactType: 'customer service',
            },
          }}
        />
      </head>
      <body className="selection:bg-zinc-200 selection:text-zinc-900">
        <CreditProvider>
          {children}
        </CreditProvider>
      </body>
    </html>
  );
}
