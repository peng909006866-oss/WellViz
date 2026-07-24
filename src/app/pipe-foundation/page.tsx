import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PipeFoundationPageClient } from './PipeFoundationPageClient';

export const metadata: Metadata = {
  title: '管道基础 3D 可视化 — 04S516 | WellViz',
  description: '04S516 混凝土管道基础 3D 可视化，管径+包角查表，参数化查看管道基础/管座/垫层构造。',
  keywords: '管道基础,04S516,混凝土管座,管基,给排水,3D可视化,管道垫层',
};

export default function PipeFoundationPage() {
  return (
    <Suspense>
      <PipeFoundationPageClient />
    </Suspense>
  );
}
