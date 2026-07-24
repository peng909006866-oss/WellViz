'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { GullyParams } from '@/lib/types';
import { calcGully } from '@/lib/calc-well';
import { validateGully, type ValidationError } from '@/lib/validate';
import { Field, NumField, Legend, ResetButton, SelectField } from '@/components/FormControls';
import { ShareButton } from '@/components/ShareButton';
import { ViewerSkeleton } from '@/components/ViewerSkeleton';
import { getAvailableGullySizes, lookupGully, GULLY_TABLE } from '@/lib/tables';
import { exportToCSV, exportToPrintHTML, copyToClipboard } from '@/lib/export';
import type { WellConcreteGrade } from '@/lib/tables';
import { Download, Printer, Copy, Check } from 'lucide-react';

const GullyViewer = dynamic(() => import('./GullyViewer'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

const CONCRETE_OPTIONS = [
  { value: 'C25', label: 'C25' },
  { value: 'C30', label: 'C30' },
  { value: 'C35', label: 'C35' },
];

const GRATE_OPTIONS = [
  { value: 'single', label: '单箅' },
  { value: 'double', label: '双箅' },
  { value: 'triple', label: '三箅(多箅)' },
];

const LEGEND_ITEMS = [
  { color: '#BDC3C7', label: '混凝土井体', opacity: 0.5 },
  { color: '#2980B9', label: '井壁筋', opacity: 1 },
  { color: '#C0392B', label: '底板筋', opacity: 1 },
  { color: '#4A5568', label: '格栅盖', opacity: 0.8 },
  { color: '#1ABC9C', label: '管道接口', opacity: 0.7 },
];

const sizeList = [
  { key: '680×380', label: '680×380 (单箅)', dot: 'bg-blue-400' },
  { key: '750×450', label: '750×450 (双箅/多箅)', dot: 'bg-violet-400' },
] as const;

function makeDefault(): GullyParams {
  return {
    id: 'YS-680×380',
    size: '680×380',
    grateType: 'single',
    concreteGrade: 'C25',
    pipeDiameter: 300,
  };
}

export function GullyPageClient() {
  const [params, setParams] = useState<GullyParams>(makeDefault);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calcGully(params), [params]);
  const row = lookupGully(params.size);

  function update<K extends keyof GullyParams>(key: K, value: GullyParams[K]) {
    const next = { ...params, [key]: value };
    setParams(next);
    setErrors(validateGully(next));
  }

  async function handleCopyTable() {
    if (!row) return;
    const ok = await copyToClipboard(result, {
      id: params.id,
      wellType: '雨水口',
      diameter: row.bodyLength,
      depth: row.bodyDepth,
      concreteGrade: params.concreteGrade,
      coverType: `${params.grateType === 'single' ? '单箅' : params.grateType === 'double' ? '双箅' : '多箅'}格栅`,
    });
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  function handleCSV() {
    if (!row) return;
    exportToCSV(result, {
      id: params.id,
      wellType: '雨水口',
      diameter: row.bodyLength,
      depth: row.bodyDepth,
      concreteGrade: params.concreteGrade,
      coverType: `${params.grateType === 'single' ? '单箅' : params.grateType === 'double' ? '双箅' : '多箅'}格栅`,
    });
  }

  function handlePrint() {
    if (!row) return;
    exportToPrintHTML(result, {
      id: params.id,
      wellType: '雨水口',
      diameter: row.bodyLength,
      depth: row.bodyDepth,
      concreteGrade: params.concreteGrade,
      coverType: `${params.grateType === 'single' ? '单箅' : params.grateType === 'double' ? '双箅' : '多箅'}格栅`,
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

  return (
    <div className="flex flex-col xl:flex-row h-full">
      {/* 左侧参数面板 */}
      <aside className="w-full xl:w-80 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            06MS201-4 雨水口
          </div>

          {/* 尺寸预设 */}
          <div className="flex flex-wrap gap-1.5">
            {sizeList.map(({ key, label, dot }) => (
              <button
                key={key}
                onClick={() => update('size', key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  params.size === key
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Field label="雨水口编号" value={params.id} onChange={v => update('id', v)}
                   error={errors.find(e => e.field === 'id')?.message} />
            <SelectField label="尺寸规格" value={params.size}
                         onChange={v => update('size', v)}
                         options={Object.keys(GULLY_TABLE).map(k => ({ value: k, label: k }))} />
            <SelectField label="格栅类型" value={params.grateType}
                         onChange={v => update('grateType', v as 'single' | 'double' | 'triple')}
                         options={GRATE_OPTIONS} />
            <SelectField label="混凝土等级" value={params.concreteGrade}
                         onChange={v => update('concreteGrade', v as WellConcreteGrade)}
                         options={CONCRETE_OPTIONS} />
            <NumField label="连接管径 Φ (mm)" value={params.pipeDiameter}
                      onChange={v => update('pipeDiameter', v)}
                      min={100} max={600} />
          </div>

          <ResetButton onClick={() => { setParams(makeDefault()); setErrors([]); }} />
        </div>
      </aside>

      {/* 中央 3D 视图 */}
      <main className="flex-1 min-h-[400px] relative bg-gray-50/50">
        {row && (
          <GullyViewer
            bodyLength={row.bodyLength}
            bodyWidth={row.bodyWidth}
            bodyDepth={row.bodyDepth}
            wallThickness={row.wallThickness}
            grateType={params.grateType}
            pipeDiameter={params.pipeDiameter}
          />
        )}
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
          {row && (
            <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">06MS201-4 查表结果</h3>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <span className="text-gray-500">规格:</span><span className="text-gray-800 font-medium">{row.size}</span>
                <span className="text-gray-500">长度:</span><span className="text-gray-800">{row.bodyLength}mm</span>
                <span className="text-gray-500">宽度:</span><span className="text-gray-800">{row.bodyWidth}mm</span>
                <span className="text-gray-500">深度:</span><span className="text-gray-800">{row.bodyDepth}mm</span>
                <span className="text-gray-500">壁厚:</span><span className="text-gray-800">{row.wallThickness}mm</span>
                <span className="text-gray-500">底板厚:</span><span className="text-gray-800">{row.baseThickness}mm</span>
                <span className="text-gray-500">保护层:</span><span className="text-gray-800">{row.cover}mm</span>
                <span className="text-gray-500">管径范围:</span><span className="text-gray-800">Φ{row.pipeDiameter[0]}-{row.pipeDiameter[1]}</span>
              </div>
            </div>
          )}

          {/* 配筋信息 */}
          {row && (
            <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">配筋规格</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-gray-500">井壁筋:</span><span className="text-gray-800 font-medium">{row.wallBar}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">底板筋:</span><span className="text-gray-800 font-medium">{row.baseBar}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">格栅:</span><span className="text-gray-800">{params.grateType === 'single' ? '单箅' : params.grateType === 'double' ? '双箅' : '多箅'}</span></div>
              </div>
            </div>
          )}

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
