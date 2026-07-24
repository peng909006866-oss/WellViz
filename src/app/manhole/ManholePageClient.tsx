'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ManholeParams, RebarMeshInfo } from '@/lib/types';
import { calcManhole } from '@/lib/calc-well';
import { validateManhole, type ValidationError } from '@/lib/validate';
import { MANHOLE_PRESETS } from '@/lib/rebar';
import { Field, NumField, Legend, ResetButton, SelectField, Section } from '@/components/FormControls';
import { ShareButton } from '@/components/ShareButton';
import { ViewerSkeleton } from '@/components/ViewerSkeleton';
import { getAvailableDiameters, COVER_TYPE_LABELS, lookupManhole } from '@/lib/tables';
import { exportToCSV, exportToPrintHTML, copyToClipboard } from '@/lib/export';
import type { CoverType, WellConcreteGrade } from '@/lib/tables';
import { Download, Printer, Copy, Check } from 'lucide-react';

const ManholeViewer = dynamic(() => import('@/components/ManholeViewer'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

const CONCRETE_OPTIONS = [
  { value: 'C25', label: 'C25' },
  { value: 'C30', label: 'C30' },
  { value: 'C35', label: 'C35' },
];

const COVER_OPTIONS = Object.entries(COVER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const presetList = [
  { key: 'standard', label: '标准 Φ1000', dot: 'bg-blue-400' },
  { key: 'shallow', label: '浅型 Φ700', dot: 'bg-green-400' },
  { key: 'deep', label: '深型 Φ1500', dot: 'bg-purple-400' },
  { key: 'withPipe', label: '带管道', dot: 'bg-amber-400' },
] as const;

const LEGEND_ITEMS = [
  { color: '#BDC3C7', label: '混凝土筒体', opacity: 0.5 },
  { color: '#2980B9', label: '环向筋 (水平)', opacity: 1 },
  { color: '#C0392B', label: '竖向筋', opacity: 1 },
  { color: '#6B7280', label: '盖板+井盖', opacity: 0.8 },
  { color: '#E67E22', label: '踏步/爬梯', opacity: 0.7 },
  { color: '#1ABC9C', label: '管道接口', opacity: 0.7 },
];

const DEFAULT = { ...MANHOLE_PRESETS.standard };

export function ManholePageClient() {
  const [params, setParams] = useState<ManholeParams>(DEFAULT);
  const [selectedInfo, setSelectedInfo] = useState<RebarMeshInfo | null>(null);
  const [constructionStep, setConstructionStep] = useState(5);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calcManhole(params), [params]);
  const { row } = lookupManhole(params.diameter);

  function update<K extends keyof ManholeParams>(key: K, value: ManholeParams[K]) {
    const next = { ...params, [key]: value };
    setParams(next);
    setErrors(validateManhole(next));
  }

  function applyPreset(key: string) {
    const preset = MANHOLE_PRESETS[key as keyof typeof MANHOLE_PRESETS];
    if (preset) {
      const next = { ...preset } as ManholeParams;
      setParams(next);
      setErrors(validateManhole(next));
    }
  }

  function addPipe() {
    const pipes = [...params.pipeConnections];
    pipes.push({
      diameter: 300,
      invertElevation: -(params.depth / 1000 / 2),
      angle: pipes.length * 90,
      type: pipes.length % 2 === 0 ? 'inlet' : 'outlet',
    });
    update('pipeConnections', pipes);
  }

  function removePipe(index: number) {
    const pipes = params.pipeConnections.filter((_, i) => i !== index);
    update('pipeConnections', pipes);
  }

  async function handleCopyTable() {
    const ok = await copyToClipboard(result, {
      id: params.id,
      wellType: '圆形检查井',
      diameter: params.diameter,
      depth: params.depth,
      concreteGrade: params.concreteGrade,
      coverType: COVER_TYPE_LABELS[params.coverType],
    });
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  function handleCSV() {
    exportToCSV(result, {
      id: params.id,
      wellType: '圆形检查井',
      diameter: params.diameter,
      depth: params.depth,
      concreteGrade: params.concreteGrade,
      coverType: COVER_TYPE_LABELS[params.coverType],
    });
  }

  function handlePrint() {
    exportToPrintHTML(result, {
      id: params.id,
      wellType: '圆形检查井',
      diameter: params.diameter,
      depth: params.depth,
      concreteGrade: params.concreteGrade,
      coverType: COVER_TYPE_LABELS[params.coverType],
    });
  }

  // 汇总表
  const summary = useMemo(() => {
    const map = new Map<string, { grade: string; diameter: number; totalCount: number; totalLength: number; totalWeight: number }>();
    for (const it of result.items) {
      const key = `${it.grade}-${it.diameter}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalCount += it.count;
        existing.totalLength += it.count * it.lengthM;
        existing.totalWeight += it.weightKg;
      } else {
        map.set(key, {
          grade: it.grade, diameter: it.diameter,
          totalCount: it.count,
          totalLength: it.count * it.lengthM,
          totalWeight: it.weightKg,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.diameter - b.diameter);
  }, [result.items]);

  return (
    <div className="flex flex-col xl:flex-row h-full">
      {/* 左侧参数面板 */}
      <aside className="w-full xl:w-80 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 预设 */}
          <div className="flex flex-wrap gap-1.5">
            {presetList.map(({ key, label, dot }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </button>
            ))}
          </div>

          {/* 参数输入 */}
          <div className="space-y-3">
            <Field label="井编号" value={params.id} onChange={v => update('id', v)}
                   error={errors.find(e => e.field === 'id')?.message} />
            <NumField label="井内径 Φ (mm)" value={params.diameter}
                      onChange={v => update('diameter', v)}
                      error={errors.find(e => e.field === 'diameter')?.message}
                      min={500} max={2000} />
            <NumField label="井深 (mm)" value={params.depth}
                      onChange={v => update('depth', v)}
                      error={errors.find(e => e.field === 'depth')?.message}
                      min={500} max={8000} />
            <SelectField label="盖板类型" value={params.coverType}
                         onChange={v => update('coverType', v as CoverType)}
                         options={COVER_OPTIONS} />
            <SelectField label="混凝土等级" value={params.concreteGrade}
                         onChange={v => update('concreteGrade', v as WellConcreteGrade)}
                         options={CONCRETE_OPTIONS} />

            {/* 踏步设置 */}
            <Section title="踏步/爬梯">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={params.hasSteps}
                         onChange={e => update('hasSteps', e.target.checked)}
                         className="w-3.5 h-3.5 rounded border-gray-300" />
                  设置踏步
                </label>
                {params.hasSteps && (
                  <NumField label="间距 (mm)" value={params.stepSpacing}
                            onChange={v => update('stepSpacing', v)} min={200} max={400} />
                )}
              </div>
            </Section>

            {/* 管道接口 */}
            <Section title={`管道接口 (${params.pipeConnections.length})`}>
              {params.pipeConnections.map((pipe, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className="text-gray-500">管{i + 1}:</span>
                  <span>Φ{pipe.diameter}mm</span>
                  <span className={pipe.type === 'inlet' ? 'text-cyan-600' : 'text-red-500'}>
                    {pipe.type === 'inlet' ? '进' : '出'}
                  </span>
                  <span className="text-gray-400">{pipe.angle}°</span>
                  <button onClick={() => removePipe(i)}
                          className="text-red-400 hover:text-red-600 ml-auto text-[10px] cursor-pointer">
                    删除
                  </button>
                </div>
              ))}
              <button onClick={addPipe}
                      className="w-full text-xs py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer mt-1">
                + 添加管道
              </button>
            </Section>
          </div>

          {/* 施工步骤 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">施工步骤</label>
            <input type="range" min={0} max={6} value={constructionStep}
                   onChange={e => setConstructionStep(parseInt(e.target.value))}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>基础</span><span>底板筋</span><span>竖向筋</span><span>环向筋</span><span>盖板</span><span>踏步</span><span>管道</span>
            </div>
          </div>

          <ResetButton onClick={() => { setParams(DEFAULT); setErrors([]); }} />
        </div>
      </aside>

      {/* 中央 3D 视图 */}
      <main className="flex-1 min-h-[400px] relative bg-gray-50/50">
        <ManholeViewer
          params={params}
          selectedInfo={selectedInfo}
          onSelect={setSelectedInfo}
          constructionStep={constructionStep}
        />
        <div className="absolute bottom-3 left-3">
          <Legend items={LEGEND_ITEMS} />
        </div>
        <div className="absolute top-3 right-3">
          <ShareButton params={params} />
        </div>
      </main>

      {/* 右侧数据面板 */}
      <aside className="w-full xl:w-72 shrink-0 bg-white border-l border-gray-100 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* 查表结果 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">06MS201 查表结果</h3>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span className="text-gray-500">井径:</span><span className="text-gray-800">Φ{row.diameter}mm</span>
              <span className="text-gray-500">壁厚:</span><span className="text-gray-800">{row.wallThickness}mm</span>
              <span className="text-gray-500">底板厚:</span><span className="text-gray-800">{row.baseThickness}mm</span>
              <span className="text-gray-500">盖板厚:</span><span className="text-gray-800">{row.coverThickness}mm</span>
              <span className="text-gray-500">保护层:</span><span className="text-gray-800">{row.cover}mm</span>
              <span className="text-gray-500">适用深度:</span><span className="text-gray-800">{row.applicableDepth[0]}-{row.applicableDepth[1]}m</span>
            </div>
          </div>

          {/* 配筋信息 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">配筋规格</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-gray-500">环向筋:</span><span className="text-gray-800 font-medium">{row.horizBar}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">竖向筋:</span><span className="text-gray-800 font-medium">{row.vertBar}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">盖板筋:</span><span className="text-gray-800 font-medium">{row.coverBar}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">底板筋:</span><span className="text-gray-800 font-medium">{row.baseBar}</span></div>
            </div>
          </div>

          {/* 钢筋明细表 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">钢筋明细</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="text-left py-1">名称</th>
                    <th className="text-right py-1">规格</th>
                    <th className="text-right py-1">根数</th>
                    <th className="text-right py-1">单长(m)</th>
                    <th className="text-right py-1">重量(kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1 text-gray-700">{it.name}</td>
                      <td className="text-right py-1 text-gray-500">{it.spec}</td>
                      <td className="text-right py-1 text-gray-600">{it.count}</td>
                      <td className="text-right py-1 text-gray-600">{it.lengthM.toFixed(2)}</td>
                      <td className="text-right py-1 text-gray-800 font-medium">{it.weightKg.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={4} className="text-right py-1.5 text-gray-500 text-[10px]">合计 (kg):</td>
                    <td className="text-right py-1.5 text-gray-800">{result.totalWeightKg}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 混凝土量 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">混凝土 & 模板</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">混凝土量:</span>
                <span className="text-gray-800 font-medium">{result.concreteVolumeM3} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">模板面积:</span>
                <span className="text-gray-800 font-medium">{result.formAreaM2} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">损耗率:</span>
                <span className="text-gray-800">{result.wasteRate ? (result.wasteRate * 100).toFixed(1) + '%' : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">含损耗总重:</span>
                <span className="text-gray-800 font-medium">{result.totalWithWaste} kg</span>
              </div>
            </div>
          </div>

          {/* 导出按钮 */}
          <div className="flex gap-1.5">
            <button onClick={handleCSV}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-colors bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100">
              <Download className="w-3 h-3" />CSV
            </button>
            <button onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-colors bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100">
              <Printer className="w-3 h-3" />打印
            </button>
            <button onClick={handleCopyTable}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-colors bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
