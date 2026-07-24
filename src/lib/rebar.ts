/**
 * WellViz 钢筋标注解析工具
 *
 * 基于 RebarViz rebar.ts 简化
 * - 保留: GRADE_MAP, parseRebar, parseSpacedRebar (C12@200格式)
 * - 移除: 22G101 平法专用解析(梁柱板/箍筋/腰筋等)
 */

export const GRADE_MAP: Record<string, string> = {
  A: 'HPB300 (一级)',
  B: 'HRB335 (二级)',
  C: 'HRB400 (三级)',
  D: 'RRB400 (四级)',
  E: 'HRBF400',
};

export interface RebarInfo {
  count: number;
  grade: string;
  diameter: number;
}

export function parseRebar(str: string): RebarInfo {
  const m = str.match(/(\d+)([A-Za-z])(\d+)/);
  if (!m) return { count: 2, grade: 'C', diameter: 20 };
  return { count: parseInt(m[1]), grade: m[2].toUpperCase(), diameter: parseInt(m[3]) };
}

/** 板筋/分布筋格式: "C10@200" => { grade:'C', diameter:10, spacing:200 } */
export function parseSpacedRebar(str: string): {
  grade: string;
  diameter: number;
  spacing: number;
} {
  const m = str.match(/([A-Za-z])(\d+)@(\d+)/);
  if (!m) return { grade: 'C', diameter: 10, spacing: 200 };
  return { grade: m[1].toUpperCase(), diameter: parseInt(m[2]), spacing: parseInt(m[3]) };
}

/** 别名 (兼容旧代码) */
export const parseSlabRebar = parseSpacedRebar;

export function gradeLabel(grade: string): string {
  return GRADE_MAP[grade] || grade;
}

// ═══════════════════════════════════════════════════════════════════
// 02S515 排水检查井预设
// ═══════════════════════════════════════════════════════════════════

export const DRAINAGE_MANHOLE_PRESETS = {
  standard: {
    id: 'PS-02S515-DN400-2.5',
    pipeDiameter: 400,
    depth: 2500,
    shape: 'circular' as const,
    coverType: 'heavyCastIron' as const,
    concreteGrade: 'C30' as const,
    pipeConnections: [] as { diameter: number; invertElevation: number; angle: number; type: 'inlet' | 'outlet' }[],
    hasSteps: true,
    stepSpacing: 300,
  },
  shallow: {
    id: 'PS-02S515-DN300-1.5',
    pipeDiameter: 300,
    depth: 1500,
    shape: 'circular' as const,
    coverType: 'lightCastIron' as const,
    concreteGrade: 'C25' as const,
    pipeConnections: [],
    hasSteps: false,
    stepSpacing: 300,
  },
  deep: {
    id: 'PS-02S515-DN1000-5.0',
    pipeDiameter: 1000,
    depth: 5000,
    shape: 'circular' as const,
    coverType: 'reinforcedConcrete' as const,
    concreteGrade: 'C35' as const,
    pipeConnections: [],
    hasSteps: true,
    stepSpacing: 300,
  },
  rectangular: {
    id: 'PS-02S515-REC-DN500-3.0',
    pipeDiameter: 500,
    depth: 3000,
    shape: 'rectangular' as const,
    coverType: 'heavyCastIron' as const,
    concreteGrade: 'C30' as const,
    pipeConnections: [],
    hasSteps: true,
    stepSpacing: 300,
  },
};

// ═══════════════════════════════════════════════════════════════════
// 检查井预设
// ═══════════════════════════════════════════════════════════════════

export const MANHOLE_PRESETS = {
  standard: {
    id: 'YB-Φ1000-2.5',
    diameter: 1000,
    depth: 2500,
    coverType: 'heavyCastIron' as const,
    concreteGrade: 'C30' as const,
    pipeConnections: [],
    hasSteps: true,
    stepSpacing: 300,
  },
  shallow: {
    id: 'YB-Φ700-1.5',
    diameter: 700,
    depth: 1500,
    coverType: 'lightCastIron' as const,
    concreteGrade: 'C25' as const,
    pipeConnections: [],
    hasSteps: false,
    stepSpacing: 300,
  },
  deep: {
    id: 'YB-Φ1500-5.0',
    diameter: 1500,
    depth: 5000,
    coverType: 'reinforcedConcrete' as const,
    concreteGrade: 'C35' as const,
    pipeConnections: [],
    hasSteps: true,
    stepSpacing: 300,
  },
  withPipe: {
    id: 'YB-Φ1000-3.0-P',
    diameter: 1000,
    depth: 3000,
    coverType: 'heavyCastIron' as const,
    concreteGrade: 'C30' as const,
    pipeConnections: [
      { diameter: 400, invertElevation: -1.5, angle: 0, type: 'inlet' as const },
      { diameter: 400, invertElevation: -1.52, angle: 180, type: 'outlet' as const },
    ],
    hasSteps: true,
    stepSpacing: 300,
  },
};
