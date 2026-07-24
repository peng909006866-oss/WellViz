/**
 * WellViz 构造规则 — Phase 1 桩位
 *
 * 原 RebarViz construction-rules.ts 已废弃
 * 此文件为最小桩，供编译通过
 */

export function rebarArea(diameter: number): number {
  return Math.PI * (diameter / 2) ** 2;
}

export const ANCHOR_LARGE_DIA_THRESHOLD = 25;

export const LARGE_DIA_FACTOR = 1.1;
