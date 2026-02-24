import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Pink Spade는 브랜드 일관성을 자동화하는 AI 디자인 스튜디오입니다. 우리의 미션과 비전을 소개합니다.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
