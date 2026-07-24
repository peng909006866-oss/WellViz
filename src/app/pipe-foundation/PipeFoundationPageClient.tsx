'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PipeFoundationParams, RebarMeshInfo } from '@/lib/types';
import { calcPipeFoundation } from '@/lib/calc-well';
import { PIPE_FOUNDATION_PRESETS } from '@/lib/rebar';
import { NumField, Legend, ResetButton, SelectField } from '@/components/FormControls';
import { ShareButton } from '@/components/ShareButton';
import { ViewerSkeleton } from '@/components/ViewerSkeleton';
import {
  PIPE_FOUNDATION_DIAMETERS,
  PIPE_FOUNDATION_ANGLES,
  BEDDING_ANGLE_LABELS,
  lookupPipeFoundation,
} from '@/lib/tables';
import type { BeddingAngle, WellConcreteGrade } from '@/lib/tables';
import { Download, Printer, Copy, Check } from 'lucide-react';

const PipeFoundationViewer = dynamic(() => import('@/components/PipeFoundationViewer'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

const CONCRETE_OPTIONS = [
  { value: 'C25', label: 'C25' },
  { value: 'C30', label: 'C30' },
  { value: 'C35', label: 'C35' },
];

const ANGLE_OPTIONS = PIPE_FOUNDATION_ANGLES.map(a => ({
  value: a,
  label: BEDDING_ANGLE_LABELS[a],
}));

const PIPE_DIA_OPTIONS = PIPE_FOUNDATION_DIAMETERS.map(d => ({
  value: String(d),
  label: `DN${d}`,
}));

const PRESET_OPTIONS = Object.entries(PIPE_FOUNDATION_PRESETS).map(([key, preset]) => ({
  value: key,
  label: preset.id,
}));

const presetList = [
  { key: 'standard', label: '标准 DN600', dot: 'bg-blue-400' },
  { key: 'small', label: '小型 DN400', dot: 'bg-green-400' },
  { key: 'large', label: '大型 DN1200', dot: 'bg-purple-400' },
  { key: 'flatBase', label: '平基 DN800', dot: 'bg-amber-400' },
] as const;

const LEGEND_ITEMS = [
  { color: '#95A5A6', label: '混凝土基础/管座', opacity: 0.7 },
  { color: '#D4C5A9', label: '碎石垫层', opacity: 0.8 },
  { color: '#5D6D7E', label: '混凝土管道', opacity: 0.6 },
  { color: '#CBD5E1', label: '管道内腔', opacity: 0.3 },
];

const DEFAULT = { ...PIPE_FOUNDATION_PRESETS.standard };

function findPresetKey(params: PipeFoundationParams): string {
  for (const [key, preset] of Object.entries(PIPE_FOUNDATION_PRESETS)) {
    if (
      preset.id === params.id &&
      preset.pipeDiameter === params.pipeDiameter &&
      preset.beddingAngle === params.beddingAngle &&
      preset.pipeLength === params.pipeLength &&
      preset.concreteGrade === params.concreteGrade
    ) {
      return key;
    }
  }
  return '';
}

export function PipeFoundationPageClient() {
  const [params, setParams] = useState<PipeFoundationParams>(DEFAULT);
  const [selectedInfo, setSelectedInfo] = useState<RebarMeshInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calcPipeFoundation(params), [params]);
  const row = lookupPipeFoundation(params.pipeDiameter, params.beddingAngle);
  const currentPresetKey = useMemo(() => findPresetKey(params), [params]);

  function update<K extends keyof PipeFoundationParams>(key: K, value: PipeFoundationParams[K]) {
    setParams(prev => ({ ...prev, [key]: value }));
  }

  function applyPreset(key: string) {
    const preset = PIPE_FOUNDATION_PRESETS[key as keyof typeof PIPE_FOUNDATION_PRESETS];
    if (preset) {
      setParams({ ...preset } as PipeFoundationParams);
    }
  }

  async function handleCopyTable() {
    const text = [
      `管道基础计算 — 04S516`,
      `编号: ${params.id}`,
      `管径: DN${params.pipeDiameter}`,
      `包角: ${BEDDING_ANGLE_LABELS[params.beddingAngle]}`,
      `长度: ${params.pipeLength}m`,
      `混凝土等级: ${params.concreteGrade}`,
      ``,
      `基础宽度: ${result.baseWidth}mm`,
      `基础厚度: ${result.baseThickness}mm`,
      `碎石垫层: ${result.gravelThickness}mm`,
      `混凝土量: ${result.concreteVolumeM3} m³`,
      `模板面积: ${result.formAreaM2} m²`,
      `碎石体积: ${result.gravelVolumeM3} m³`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

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
            <SelectField label="编号" value={currentPresetKey}
                         onChange={v => { if (v) applyPreset(v); }}
                         options={PRESET_OPTIONS} />

            <SelectField label="管径" value={String(params.pipeDiameter)}
                         onChange={v => update('pipeDiameter', parseInt(v))}
                         options={PIPE_DIA_OPTIONS} />

            <SelectField label="管座包角" value={params.beddingAngle}
                         onChange={v => update('beddingAngle', v as BeddingAngle)}
                         options={ANGLE_OPTIONS} />

            <NumField label="管道长度 (m)" value={params.pipeLength}
                      onChange={v => update('pipeLength', v)}
                      min={1} max={1000} />

            <SelectField label="混凝土等级" value={params.concreteGrade}
                         onChange={v => update('concreteGrade', v as WellConcreteGrade)}
                         options={CONCRETE_OPTIONS} />
          </div>

          <ResetButton onClick={() => { setParams(DEFAULT); }} />
        </div>
      </aside>

      {/* 中央 3D 视图 */}
      <main className="flex-1 min-h-[400px] relative bg-gray-50/50">
        <PipeFoundationViewer
          params={params}
          result={result}
          selectedInfo={selectedInfo}
          onSelect={setSelectedInfo}
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
            <h3 className="text-xs font-semibold text-gray-700 mb-2">04S516 查表结果</h3>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span className="text-gray-500">管径:</span><span className="text-gray-800">DN{row.pipeDiameter}</span>
              <span className="text-gray-500">包角:</span><span className="text-gray-800">{BEDDING_ANGLE_LABELS[row.beddingAngle]}</span>
              <span className="text-gray-500">基础宽度:</span><span className="text-gray-800">{row.baseWidth}mm</span>
              <span className="text-gray-500">基础厚度:</span><span className="text-gray-800">{row.baseThickness}mm</span>
              <span className="text-gray-500">每米混凝土:</span><span className="text-gray-800">{row.concretePerM} m³/m</span>
              <span className="text-gray-500">每米模板:</span><span className="text-gray-800">{row.formAreaPerM} m²/m</span>
              <span className="text-gray-500">碎石垫层:</span><span className="text-gray-800">{row.gravelThickness}mm</span>
            </div>
          </div>

          {/* 计算结果 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">工程量汇总</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">管道长度:</span>
                <span className="text-gray-800 font-medium">{params.pipeLength} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">混凝土量:</span>
                <span className="text-gray-800 font-medium">{result.concreteVolumeM3} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">模板面积:</span>
                <span className="text-gray-800 font-medium">{result.formAreaM2} m²</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                <span className="text-gray-500">碎石垫层:</span>
                <span className="text-gray-800 font-medium">{result.gravelVolumeM3} m³</span>
              </div>
            </div>
          </div>

          {/* 每米指标 */}
          <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">每米指标</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">混凝土/m:</span>
                <span className="text-gray-800 font-medium">{row.concretePerM} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">模板/m:</span>
                <span className="text-gray-800 font-medium">{row.formAreaPerM} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">基础宽度:</span>
                <span className="text-gray-800 font-medium">{row.baseWidth}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">基础厚度:</span>
                <span className="text-gray-800 font-medium">{row.baseThickness}mm</span>
              </div>
            </div>
          </div>

          {/* 导出按钮 */}
          <div className="flex gap-1.5">
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
