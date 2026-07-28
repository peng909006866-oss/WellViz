'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Box, Layers, ArrowDown, ArrowUpCircle,
  RotateCcw, MousePointerClick, BookOpen, Sparkles,
  ChevronDown, Zap, Eye, Brain, Camera, ShieldCheck,
} from 'lucide-react';
import { GlobalAIInput } from '@/components/GlobalAIInput';
import { ContactModal } from '@/components/ContactAuthor';

function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    let mouseX = 0.5, mouseY = 0.5;

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', handleMouse);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const nodeCount = 60;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({ x: Math.random() * canvas.offsetWidth, y: Math.random() * canvas.offsetHeight, vx: 0, vy: 0 });
    }

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.vx += (mouseX * w - n.x) * 0.0003 + (Math.random() - 0.5) * 0.15;
        n.vy += (mouseY * h - n.y) * 0.0003 + (Math.random() - 0.5) * 0.15;
        n.vx *= 0.98;
        n.vy *= 0.98;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = w;
        if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h;
        if (n.y > h) n.y = 0;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(45,212,191,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45,212,191,0.12)';
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMouse); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 1500;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{value}{suffix}</span>;
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: RotateCcw, title: '3D 交互查看', desc: '旋转、缩放、平移，从任意角度观察检查井构造', color: 'from-teal-500 to-cyan-400' },
  { icon: MousePointerClick, title: '点击识别', desc: '点击任意构件，即时显示详细参数与工程量', color: 'from-sky-500 to-blue-400' },
  { icon: BookOpen, title: '查表引擎', desc: '基于 06MS201 标准图，输入井径自动查表得到配筋和壁厚', color: 'from-emerald-500 to-green-400' },
  { icon: Sparkles, title: 'AI 助手', desc: '接入 DeepSeek / Qwen / Kimi，随时提问排水结构问题', color: 'from-cyan-500 to-blue-400' },
  { icon: Eye, title: '施工步骤展示', desc: '逐步展示从基础到盖板的施工过程', color: 'from-slate-500 to-blue-400' },
  { icon: Camera, title: '图纸扫描建模', desc: '上传排水工程图，AI 自动识别检查井标注并生成 3D 模型', color: 'from-blue-500 to-teal-400' },
];

const COMPONENTS = [
  {
    href: '/manhole', icon: Box, title: '检查井', code: '06MS201-1',
    desc: '圆形检查井，环向筋+竖向筋+盖板构造，06MS201 标准图查表',
    tags: ['环向配筋', '竖向配筋', '盖板选型', '管道接口', '爬梯踏步'],
    gradient: 'from-teal-600 to-cyan-500',
  },
  {
    href: '/sedimentation', icon: Layers, title: '沉泥井', code: '06MS201-2',
    desc: '底部沉泥槽构造，加深段+斜面底面，沉泥清理专用',
    tags: ['沉泥槽', '加深段', '环向配筋', '底板加厚'],
    gradient: 'from-sky-600 to-blue-500',
  },
  {
    href: '/drop-manhole', icon: ArrowDown, title: '跌水井', code: '06MS201-3',
    desc: '多级跌水、消力池结构，不同标高进出水管',
    tags: ['消力池', '跌水高度', '多级跌落', '进出水管'],
    gradient: 'from-orange-600 to-amber-500',
  },
  {
    href: '/gully', icon: ArrowUpCircle, title: '雨水口', code: '06MS201-4',
    desc: '偏沟式雨水口，格栅盖+侧壁接管，路面排水专用',
    tags: ['格栅盖', '单箅/双箅', '侧壁接管', '偏沟式'],
    gradient: 'from-indigo-600 to-violet-500',
  },
];

const STATS = [
  { value: 4, suffix: '种', label: '井型' },
  { value: 6, suffix: '', label: '06MS201 标准图集' },
  { value: 3, suffix: '个', label: 'AI 模型接入' },
  { value: 100, suffix: '%', label: '免费开源' },
];

const HERO_CAPABILITIES = [
  { icon: BookOpen, title: '基于图集', desc: '06MS201-1/2/3/4' },
  { icon: ShieldCheck, title: '标准查表', desc: '井径→壁厚→配筋' },
  { icon: RotateCcw, title: '3D 交互', desc: '旋转、缩放、步进' },
  { icon: MousePointerClick, title: '点击识别', desc: '构件信息一目了然' },
  { icon: Brain, title: 'AI 助手', desc: '三大模型随时答疑' },
];

const HERO_COMPONENTS = [
  { href: '/manhole', icon: Box, title: '检查井', desc: '圆形排水检查井' },
  { href: '/sedimentation', icon: Layers, title: '沉泥井', desc: '底部沉泥槽构造' },
  { href: '/drop-manhole', icon: ArrowDown, title: '跌水井', desc: '多级跌水消力池' },
  { href: '/gully', icon: ArrowUpCircle, title: '雨水口', desc: '偏沟式雨水收集口' },
];

export function LandingPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <main className="w-full bg-[#0a0f1a] text-white overflow-hidden">

      {/* HERO */}
      <section className="relative overflow-hidden lg:min-h-[720px] xl:min-h-[760px]">
        <MeshBackground />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a0f1a_0%,rgba(10,15,26,0.75)_50%,#0a0f1a_100%)]" />

        <div className="relative z-10 flex min-h-[720px] w-full flex-col justify-end px-5 pb-0 pt-12 sm:px-8 lg:px-12 lg:pt-16 xl:min-h-[760px]">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,680px)_1fr]">
            <div className="max-w-3xl">
              <Reveal>
                <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-slate-950/45 px-4 py-2 text-sm text-slate-200 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_18px_rgba(45,212,191,0.7)]" />
                  基于 06MS201 标准图集
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl xl:text-[86px]">
                  <span className="block text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]">排水检查井</span>
                  <span className="mt-2 block bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">3D 可视化</span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                  输入井径和井深，基于 06MS201 标准图集自动查表，即时生成检查井三维模型。旋转查看构造细节，AI 助手随时答疑。
                </p>
              </Reveal>

              <Reveal delay={280}>
                <div className="mt-7 max-w-[820px] [&>div]:mx-0">
                  <GlobalAIInput />
                </div>
              </Reveal>

              <Reveal delay={360}>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/manhole"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-bold text-white shadow-[0_20px_55px_rgba(20,184,166,0.28)] transition-all hover:bg-cyan-400 active:scale-[0.98]"
                  >
                    开始使用
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a href="#features"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 px-8 py-4 text-base font-semibold text-slate-200 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    了解更多
                    <ChevronDown className="h-5 w-5" />
                  </a>
                </div>
              </Reveal>
            </div>
            <div className="hidden min-h-[460px] lg:block" />
          </div>

          <Reveal delay={420}>
            <div className="mt-7 grid border-y border-white/10 bg-slate-950/60 backdrop-blur-md md:grid-cols-5">
              {HERO_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 border-white/10 px-5 py-5 md:border-r last:md:border-r-0">
                  <Icon className="h-7 w-7 shrink-0 text-cyan-300" strokeWidth={1.8} />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quick nav cards */}
      <section className="relative border-b border-white/[0.06] bg-[#07111d] py-8">
        <div className="w-full px-5 sm:px-8 lg:px-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">选择井型，开始查看</h2>
              <p className="mt-2 text-sm text-slate-400">覆盖 06MS201 标准图四种井型，配筋构造一目了然</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HERO_COMPONENTS.map(({ href, icon: Icon, title, desc }) => (
              <Link key={href} href={href}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-6 transition-all hover:-translate-y-0.5 hover:border-teal-300/45 hover:bg-white/[0.06]"
              >
                <Icon className="mb-3 h-8 w-8 text-teal-300" strokeWidth={1.8} />
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative border-y border-white/[0.06] bg-[#07111d]">
        <div className="relative grid w-full grid-cols-2 gap-px px-5 py-8 sm:px-8 md:grid-cols-4 lg:px-12">
          {STATS.map(({ value, suffix, label }, i) => (
            <Reveal key={label} delay={i * 100}>
              <div className="border border-white/10 bg-white/[0.025] px-5 py-6 text-center">
                <div className="text-3xl font-black text-cyan-200 sm:text-4xl">
                  <AnimatedNumber target={value} suffix={suffix} />
                </div>
                <div className="mt-2 text-sm text-slate-400">{label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative bg-[#0a0f1a] py-24 sm:py-28">
        <div className="w-full px-5 sm:px-8 lg:px-12">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-medium text-teal-300">
                <Zap className="w-3.5 h-3.5" /> 核心功能
              </div>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                为什么用 <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">WellViz</span>
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-400">围绕 06MS201 标准查表、三维模型和施工步骤展示，把排水检查井识图过程变成可操作的工程视图。</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition-all duration-300 hover:border-teal-300/35 hover:bg-white/[0.055]">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                  <p className="leading-relaxed text-slate-400">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPONENTS */}
      <section className="relative border-t border-white/[0.06] bg-[#07111d] py-24 sm:py-28">
        <div className="w-full px-5 sm:px-8 lg:px-12">
          <Reveal>
            <div className="mb-12 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-medium text-teal-300">
                <Eye className="w-3.5 h-3.5" /> 完整井型库
              </div>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">从四类井型进入模型</h2>
              <p className="mt-4 text-lg leading-8 text-slate-400">检查井、沉泥井、跌水井、雨水口，覆盖 06MS201 标准图集全部圆形井结构。</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPONENTS.map(({ href, icon: Icon, title, code, desc, tags, gradient }, i) => (
              <Reveal key={href} delay={i * 100}>
                <Link href={href}
                  className="group relative block bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 overflow-hidden cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
                  <div className="relative flex items-center gap-5 mb-5">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-white">{title}</h3>
                        <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">{code}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{desc}</p>
                    </div>
                  </div>
                  <div className="relative flex flex-wrap gap-2 mb-5">
                    {tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 text-xs text-gray-400 rounded-lg">{tag}</span>
                    ))}
                  </div>
                  <div className="relative flex items-center gap-1.5 text-sm font-medium text-gray-500 group-hover:text-white transition-colors">
                    进入查看 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section className="relative border-t border-white/[0.06] bg-[#0a0f1a] py-24 sm:py-28">
        <div className="w-full px-5 sm:px-8 lg:px-12">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a0f1a_0%,rgba(10,15,26,0.92)_42%,rgba(10,15,26,0.58)_100%)]" />
              <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-medium text-teal-300">
                    <Brain className="w-3.5 h-3.5" /> AI 驱动
                  </div>
                  <h2 className="mb-5 text-4xl font-black sm:text-5xl">
                    AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">排水顾问</span>
                  </h2>
                  <p className="mb-8 max-w-xl text-lg leading-8 text-slate-400">
                    接入 DeepSeek、通义千问、Kimi 三大模型，随时提问 06MS201 图集和排水结构问题。
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['DeepSeek', '通义千问', 'Kimi'].map(name => (
                      <span key={name} className="rounded-xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-medium text-slate-300">{name}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-2xl backdrop-blur-md">
                  <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Sparkles className="h-5 w-5 text-teal-300" />
                    <span className="font-medium text-slate-300">AI 排水顾问</span>
                    <span className="ml-auto rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">DeepSeek</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-teal-500 px-4 py-2.5 text-sm text-white">Φ1000检查井 壁厚和配筋是多少？</div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
                        根据 06MS201-1，Φ1000 圆形检查井：壁厚 <span className="text-cyan-400 font-mono font-medium">250mm</span>，环向筋 <span className="text-cyan-400 font-mono font-medium">C12@200</span>，竖向筋 <span className="text-cyan-400 font-mono font-medium">C14@200</span>。每米混凝土量约 0.98m³。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32 sm:py-40">
        <div className="absolute inset-0 bg-gradient-to-t from-teal-500/[0.06] to-transparent pointer-events-none" />
        <div className="w-full px-5 text-center sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight mb-8">准备好了吗？</h2>
            <p className="text-xl text-gray-400 mb-14 max-w-2xl mx-auto">选择一种井型，开始你的 06MS201 排水结构可视化之旅</p>
            <div className="flex flex-wrap justify-center gap-5">
              {COMPONENTS.map(({ href, icon: Icon, title, gradient }) => (
                <Link key={href} href={href}
                  className={`group flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${gradient} rounded-2xl font-bold text-white text-lg hover:shadow-[0_0_40px_rgba(45,212,191,0.2)] transition-all cursor-pointer`}
                >
                  <Icon className="w-6 h-6" />
                  {title}
                  <ArrowRight className="w-5 h-5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06]">
        <div className="w-full px-5 py-12 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-gray-300">WellViz</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setContactOpen(true)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-400 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                联系作者
              </button>
              <span className="text-gray-700">·</span>
              <p className="text-sm text-gray-600">基于 06MS201-1/2/3/4 系列图集 · 仅供学习参考</p>
            </div>
          </div>
        </div>
      </footer>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </main>
  );
}
