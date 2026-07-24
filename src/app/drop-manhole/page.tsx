import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DropManholePageClient } from './DropManholePageClient';

export const metadata: Metadata = {
  title: '跌水井 3D 可视化 — 06MS201 | WellViz',
  description: '跌水井 3D 配筋可视化，06MS201-3 标准图集查表，参数化查看井壁/消力池/环向筋/竖向筋构造。',
  keywords: '跌水井,06MS201-3,排水检查井,消力池,跌水,市政排水,3D可视化,钢筋配置',
};

export default function DropManholePage() {
  return (
    <Suspense>
      <DropManholePageClient />
    </Suspense>
  );
}
