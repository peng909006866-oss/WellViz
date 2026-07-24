import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Header } from '@/components/Header';
import { TrialGate } from '@/components/TrialGate';

const geist = localFont({
  src: [
    { path: '../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: '排水结构 3D 可视化 — 06MS201 | WellViz',
  description:
    '在线查看06MS201市政排水检查井标准图，3D可视化查看井壁构造、配筋布置，参数化生成材料表。支持检查井/沉泥井/跌水井/雨水口。',
  keywords: '06MS201,排水检查井,检查井3D,市政排水,配筋可视化,沉泥井,跌水井,雨水口',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body suppressHydrationWarning className={`${geist.variable} font-sans antialiased bg-gray-50 text-gray-800`}>
        <Header />
        <TrialGate>
          {children}
        </TrialGate>
      </body>
    </html>
  );
}
