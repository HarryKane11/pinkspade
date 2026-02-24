import type { Metadata } from 'next';
import DemoContent from './DemoContent';

export const metadata: Metadata = {
  title: '브랜드 DNA 데모',
  description:
    'Pink Spade 브랜드 DNA 추출 데모. AI가 웹사이트에서 브랜드 컬러, 타이포그래피, 톤을 자동으로 분석합니다.',
  alternates: {
    canonical: '/brand-dna/demo',
  },
};

export default function BrandDnaDemoPage() {
  return <DemoContent />;
}
