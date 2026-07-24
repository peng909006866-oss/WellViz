import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ManholePageClient } from './ManholePageClient';

export const metadata: Metadata = {
  title: '检查井 3D 可视化 — 06MS201 | WellViz',
  description: '圆形检查井 3D 配筋可视化，06MS201 标准图集查表，参数化查看井壁/环向筋/竖向筋/盖板构造。',
  keywords: '检查井,06MS201,圆形检查井,排水检查井,市政排水,3D可视化,钢筋配置',
};

export default function ManholePage() {
  return (
    <Suspense>
      <ManholePageClient />
    </Suspense>
  );
}
