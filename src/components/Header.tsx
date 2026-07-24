'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Layers, ArrowDown, ArrowUpCircle, GripHorizontal, Menu, X, Sparkles } from 'lucide-react';

const NAV = [
  { href: '/manhole', label: '检查井', icon: Box },
  { href: '/sedimentation', label: '沉泥井', icon: Layers },
  { href: '/drop-manhole', label: '跌水井', icon: ArrowDown },
  { href: '/gully', label: '雨水口', icon: ArrowUpCircle },
  { href: '/pipe-foundation', label: '管道基础', icon: GripHorizontal },
];

export function Header() {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
      isLanding
        ? 'bg-[#0a0f1a]/80 border-white/5'
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className={`${isLanding ? 'w-full' : 'max-w-[1600px] mx-auto'} px-4 h-14 flex items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-500">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className={`text-base font-bold ${isLanding ? 'text-white' : 'text-gray-800'}`}>WellViz</span>
            <span className={`hidden sm:block text-[11px] ${isLanding ? 'text-gray-400' : 'text-muted'}`}>排水结构可视化 · 06MS201</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isLanding
                    ? active ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    : active ? 'text-teal-600 bg-teal-50' : 'text-muted hover:bg-gray-100 hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isLanding && (
            <>
              <a
                href="#features"
                className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <Sparkles className="h-4 w-4 text-blue-300" />
                AI 助手
              </a>
              <Link
                href="/manhole"
                className="hidden sm:inline-flex items-center rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                开始使用
              </Link>
            </>
          )}
          <button
            className="md:hidden p-2 rounded-lg cursor-pointer transition-colors text-gray-400 hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && isLanding && (
        <nav className="sm:hidden border-t px-4 py-2 space-y-1 border-white/5 bg-[#0a0f1a]/95 backdrop-blur-md">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  if (isLanding) return null;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-stretch safe-bottom">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? 'text-teal-600' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
