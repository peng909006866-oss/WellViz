/**
 * WellViz 规范校验 — Phase 1 桩位
 *
 * 原 RebarViz compliance.ts 已废弃
 * 此文件为最小桩，供 AI 模块编译通过
 */

export interface ComplianceResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
  message?: string;
  rule?: string;
  suggestion?: string;
}

export function checkCompliance(_params: unknown): ComplianceResult {
  return { passed: true, warnings: [], errors: [] };
}
