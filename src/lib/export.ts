/**
 * 排水检查井材料表导出功能
 *
 * 基于 RebarViz export.ts 改造
 * - 表头从"钢筋下料表"→"排水检查井材料表"
 * - 增加井型/井径/井深/混凝土量元数据
 * - CSV/HTML/剪贴板导出机制完全复用
 */

import type { WellCalcItem, WellCalcResult } from './types';
import { GRADE_MAP } from './rebar';

export interface ExportMeta {
  id?: string;
  wellType?: string;
  diameter?: number;
  depth?: number;
  concreteGrade?: string;
  coverType?: string;
  exportDate?: string;
}

interface SummaryRow {
  grade: string;
  diameter: number;
  totalCount: number;
  totalLengthM: number;
  totalWeightKg: number;
}

function buildSummary(items: WellCalcItem[]): SummaryRow[] {
  const map = new Map<string, SummaryRow>();
  for (const it of items) {
    const key = `${it.grade}-${it.diameter}`;
    const row = map.get(key);
    if (row) {
      row.totalCount += it.count;
      row.totalLengthM += it.count * it.lengthM;
      row.totalWeightKg += it.weightKg;
    } else {
      map.set(key, {
        grade: it.grade,
        diameter: it.diameter,
        totalCount: it.count,
        totalLengthM: it.count * it.lengthM,
        totalWeightKg: it.weightKg,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.diameter - b.diameter || a.grade.localeCompare(b.grade));
}

/**
 * 导出为 CSV 格式（可直接用 Excel 打开）
 */
export function exportToCSV(result: WellCalcResult, meta: ExportMeta = {}): void {
  const summary = buildSummary(result.items);
  const bom = '﻿';
  const lines: string[] = [];

  lines.push(`排水检查井材料表${meta.id ? ` - ${meta.id}` : ''}`);
  if (meta.wellType) lines.push(`井型: ${meta.wellType}`);
  if (meta.diameter) lines.push(`井径: Φ${meta.diameter}mm`);
  if (meta.depth) lines.push(`井深: ${(meta.depth / 1000).toFixed(2)}m`);
  if (meta.concreteGrade) lines.push(`混凝土等级: ${meta.concreteGrade}`);
  if (meta.coverType) lines.push(`盖板类型: ${meta.coverType}`);
  lines.push(`导出日期: ${meta.exportDate || new Date().toLocaleDateString('zh-CN')}`);
  lines.push('');

  lines.push('【钢筋明细】');
  lines.push('序号,名称,规格,钢种,直径(mm),根数,单根长度(m),重量(kg)');
  result.items.forEach((it, i) => {
    lines.push(`${i + 1},${it.name},${it.spec},${GRADE_MAP[it.grade] || it.grade},${it.diameter},${it.count},${it.lengthM.toFixed(2)},${it.weightKg.toFixed(2)}`);
  });

  lines.push('');
  lines.push('【按规格汇总】');
  lines.push('钢种,直径(mm),总根数,总长度(m),总重量(kg)');
  for (const r of summary) {
    lines.push(`${GRADE_MAP[r.grade] || r.grade},${r.diameter},${r.totalCount},${r.totalLengthM.toFixed(2)},${r.totalWeightKg.toFixed(2)}`);
  }
  lines.push(`合计,,,${summary.reduce((s, r) => s + r.totalLengthM, 0).toFixed(2)},${summary.reduce((s, r) => s + r.totalWeightKg, 0).toFixed(2)}`);

  if (result.wasteRate != null && result.totalWithWaste) {
    lines.push('');
    lines.push(`损耗率,${(result.wasteRate * 100).toFixed(1)}%`);
    lines.push(`含损耗合计,,,,${result.totalWithWaste}`);
  }

  lines.push('');
  lines.push(`混凝土量: ${result.concreteVolumeM3}m³, 模板面积: ${result.formAreaM2}m²`);

  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meta.id || '检查井'}_材料表.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 导出为打印友好的 HTML（可另存为 PDF）
 */
export function exportToPrintHTML(result: WellCalcResult, meta: ExportMeta = {}): void {
  const summary = buildSummary(result.items);
  const totalWeight = summary.reduce((s, r) => s + r.totalWeightKg, 0);

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>排水检查井材料表 - ${meta.id || '检查井'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Microsoft YaHei", "SimHei", sans-serif;
      padding: 20mm;
      font-size: 12px;
      line-height: 1.5;
    }
    h1 {
      font-size: 18px;
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 15px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .meta span { margin-right: 20px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: center;
    }
    th {
      background: #e0e0e0;
      font-weight: bold;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin: 15px 0 8px 0;
      padding-left: 8px;
      border-left: 4px solid #333;
    }
    .name-cell { text-align: left; }
    .total-row { background: #f0f0f0; font-weight: bold; }
    .footer {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    @media print {
      body { padding: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>排水检查井材料表</h1>

  <div class="meta">
    <span><strong>编号:</strong> ${meta.id || '-'}</span>
    <span><strong>井型:</strong> ${meta.wellType || '-'}</span>
    <span><strong>井径:</strong> ${meta.diameter ? 'Φ' + meta.diameter + 'mm' : '-'}</span>
    <span><strong>井深:</strong> ${meta.depth ? (meta.depth / 1000).toFixed(2) + 'm' : '-'}</span>
    <span><strong>混凝土:</strong> ${meta.concreteGrade || '-'}</span>
    <span><strong>盖板:</strong> ${meta.coverType || '-'}</span>
    <span><strong>日期:</strong> ${meta.exportDate || new Date().toLocaleDateString('zh-CN')}</span>
  </div>

  <div class="section-title">一、钢筋明细</div>
  <table>
    <thead>
      <tr>
        <th style="width:40px">序号</th>
        <th style="width:100px">名称</th>
        <th style="width:100px">规格</th>
        <th>钢种</th>
        <th>直径(mm)</th>
        <th>根数</th>
        <th>单根长(m)</th>
        <th>重量(kg)</th>
      </tr>
    </thead>
    <tbody>
      ${result.items.map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="name-cell">${it.name}</td>
          <td>${it.spec}</td>
          <td>${GRADE_MAP[it.grade] || it.grade}</td>
          <td>${it.diameter}</td>
          <td>${it.count}</td>
          <td>${it.lengthM.toFixed(2)}</td>
          <td>${it.weightKg.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">二、按规格汇总</div>
  <table>
    <thead>
      <tr>
        <th>钢种</th>
        <th>直径(mm)</th>
        <th>总根数</th>
        <th>总长度(m)</th>
        <th>总重量(kg)</th>
      </tr>
    </thead>
    <tbody>
      ${summary.map(r => `
        <tr>
          <td>${GRADE_MAP[r.grade] || r.grade}</td>
          <td>${r.diameter}</td>
          <td>${r.totalCount}</td>
          <td>${r.totalLengthM.toFixed(2)}</td>
          <td>${r.totalWeightKg.toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="2">合计</td>
        <td>${summary.reduce((s, r) => s + r.totalCount, 0)}</td>
        <td>${summary.reduce((s, r) => s + r.totalLengthM, 0).toFixed(2)}</td>
        <td>${totalWeight.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">三、混凝土与模板</div>
  <table>
    <thead>
      <tr>
        <th>混凝土量 (m³)</th>
        <th>模板面积 (m²)</th>
        <th>损耗率</th>
        <th>含损耗总重 (kg)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${result.concreteVolumeM3}</td>
        <td>${result.formAreaM2}</td>
        <td>${result.wasteRate != null ? (result.wasteRate * 100).toFixed(1) + '%' : '-'}</td>
        <td>${result.totalWithWaste ?? '-'}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <span>注：本表根据 06MS201 标准图集查表计算${result.wasteRate != null ? `，损耗率 ${(result.wasteRate * 100).toFixed(1)}%，含损耗合计 ${result.totalWithWaste}` : '，未含施工损耗'}</span>
    <span>由 WellViz 自动生成</span>
  </div>

  <script class="no-print">
    window.onload = () => {
      setTimeout(() => window.print(), 300);
    };
  </script>
</body>
</html>
  `.trim();

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/**
 * 复制表格到剪贴板（可直接粘贴到 Excel）
 */
export async function copyToClipboard(result: WellCalcResult, meta: ExportMeta = {}): Promise<boolean> {
  const summary = buildSummary(result.items);
  const lines: string[] = [];

  lines.push(`排水检查井材料表\t${meta.id || ''}`);
  lines.push('');
  lines.push('名称\t规格\t钢种\t直径\t根数\t单根长(m)\t重量(kg)');
  for (const it of result.items) {
    lines.push(`${it.name}\t${it.spec}\t${GRADE_MAP[it.grade] || it.grade}\t${it.diameter}\t${it.count}\t${it.lengthM.toFixed(2)}\t${it.weightKg.toFixed(2)}`);
  }
  lines.push('');
  lines.push('【汇总】\t钢种\t直径\t总根数\t总长(m)\t总重(kg)');
  for (const r of summary) {
    lines.push(`\t${GRADE_MAP[r.grade] || r.grade}\t${r.diameter}\t${r.totalCount}\t${r.totalLengthM.toFixed(2)}\t${r.totalWeightKg.toFixed(2)}`);
  }
  lines.push(`混凝土量: ${result.concreteVolumeM3}m³\t模板面积: ${result.formAreaM2}m²`);
  if (result.wasteRate != null && result.totalWithWaste) {
    lines.push(`损耗率: ${(result.wasteRate * 100).toFixed(1)}%\t含损耗合计: ${result.totalWithWaste}`);
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    return true;
  } catch {
    return false;
  }
}
