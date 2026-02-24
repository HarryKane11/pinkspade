import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pink Spade — AI 브랜드 디자인 자동화 스튜디오',
    short_name: 'Pink Spade',
    description:
      'AI 기반 브랜드 디자인 자동화 스튜디오 — 브랜드 DNA 추출부터 멀티채널 에셋 생성까지',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#18181B',
    icons: [
      {
        src: '/company_logo.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  };
}
