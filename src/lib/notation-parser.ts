/**
 * WellViz 标注解析 — Phase 1 桩位
 *
 * 06MS201 标注格式比 22G101 简单得多
 * 格式: YB-Φ1000-2.5 (检查井-井径-井深)
 */

export interface NotationResult {
  wellType: string;
  diameter: number | null;
  depth: number | null;
  raw: string;
}

export function tryParseNotation(input: string): NotationResult | null {
  // Match pattern: Φ1000 or Φ1000-2.5
  const m = input.match(/[Φφ](\d{3,4})(?:[-_](\d+(?:\.\d+)?))?/);
  if (!m) return null;
  return {
    wellType: 'manhole',
    diameter: parseInt(m[1], 10),
    depth: m[2] ? parseFloat(m[2]) * 1000 : null,
    raw: input,
  };
}
