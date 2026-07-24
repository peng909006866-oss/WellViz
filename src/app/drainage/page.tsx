import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DrainagePageClient } from './DrainagePageClient';

export const metadata: Metadata = {
  title: '排水检查井 3D 可视化 — 02S515 | WellViz',
  description: '02S515 排水检查井 3D 配筋可视化，管径+井深查表，参数化查看圆形/矩形排水检查井结构、配筋、混凝土量。',
  keywords: '排水检查井,02S515,重力流,给排水,检查井3D,配筋可视化,圆形排水检查井,矩形排水检查井',
};

export default function DrainagePage() {
  return (
    <Suspense>
      <DrainagePageClient />
    </Suspense>
  );
}
