'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { DropManholeParams, RebarMeshInfo } from '@/lib/types';
import { calcDropManhole } from '@/lib/calc-well';
import { validateDropManhole, type ValidationError } from '@/lib/validate';
import { Field, NumField, Legend, ResetButton, SelectField, Section } from '@/components/FormControls';
import { ShareButton } from '@/components/ShareButton';
import { ViewerSkeleton } from '@/components/ViewerSkeleton';
import { getAvailableDiameters, COVER_TYPE_LABELS, lookupDropManhole } from '@/lib/tables';
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

const LEGEND_ITEMS = [
  { color: '#BDC3C7', label: '混凝土筒体', opacity: 0.5 },
  { color: '#2980B9', label: '环向筋 (水平)', opacity: 1 },
  { color: '#C0392B', label: '竖向筋', opacity: 1 },
  { color: '#6B7280', label: '盖板+井盖', opacity: 0.8 },
  { color: '#95A5A6', label: '消力池', opacity: 0.7 },
  { color: '#E67E22', label: '踏步/爬梯', opacity: 0.7 },
  { color: '#1ABC9C', label: '管道接口', opacity: 0.7 },
];

function makeDefault(): DropManholeParams {
  const avail = getAvailableDiameters('dropManhole');
  return {
    id: 'DS-Φ1000-5.0',
    diameter: avail[0] || 1000,
    depth: 5000,
    dropHeight: 2500,
    coverType: 'heavyCastIron',
    concreteGrade: 'C30',
    hasSteps: true,
    stepSpacing: 300,
  };
}

export function DropManholePageClient() {
  const [params, setParams] = useState<DropManholeParams>(makeDefault);
  const [selectedInfo, setSelectedInfo] = useState<RebarMeshInfo | null>(null);
  const [constructionStep, setConstructionStep] = useState(5);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calcDropManhole(params), [params]);
  const { row, extra } = lookupDropManhole(params.diameter);

  function update<K extends keyof DropManholeParams>(key: K, value: DropManholeParams[K]) {
    const next = { ...params, [key]: value };
    setParams(next);
    setErrors(validateDropManhole(next));
  }

  async function handleCopyTable() {
    const ok = await copyToClipboard(result, {
      id: params.id,
      wellType: '跌水井',
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
      wellType: '跌水井',
      diameter: params.diameter,
      depth: params.depth,
      concreteGrade: params.concreteGrade,
      coverType: COVER_TYPE_LABELS[params.coverType],
    });
  }

  function handlePrint() {
    exportToPrintHTML(result, {
      id: params.id,
      wellType: '跌水井',
      diameter: params.diameter,
      depth: params.depth,
      concreteGrade: params.concreteGrade,
      coverType: COVER_TYPE_LABELS[params.coverType],
    });
  }

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

  // 构造适配 ManholeViewer 的参数
  const viewerParams = useMemo(() => {
    const pipes = [];
    if (params.inletPipe) pipes.push(params.inletPipe);
    if (params.outletPipe) pipes.push(params.outletPipe);
    return {
      id: params.id,
      diameter: params.diameter,
      depth: params.depth,
      coverType: params.coverType,
      concreteGrade: params.concreteGrade,
      pipeConnections: pipes,
      hasSteps: params.hasSteps,
      stepSpacing: params.stepSpacing,
    };
  }, [params]);

  return (
    <div className="flex flex-col xl:flex-row h-full">
      {/* 左侧参数面板 */}
      <aside className="w-full xl:w-80 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            06MS201-3 跌水井
          </div>

          <div className="space-y-3">
            <Field label="井编号" value={params.id} onChange={v => update('id', v)}
                   error={errors.find(e => e.field === 'id')?.message} />
            <NumField label="井内径 Φ (mm)" value={params.diameter}
                      onChange={v => update('diameter', v)}
                      error={errors.find(e => e.field === 'diameter')?.message}
                      min={800} max={2000} />
            <NumField label="井深 (mm)" value={params.depth}
                      onChange={v => update('depth', v)}
                      error={errors.find(e => e.field === 'depth')?.message}
                      min={2500} max={10000} />
            <NumField label="跌水高度 (mm)" value={params.dropHeight}
                      onChange={v => update('dropHeight', v)}
                      error={errors.find(e => e.field === 'dropHeight')?.message}
                      min={500} max={5000} />
            <SelectField label="盖板类型" value={params.coverType}
                         onChange={v => update('coverType', v as CoverType)}
                         options={COVER_OPTIONS} />
            <SelectField label="混凝土等级" value={params.concreteGrade}
                         onChange={v => update('concreteGrade', v as WellConcreteGrade)}
                         options={CONCRETE_OPTIONS} />

            {/* 进出水管 */}
            <Section title="进出水管道" defaultOpen>
              <div className="space-y-2">
                <div className="text-[11px] text-gray-500">进水管 (高位)</div>
                {params.inletPipe ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-cyan-600">Φ{params.inletPipe.diameter}mm</span>
                    <span className="text-gray-400">{params.inletPipe.angle}°</span>
                    <span className="text-gray-400">底高{params.inletPipe.invertElevation}m</span>
                    <button onClick={() => update('inletPipe', undefined)}
                            className="text-red-400 hover:text-red-600 ml-auto text-[10px] cursor-pointer">删除</button>
                  </div>
                ) : (
                  <button onClick={() => update('inletPipe', { diameter: 400, invertElevation: -2.0, angle: 0, type: 'inlet' })}
                          className="w-full text-xs py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer">
                    + 添加入水管
                  </button>
                )}
                <div className="text-[11px] text-gray-500 mt-2">出水管 (低位)</div>
                {params.outletPipe ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-500">Φ{params.outletPipe.diameter}mm</span>
                    <span className="text-gray-400">{params.outletPipe.angle}°</span>
                    <span className="text-gray-400">底高{params.outletPipe.invertElevation}m</span>
                    <button onClick={() => update('outletPipe', undefined)}
                            className="text-red-400 hover:text-red-600 ml-auto text-[10px] cursor-pointer">删除</button>
                  </div>
                ) : (
                  <button onClick={() => update('outletPipe', { diameter: 400, invertElevation: -5.5, angle: 180, type: 'outlet' })}
                          className="w-full text-xs py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer">
                    + 添加出水管
                  </button>
                )}
              </div>
            </Section>

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
          </div>

          <ResetButton onClick={() => { setParams(makeDefault()); setErrors([]); }} />
        </div>
      </aside>

      {/* 中央 3D 视图 */}
      <main className="flex-1 min-h-[400px] relative bg-gray-50/50">
        <ManholeViewer
          params={viewerParams}
          selectedInfo={selectedInfo}
          onSelect={setSelectedInfo}
          constructionStep={constructionStep}
        />
        <div className="absolute bottom-3 left-3">
          <Legend items={LEGEND_ITEMS} />
        </div>
        <div className="absolute top-3 right-3">
          <ShareButton params={viewerParams} />
        </div>
      </main>

      {/* 右侧数据面板 */}
      <aside className="w-full xl:w-72 shrink-0 bg-white border-l border-gray-100 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* 查表结果 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">06MS201-3 查表结果</h3>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span className="text-gray-500">井径:</span><span className="text-gray-800">Φ{row.diameter}mm</span>
              <span className="text-gray-500">壁厚:</span><span className="text-gray-800">{row.wallThickness}mm</span>
              <span className="text-gray-500">底板厚:</span><span className="text-gray-800">{row.baseThickness}mm</span>
              <span className="text-gray-500">盖板厚:</span><span className="text-gray-800">{row.coverThickness}mm</span>
              <span className="text-gray-500">保护层:</span><span className="text-gray-800">{row.cover}mm</span>
              <span className="text-gray-500">最大跌水:</span><span className="text-gray-800 font-medium text-amber-600">{extra.maxDropHeight}mm</span>
              <span className="text-gray-500">消力池深:</span><span className="text-gray-800">{extra.stillingBasinDepth}mm</span>
              <span className="text-gray-500">消力池长:</span><span className="text-gray-800">{extra.stillingBasinLength}mm</span>
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
