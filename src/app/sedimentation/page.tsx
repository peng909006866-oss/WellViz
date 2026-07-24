import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SedimentationPageClient } from './SedimentationPageClient';

export const metadata: Metadata = {
  title: '沉泥井 3D 可视化 — 06MS201 | WellViz',
  description: '沉泥井 3D 配筋可视化，06MS201-2 标准图集查表，参数化查看井壁/沉泥槽/环向筋/竖向筋构造。',
  keywords: '沉泥井,06MS201-2,排水检查井,沉泥槽,市政排水,3D可视化,钢筋配置',
};

export default function SedimentationPage() {
  return (
    <Suspense>
      <SedimentationPageClient />
    </Suspense>
  );
}
