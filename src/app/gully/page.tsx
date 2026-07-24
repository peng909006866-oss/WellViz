import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GullyPageClient } from './GullyPageClient';

export const metadata: Metadata = {
  title: '雨水口 3D 可视化 — 06MS201 | WellViz',
  description: '雨水口 3D 可视化，06MS201-4 标准图集查表，偏沟式单箅/双箅雨水口构造查看。',
  keywords: '雨水口,06MS201-4,偏沟式雨水口,格栅盖,市政排水,3D可视化',
};

export default function GullyPage() {
  return (
    <Suspense>
      <GullyPageClient />
    </Suspense>
  );
}
