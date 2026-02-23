import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pink Spade',
  description: 'AI 기반 브랜드 디자인 자동화 스튜디오 — 브랜드 DNA 추출, 컴플라이언스 가드, 무한 스케일 에셋 생성',
  keywords: ['AI', '마케팅', '디자인', '브랜드', '에셋 생성', 'Pink Spade'],
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
      </head>
      <body className="selection:bg-zinc-200 selection:text-zinc-900">
        {children}
      </body>
    </html>
  );
}
