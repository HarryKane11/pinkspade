import type { Metadata } from 'next';
import GalleryContent from './GalleryContent';

export const metadata: Metadata = {
  title: '갤러리',
  description:
    'Pink Spade AI가 생성한 브랜드 디자인 에셋 갤러리. 다양한 채널과 포맷의 크리에이티브 샘플을 확인하세요.',
  alternates: {
    canonical: '/gallery',
  },
};

export default function GalleryPage() {
  return <GalleryContent />;
}
