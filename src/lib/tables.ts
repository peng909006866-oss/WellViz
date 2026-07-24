/**
 * 06MS201 市政排水管道工程及附属设施 — 标准图查表引擎
 *
 * 设计原则:
 * - 06MS201 是查表驱动的标准图集，没有 22G101 那样的公式推导
 * - 井径唯一确定壁厚和配筋规格
 * - 用户选择井型+井径，系统自动查表得到所有结构参数
 *
 * 数据来源: 06MS201-1/2/3/4 标准图集合订本
 * 注: 标准图表格数据量巨大(数十页)，当前录入常用井径 3-4 种
 */

// ═══════════════════════════════════════════════════════════════════
// 井类型枚举
// ═══════════════════════════════════════════════════════════════════

export type WellType = 'manhole' | 'sedimentation' | 'dropManhole' | 'gully' | 'drainageManhole';

export const WELL_TYPE_LABELS: Record<WellType, string> = {
  manhole: '圆形检查井',
  sedimentation: '沉泥井',
  dropManhole: '跌水井',
  gully: '雨水口',
  drainageManhole: '排水检查井',
};

export const WELL_TYPE_ROUTES: Record<WellType, string> = {
  manhole: '/manhole',
  sedimentation: '/sedimentation',
  dropManhole: '/drop-manhole',
  gully: '/gully',
  drainageManhole: '/drainage',
};

// ═══════════════════════════════════════════════════════════════════
// 盖板类型
// ═══════════════════════════════════════════════════════════════════

export type CoverType = 'lightCastIron' | 'heavyCastIron' | 'reinforcedConcrete';

export const COVER_TYPE_LABELS: Record<CoverType, string> = {
  lightCastIron: '轻型铸铁',
  heavyCastIron: '重型铸铁(道路)',
  reinforcedConcrete: '钢筋混凝土',
};

// ═══════════════════════════════════════════════════════════════════
// 混凝土等级
// ═══════════════════════════════════════════════════════════════════

export type WellConcreteGrade = 'C25' | 'C30' | 'C35';

// ═══════════════════════════════════════════════════════════════════
// 标准图数据行
// ═══════════════════════════════════════════════════════════════════

export interface WellTableRow {
  /** 井内径 mm */
  diameter: number;
  /** 壁厚 mm */
  wallThickness: number;
  /** 底板厚 mm */
  baseThickness: number;
  /** 盖板厚 mm (预制盖板) */
  coverThickness: number;
  /** 保护层 mm */
  cover: number;
  /** 竖向筋规格 e.g. "C14@200" */
  vertBar: string;
  /** 环向筋规格 e.g. "C12@200" */
  horizBar: string;
  /** 盖板配筋 e.g. "C12@150(double)" */
  coverBar: string;
  /** 底板配筋 e.g. "C12@200(double)" */
  baseBar: string;
  /** 每米井深混凝土量 m³ (筒体) */
  concretePerM: number;
  /** 每米井深模板面积 m² (内模+外模) */
  formAreaPerM: number;
  /** 每米井深钢筋量 kg (估算) */
  steelPerM: number;
  /** 适用井深范围 [min, max] m */
  applicableDepth: [number, number];
  /** 可用盖板类型 */
  coverTypes: CoverType[];
  /** 底板混凝土量 m³ */
  baseConcrete: number;
}

// ═══════════════════════════════════════════════════════════════════
// 沉泥井特殊参数
// ═══════════════════════════════════════════════════════════════════

export interface SedimentationExtra {
  /** 沉泥槽深度 mm */
  sumpDepth: number;
  /** 沉泥槽底部厚度 mm */
  sumpBaseThickness: number;
}

// ═══════════════════════════════════════════════════════════════════
// 跌水井特殊参数
// ═══════════════════════════════════════════════════════════════════

export interface DropManholeExtra {
  /** 最大跌水高度 mm */
  maxDropHeight: number;
  /** 消力池深度 mm */
  stillingBasinDepth: number;
  /** 消力池长度 mm */
  stillingBasinLength: number;
}

// ═══════════════════════════════════════════════════════════════════
// 雨水口特殊参数
// ═══════════════════════════════════════════════════════════════════

export interface GullyExtra {
  /** 井体长度 mm (双箅/多箅) */
  bodyLength: number;
  /** 井体宽度 mm */
  bodyWidth: number;
  /** 格栅类型 */
  grateType: 'single' | 'double' | 'triple';
}

// ═══════════════════════════════════════════════════════════════════
// 查表 — 圆形检查井 (06MS201-1)
// ═══════════════════════════════════════════════════════════════════

/**
 * 06MS201-1 圆形检查井标准数据表
 *
 * 使用说明:
 * - key 为井内径(mm)
 * - 所有配筋中 C=HRB400, A=HPB300
 * - concretePerM 仅计算筒体部分(不含底板和盖板)
 * - 数据基于标准图典型设计取用
 */
export const MANHOLE_TABLE: Record<number, WellTableRow> = {
  700: {
    diameter: 700,
    wallThickness: 200,
    baseThickness: 200,
    coverThickness: 120,
    cover: 35,
    vertBar: 'C12@200',
    horizBar: 'C10@200',
    coverBar: 'C10@150(single)',
    baseBar: 'C12@200(single)',
    concretePerM: 0.56,
    formAreaPerM: 6.91,    // π×(0.7+2×0.2)×1 + π×0.7×1 = π×1.1 + π×0.7 ≈ 3.46+2.20
    steelPerM: 18.5,
    applicableDepth: [1.0, 4.0],
    coverTypes: ['lightCastIron', 'heavyCastIron'],
    baseConcrete: 0.15,
  },
  800: {
    diameter: 800,
    wallThickness: 200,
    baseThickness: 200,
    coverThickness: 120,
    cover: 35,
    vertBar: 'C12@200',
    horizBar: 'C10@200',
    coverBar: 'C10@150(single)',
    baseBar: 'C12@200(single)',
    concretePerM: 0.63,
    formAreaPerM: 7.54,
    steelPerM: 21.0,
    applicableDepth: [1.0, 4.5],
    coverTypes: ['lightCastIron', 'heavyCastIron'],
    baseConcrete: 0.18,
  },
  1000: {
    diameter: 1000,
    wallThickness: 250,
    baseThickness: 250,
    coverThickness: 150,
    cover: 40,
    vertBar: 'C14@200',
    horizBar: 'C12@200',
    coverBar: 'C12@150(double)',
    baseBar: 'C12@200(double)',
    concretePerM: 0.98,
    formAreaPerM: 9.11,
    steelPerM: 32.0,
    applicableDepth: [1.0, 6.0],
    coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
    baseConcrete: 0.35,
  },
  1200: {
    diameter: 1200,
    wallThickness: 250,
    baseThickness: 250,
    coverThickness: 180,
    cover: 40,
    vertBar: 'C14@200',
    horizBar: 'C12@200',
    coverBar: 'C14@150(double)',
    baseBar: 'C14@200(double)',
    concretePerM: 1.14,
    formAreaPerM: 10.68,
    steelPerM: 38.5,
    applicableDepth: [1.5, 6.0],
    coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
    baseConcrete: 0.48,
  },
  1500: {
    diameter: 1500,
    wallThickness: 300,
    baseThickness: 300,
    coverThickness: 200,
    cover: 40,
    vertBar: 'C16@200',
    horizBar: 'C14@200',
    coverBar: 'C16@150(double)',
    baseBar: 'C16@200(double)',
    concretePerM: 1.70,
    formAreaPerM: 13.19,
    steelPerM: 52.0,
    applicableDepth: [1.5, 6.0],
    coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
    baseConcrete: 0.85,
  },
};

// ═══════════════════════════════════════════════════════════════════
// 查表 — 沉泥井 (06MS201-2)
// ═══════════════════════════════════════════════════════════════════

export const SEDIMENTATION_TABLE: Record<number, { row: WellTableRow; extra: SedimentationExtra }> = {
  1000: {
    row: {
      diameter: 1000,
      wallThickness: 250,
      baseThickness: 300,
      coverThickness: 150,
      cover: 40,
      vertBar: 'C14@200',
      horizBar: 'C12@200',
      coverBar: 'C12@150(double)',
      baseBar: 'C14@200(double)',
      concretePerM: 0.98,
      formAreaPerM: 9.11,
      steelPerM: 34.0,
      applicableDepth: [2.0, 6.0],
      coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
      baseConcrete: 0.40,
    },
    extra: { sumpDepth: 500, sumpBaseThickness: 300 },
  },
  1200: {
    row: {
      diameter: 1200,
      wallThickness: 250,
      baseThickness: 300,
      coverThickness: 180,
      cover: 40,
      vertBar: 'C14@200',
      horizBar: 'C12@200',
      coverBar: 'C14@150(double)',
      baseBar: 'C14@200(double)',
      concretePerM: 1.14,
      formAreaPerM: 10.68,
      steelPerM: 40.0,
      applicableDepth: [2.0, 6.0],
      coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
      baseConcrete: 0.55,
    },
    extra: { sumpDepth: 600, sumpBaseThickness: 300 },
  },
  1500: {
    row: {
      diameter: 1500,
      wallThickness: 300,
      baseThickness: 350,
      coverThickness: 200,
      cover: 40,
      vertBar: 'C16@200',
      horizBar: 'C14@200',
      coverBar: 'C16@150(double)',
      baseBar: 'C16@200(double)',
      concretePerM: 1.70,
      formAreaPerM: 13.19,
      steelPerM: 55.0,
      applicableDepth: [2.5, 6.0],
      coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
      baseConcrete: 1.0,
    },
    extra: { sumpDepth: 800, sumpBaseThickness: 350 },
  },
};

// ═══════════════════════════════════════════════════════════════════
// 查表 — 跌水井 (06MS201-3)
// ═══════════════════════════════════════════════════════════════════

export const DROP_MANHOLE_TABLE: Record<number, { row: WellTableRow; extra: DropManholeExtra }> = {
  1000: {
    row: {
      diameter: 1000,
      wallThickness: 300,
      baseThickness: 300,
      coverThickness: 150,
      cover: 40,
      vertBar: 'C16@200',
      horizBar: 'C14@150',
      coverBar: 'C14@150(double)',
      baseBar: 'C14@200(double)',
      concretePerM: 1.22,
      formAreaPerM: 9.42,
      steelPerM: 42.0,
      applicableDepth: [3.0, 8.0],
      coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
      baseConcrete: 0.55,
    },
    extra: { maxDropHeight: 2500, stillingBasinDepth: 500, stillingBasinLength: 1200 },
  },
  1200: {
    row: {
      diameter: 1200,
      wallThickness: 300,
      baseThickness: 350,
      coverThickness: 180,
      cover: 40,
      vertBar: 'C16@200',
      horizBar: 'C14@150',
      coverBar: 'C14@150(double)',
      baseBar: 'C14@200(double)',
      concretePerM: 1.41,
      formAreaPerM: 10.99,
      steelPerM: 50.0,
      applicableDepth: [3.0, 8.0],
      coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
      baseConcrete: 0.75,
    },
    extra: { maxDropHeight: 3500, stillingBasinDepth: 600, stillingBasinLength: 1500 },
  },
  1500: {
    row: {
      diameter: 1500,
      wallThickness: 350,
      baseThickness: 400,
      coverThickness: 200,
      cover: 40,
      vertBar: 'C18@200',
      horizBar: 'C16@150',
      coverBar: 'C16@150(double)',
      baseBar: 'C16@200(double)',
      concretePerM: 2.03,
      formAreaPerM: 13.82,
      steelPerM: 65.0,
      applicableDepth: [4.0, 8.0],
      coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
      baseConcrete: 1.2,
    },
    extra: { maxDropHeight: 5000, stillingBasinDepth: 800, stillingBasinLength: 2000 },
  },
};

// ═══════════════════════════════════════════════════════════════════
// 查表 — 雨水口 (06MS201-4)
// ═══════════════════════════════════════════════════════════════════

export interface GullyTableRow {
  /** 雨水口尺寸标识 */
  size: string;
  /** 井体长度 mm (沿路缘石方向) */
  bodyLength: number;
  /** 井体宽度 mm */
  bodyWidth: number;
  /** 井体深度 mm */
  bodyDepth: number;
  /** 壁厚 mm */
  wallThickness: number;
  /** 底板厚 mm */
  baseThickness: number;
  /** 保护层 mm */
  cover: number;
  /** 井壁配筋 */
  wallBar: string;
  /** 底板配筋 */
  baseBar: string;
  /** 连接管径范围 mm */
  pipeDiameter: [number, number];
  /** 每座混凝土量 m³ */
  concretePerUnit: number;
  /** 每座模板面积 m² */
  formAreaPerUnit: number;
  /** 每座钢筋量 kg */
  steelPerUnit: number;
  /** 可用格栅类型 */
  grateTypes: ('single' | 'double' | 'triple')[];
}

/**
 * 06MS201-4 雨水口标准数据表
 * 偏沟式单箅/双箅/多箅雨水口
 */
export const GULLY_TABLE: Record<string, GullyTableRow> = {
  '680×380': {
    size: '680×380',
    bodyLength: 680,
    bodyWidth: 380,
    bodyDepth: 1000,
    wallThickness: 120,
    baseThickness: 150,
    cover: 30,
    wallBar: 'C10@200',
    baseBar: 'C10@200(single)',
    pipeDiameter: [200, 400],
    concretePerUnit: 0.35,
    formAreaPerUnit: 3.2,
    steelPerUnit: 12.0,
    grateTypes: ['single'],
  },
  '750×450': {
    size: '750×450',
    bodyLength: 750,
    bodyWidth: 450,
    bodyDepth: 1200,
    wallThickness: 150,
    baseThickness: 150,
    cover: 30,
    wallBar: 'C12@200',
    baseBar: 'C12@200(single)',
    pipeDiameter: [200, 500],
    concretePerUnit: 0.50,
    formAreaPerUnit: 4.1,
    steelPerUnit: 18.0,
    grateTypes: ['double', 'triple'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 查表引擎 — 公共查询接口
// ═══════════════════════════════════════════════════════════════════

/**
 * 根据井内径查检查井表
 * 若精确匹配未找到，自动找最近井径并返回 warning
 */
export function lookupManhole(diameter: number): { row: WellTableRow; warning?: string } {
  if (MANHOLE_TABLE[diameter]) {
    return { row: MANHOLE_TABLE[diameter] };
  }
  // 找最近的标准井径
  const available = Object.keys(MANHOLE_TABLE).map(Number).sort((a, b) => a - b);
  if (available.length === 0) {
    throw new Error('检查井数据表为空');
  }
  const nearest = available.reduce((prev, curr) =>
    Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev
  );
  return {
    row: MANHOLE_TABLE[nearest],
    warning: `井径Φ${diameter} 非标准尺寸，已取最接近的标准井径Φ${nearest}进行查表`,
  };
}

/**
 * 根据井内径查沉泥井表
 */
export function lookupSedimentation(diameter: number): { row: WellTableRow; extra: SedimentationExtra; warning?: string } {
  if (SEDIMENTATION_TABLE[diameter]) {
    return SEDIMENTATION_TABLE[diameter];
  }
  const available = Object.keys(SEDIMENTATION_TABLE).map(Number).sort((a, b) => a - b);
  if (available.length === 0) {
    throw new Error('沉泥井数据表为空');
  }
  const nearest = available.reduce((prev, curr) =>
    Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev
  );
  return {
    ...SEDIMENTATION_TABLE[nearest],
    warning: `沉泥井径Φ${diameter} 非标准尺寸，已取最接近的标准井径Φ${nearest}进行查表`,
  };
}

/**
 * 根据井内径查跌水井表
 */
export function lookupDropManhole(diameter: number): { row: WellTableRow; extra: DropManholeExtra; warning?: string } {
  if (DROP_MANHOLE_TABLE[diameter]) {
    return DROP_MANHOLE_TABLE[diameter];
  }
  const available = Object.keys(DROP_MANHOLE_TABLE).map(Number).sort((a, b) => a - b);
  if (available.length === 0) {
    throw new Error('跌水井数据表为空');
  }
  const nearest = available.reduce((prev, curr) =>
    Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev
  );
  return {
    ...DROP_MANHOLE_TABLE[nearest],
    warning: `跌水井径Φ${diameter} 非标准尺寸，已取最接近的标准井径Φ${nearest}进行查表`,
  };
}

/**
 * 根据尺寸标识查雨水口表
 */
export function lookupGully(size: string): GullyTableRow | null {
  return GULLY_TABLE[size] || null;
}

/**
 * 获取某井型的可用井径列表
 */
export function getAvailableDiameters(wellType: WellType): number[] {
  switch (wellType) {
    case 'manhole':
      return Object.keys(MANHOLE_TABLE).map(Number).sort((a, b) => a - b);
    case 'sedimentation':
      return Object.keys(SEDIMENTATION_TABLE).map(Number).sort((a, b) => a - b);
    case 'dropManhole':
      return Object.keys(DROP_MANHOLE_TABLE).map(Number).sort((a, b) => a - b);
    case 'gully':
      return []; // 雨水口不按内径查表
    case 'drainageManhole':
      return Object.keys(DRAINAGE_MANHOLE_TABLE).map(Number).sort((a, b) => a - b);
    default:
      return [];
  }
}

/**
 * 获取雨水口可用尺寸标识列表
 */
export function getAvailableGullySizes(): string[] {
  return Object.keys(GULLY_TABLE);
}

/**
 * 解析钢筋标注得到直径和间距
 * 支持格式: "C14@200", "C12@150"
 */
export function parseRebarSpec(spec: string): { grade: string; diameter: number; spacing: number } {
  const m = spec.match(/([A-Za-z])(\d+)@(\d+)/);
  if (!m) return { grade: 'C', diameter: 12, spacing: 200 };
  return { grade: m[1].toUpperCase(), diameter: parseInt(m[2], 10), spacing: parseInt(m[3], 10) };
}

// ═══════════════════════════════════════════════════════════════════
// 02S515 排水检查井
// ═══════════════════════════════════════════════════════════════════

/** 排水检查井井型 */
export type DrainageManholeShape = 'circular' | 'rectangular';

export const DRAINAGE_SHAPE_LABELS: Record<DrainageManholeShape, string> = {
  circular: '圆形排水检查井',
  rectangular: '矩形排水检查井',
};

/** 流槽形式 */
export type ChannelType = 'halfPipe' | 'fullPipe' | 'flatBottom';

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  halfPipe: '半管流槽',
  fullPipe: '全管流槽',
  flatBottom: '平底流槽',
};

/**
 * 02S515 排水检查井标准数据行
 * 在 WellTableRow 基础上增加排水特有字段
 */
export interface DrainageManholeTableRow extends WellTableRow {
  /** 适用管径列表 mm */
  pipeDiameters: number[];
  /** 井型 */
  shape: DrainageManholeShape;
  /** 流槽形式 */
  channelType: ChannelType;
  /** 矩形井: 井室长度 mm (圆形井同 diameter) */
  chamberLength?: number;
  /** 矩形井: 井室宽度 mm */
  chamberWidth?: number;
}

/**
 * 02S515 排水检查井标准数据表
 *
 * 查表逻辑: 管径 + 井深 → 井室尺寸 → 壁厚 → 配筋 → 混凝土量
 * 数据来源: 02S515《排水检查井》国家标准图集
 *
 * key 为井径(mm)，每个井径对应多管径适用说明
 */
export const DRAINAGE_MANHOLE_TABLE: Record<number, DrainageManholeTableRow> = {
  // ── Φ1000 圆形排水检查井 — 适用管径 DN300-DN600 ──
  1000: {
    diameter: 1000,
    wallThickness: 240,
    baseThickness: 250,
    coverThickness: 150,
    cover: 35,
    vertBar: 'C14@200',
    horizBar: 'C12@200',
    coverBar: 'C12@150(double)',
    baseBar: 'C14@200(double)',
    concretePerM: 0.94,
    formAreaPerM: 9.05,
    steelPerM: 33.0,
    applicableDepth: [1.0, 5.0],
    coverTypes: ['lightCastIron', 'heavyCastIron'],
    baseConcrete: 0.38,
    pipeDiameters: [300, 400, 500, 600],
    shape: 'circular',
    channelType: 'halfPipe',
  },
  // ── Φ1200 圆形排水检查井 — 适用管径 DN600-DN800 ──
  1200: {
    diameter: 1200,
    wallThickness: 240,
    baseThickness: 250,
    coverThickness: 180,
    cover: 35,
    vertBar: 'C14@200',
    horizBar: 'C12@200',
    coverBar: 'C14@150(double)',
    baseBar: 'C14@200(double)',
    concretePerM: 1.09,
    formAreaPerM: 10.56,
    steelPerM: 39.0,
    applicableDepth: [1.5, 6.0],
    coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
    baseConcrete: 0.50,
    pipeDiameters: [600, 800],
    shape: 'circular',
    channelType: 'halfPipe',
  },
  // ── Φ1500 圆形排水检查井 — 适用管径 DN800-DN1000 ──
  1500: {
    diameter: 1500,
    wallThickness: 300,
    baseThickness: 300,
    coverThickness: 200,
    cover: 40,
    vertBar: 'C16@200',
    horizBar: 'C14@200',
    coverBar: 'C16@150(double)',
    baseBar: 'C16@200(double)',
    concretePerM: 1.70,
    formAreaPerM: 13.19,
    steelPerM: 54.0,
    applicableDepth: [2.0, 6.0],
    coverTypes: ['heavyCastIron', 'reinforcedConcrete'],
    baseConcrete: 0.85,
    pipeDiameters: [800, 1000],
    shape: 'circular',
    channelType: 'halfPipe',
  },
  // ── 矩形 1100×1100 排水检查井 — 适用管径 DN400-DN600 ──
  1100: {
    diameter: 1100,
    wallThickness: 240,
    baseThickness: 250,
    coverThickness: 150,
    cover: 35,
    vertBar: 'C14@200',
    horizBar: 'C12@200',
    coverBar: 'C12@150(double)',
    baseBar: 'C14@200(double)',
    concretePerM: 0.99,
    formAreaPerM: 9.50,
    steelPerM: 35.0,
    applicableDepth: [1.0, 5.0],
    coverTypes: ['lightCastIron', 'heavyCastIron'],
    baseConcrete: 0.42,
    pipeDiameters: [400, 500, 600],
    shape: 'rectangular',
    channelType: 'halfPipe',
    chamberLength: 1100,
    chamberWidth: 1100,
  },
};

/**
 * 管径→推荐井径映射表 (02S515 查表第一步)
 * 根据管道直径和井型确定最小井径
 */
export const PIPE_TO_WELL_DIAMETER: Record<number, { circular: number; rectangular: number }> = {
  300: { circular: 1000, rectangular: 1000 },
  400: { circular: 1000, rectangular: 1100 },
  500: { circular: 1000, rectangular: 1100 },
  600: { circular: 1000, rectangular: 1100 },
  800: { circular: 1200, rectangular: 1200 },
  1000: { circular: 1500, rectangular: 1500 },
};

// ═══════════════════════════════════════════════════════════════════
// 02S515 查表引擎
// ═══════════════════════════════════════════════════════════════════

/**
 * 根据管径 + 井深 + 井型 查排水检查井表
 * 自动根据管径确定井径，再查结构参数
 */
export function lookupDrainageManhole(
  pipeDia: number,
  depth: number,
  shape: DrainageManholeShape,
): { row: DrainageManholeTableRow; warning?: string } {
  const warnings: string[] = [];

  // 1. 管径→井径映射
  const mapping = PIPE_TO_WELL_DIAMETER[pipeDia];
  if (!mapping) {
    const available = Object.keys(PIPE_TO_WELL_DIAMETER).map(Number).sort((a, b) => a - b);
    if (available.length === 0) throw new Error('排水检查井管径映射表为空');
    const nearest = available.reduce((prev, curr) =>
      Math.abs(curr - pipeDia) < Math.abs(prev - pipeDia) ? curr : prev,
    );
    warnings.push(`管径DN${pipeDia} 非标准尺寸，已取最接近的标准管径DN${nearest}`);
    return lookupDrainageManhole(nearest, depth, shape);
  }

  const wellDia = mapping[shape];

  // 2. 井径→结构参数
  const row = DRAINAGE_MANHOLE_TABLE[wellDia];
  if (!row) {
    const availableDias = Object.keys(DRAINAGE_MANHOLE_TABLE).map(Number).sort((a, b) => a - b);
    const nearestDia = availableDias.reduce((prev, curr) =>
      Math.abs(curr - wellDia) < Math.abs(prev - wellDia) ? curr : prev,
    );
    warnings.push(`井径Φ${wellDia} 无对应数据，已取最接近的标准井径Φ${nearestDia}`);
    const fallback = DRAINAGE_MANHOLE_TABLE[nearestDia];
    return { row: fallback, warning: warnings.join('；') };
  }

  // 3. 井深范围校验
  const depthM = depth / 1000;
  if (depthM < row.applicableDepth[0] || depthM > row.applicableDepth[1]) {
    warnings.push(
      `井深${depthM.toFixed(1)}m 超出适用范围 ${row.applicableDepth[0]}-${row.applicableDepth[1]}m`,
    );
  }

  return { row, warning: warnings.length > 0 ? warnings.join('；') : undefined };
}

/**
 * 获取排水检查井可用的管径列表
 */
export function getAvailableDrainagePipeDiameters(): number[] {
  return Object.keys(PIPE_TO_WELL_DIAMETER).map(Number).sort((a, b) => a - b);
}

/**
 * 获取排水检查井可用的井型列表
 */
export function getAvailableDrainageShapes(): DrainageManholeShape[] {
  return ['circular', 'rectangular'];
}

/**
 * 每米钢筋重量 (kg/m)
 * 公式: W = 0.00617 × d²
 * d = 直径 mm, W = kg/m
 */
export function rebarWeightPerM(diameter: number): number {
  return 0.00617 * diameter * diameter;
}

// ═══════════════════════════════════════════════════════════════════
// 04S516 混凝土管道基础
// ═══════════════════════════════════════════════════════════════════

/** 管座包角类型 */
export type BeddingAngle = '90deg' | '120deg' | '180deg' | 'flat';

export const BEDDING_ANGLE_LABELS: Record<BeddingAngle, string> = {
  '90deg': '90° 管座',
  '120deg': '120° 管座',
  '180deg': '180° 管座',
  flat: '平基 (无管座)',
};

/**
 * 04S516 管道基础标准数据行
 * 按管径索引，每个管径对应多种包角
 */
export interface PipeFoundationRow {
  /** 管道公称直径 mm */
  pipeDiameter: number;
  /** 管座包角 */
  beddingAngle: BeddingAngle;
  /** 基础宽度 mm */
  baseWidth: number;
  /** 基础厚度 mm (C1) */
  baseThickness: number;
  /** 每米混凝土量 m³/m */
  concretePerM: number;
  /** 每米模板面积 m²/m (两侧) */
  formAreaPerM: number;
  /** 碎石垫层厚度 mm */
  gravelThickness: number;
}

/**
 * 04S516 混凝土管道基础标准数据表
 *
 * 查表逻辑: 管径 + 包角 → 基础宽度/厚度/混凝土量/模板面积
 * 管径范围: DN300 - DN1500
 * 包角类型: 90° / 120° / 180° 管座 + 平基
 *
 * 数据来源: 04S516《混凝土管道基础》国家标准图集
 */
export const PIPE_FOUNDATION_TABLE: Record<string, PipeFoundationRow> = {
  // ── DN300 ──
  '300-90deg':  { pipeDiameter: 300, beddingAngle: '90deg',  baseWidth: 880,  baseThickness: 150, concretePerM: 0.13, formAreaPerM: 0.30, gravelThickness: 100 },
  '300-120deg': { pipeDiameter: 300, beddingAngle: '120deg', baseWidth: 880,  baseThickness: 180, concretePerM: 0.15, formAreaPerM: 0.36, gravelThickness: 100 },
  '300-180deg': { pipeDiameter: 300, beddingAngle: '180deg', baseWidth: 880,  baseThickness: 250, concretePerM: 0.19, formAreaPerM: 0.50, gravelThickness: 100 },
  '300-flat':   { pipeDiameter: 300, beddingAngle: 'flat',   baseWidth: 880,  baseThickness: 100, concretePerM: 0.09, formAreaPerM: 0.20, gravelThickness: 100 },
  // ── DN400 ──
  '400-90deg':  { pipeDiameter: 400, beddingAngle: '90deg',  baseWidth: 980,  baseThickness: 150, concretePerM: 0.15, formAreaPerM: 0.30, gravelThickness: 100 },
  '400-120deg': { pipeDiameter: 400, beddingAngle: '120deg', baseWidth: 980,  baseThickness: 200, concretePerM: 0.19, formAreaPerM: 0.40, gravelThickness: 100 },
  '400-180deg': { pipeDiameter: 400, beddingAngle: '180deg', baseWidth: 980,  baseThickness: 280, concretePerM: 0.25, formAreaPerM: 0.56, gravelThickness: 100 },
  '400-flat':   { pipeDiameter: 400, beddingAngle: 'flat',   baseWidth: 980,  baseThickness: 100, concretePerM: 0.10, formAreaPerM: 0.20, gravelThickness: 100 },
  // ── DN500 ──
  '500-90deg':  { pipeDiameter: 500, beddingAngle: '90deg',  baseWidth: 1140, baseThickness: 180, concretePerM: 0.21, formAreaPerM: 0.36, gravelThickness: 100 },
  '500-120deg': { pipeDiameter: 500, beddingAngle: '120deg', baseWidth: 1140, baseThickness: 230, concretePerM: 0.25, formAreaPerM: 0.46, gravelThickness: 100 },
  '500-180deg': { pipeDiameter: 500, beddingAngle: '180deg', baseWidth: 1140, baseThickness: 330, concretePerM: 0.33, formAreaPerM: 0.66, gravelThickness: 100 },
  '500-flat':   { pipeDiameter: 500, beddingAngle: 'flat',   baseWidth: 1140, baseThickness: 120, concretePerM: 0.14, formAreaPerM: 0.24, gravelThickness: 100 },
  // ── DN600 ──
  '600-90deg':  { pipeDiameter: 600, beddingAngle: '90deg',  baseWidth: 1240, baseThickness: 200, concretePerM: 0.25, formAreaPerM: 0.40, gravelThickness: 100 },
  '600-120deg': { pipeDiameter: 600, beddingAngle: '120deg', baseWidth: 1240, baseThickness: 260, concretePerM: 0.32, formAreaPerM: 0.52, gravelThickness: 100 },
  '600-180deg': { pipeDiameter: 600, beddingAngle: '180deg', baseWidth: 1240, baseThickness: 380, concretePerM: 0.42, formAreaPerM: 0.76, gravelThickness: 100 },
  '600-flat':   { pipeDiameter: 600, beddingAngle: 'flat',   baseWidth: 1240, baseThickness: 120, concretePerM: 0.15, formAreaPerM: 0.24, gravelThickness: 100 },
  // ── DN800 ──
  '800-90deg':  { pipeDiameter: 800, beddingAngle: '90deg',  baseWidth: 1600, baseThickness: 250, concretePerM: 0.40, formAreaPerM: 0.50, gravelThickness: 150 },
  '800-120deg': { pipeDiameter: 800, beddingAngle: '120deg', baseWidth: 1600, baseThickness: 330, concretePerM: 0.52, formAreaPerM: 0.66, gravelThickness: 150 },
  '800-180deg': { pipeDiameter: 800, beddingAngle: '180deg', baseWidth: 1600, baseThickness: 470, concretePerM: 0.69, formAreaPerM: 0.94, gravelThickness: 150 },
  '800-flat':   { pipeDiameter: 800, beddingAngle: 'flat',   baseWidth: 1600, baseThickness: 150, concretePerM: 0.24, formAreaPerM: 0.30, gravelThickness: 150 },
  // ── DN1000 ──
  '1000-90deg':  { pipeDiameter: 1000, beddingAngle: '90deg',  baseWidth: 1900, baseThickness: 300, concretePerM: 0.57, formAreaPerM: 0.60, gravelThickness: 150 },
  '1000-120deg': { pipeDiameter: 1000, beddingAngle: '120deg', baseWidth: 1900, baseThickness: 400, concretePerM: 0.74, formAreaPerM: 0.80, gravelThickness: 150 },
  '1000-180deg': { pipeDiameter: 1000, beddingAngle: '180deg', baseWidth: 1900, baseThickness: 560, concretePerM: 0.98, formAreaPerM: 1.12, gravelThickness: 150 },
  '1000-flat':   { pipeDiameter: 1000, beddingAngle: 'flat',   baseWidth: 1900, baseThickness: 150, concretePerM: 0.29, formAreaPerM: 0.30, gravelThickness: 150 },
  // ── DN1200 ──
  '1200-90deg':  { pipeDiameter: 1200, beddingAngle: '90deg',  baseWidth: 2200, baseThickness: 350, concretePerM: 0.77, formAreaPerM: 0.70, gravelThickness: 200 },
  '1200-120deg': { pipeDiameter: 1200, beddingAngle: '120deg', baseWidth: 2200, baseThickness: 470, concretePerM: 1.01, formAreaPerM: 0.94, gravelThickness: 200 },
  '1200-180deg': { pipeDiameter: 1200, beddingAngle: '180deg', baseWidth: 2200, baseThickness: 670, concretePerM: 1.36, formAreaPerM: 1.34, gravelThickness: 200 },
  '1200-flat':   { pipeDiameter: 1200, beddingAngle: 'flat',   baseWidth: 2200, baseThickness: 200, concretePerM: 0.44, formAreaPerM: 0.40, gravelThickness: 200 },
  // ── DN1500 ──
  '1500-90deg':  { pipeDiameter: 1500, beddingAngle: '90deg',  baseWidth: 2660, baseThickness: 420, concretePerM: 1.12, formAreaPerM: 0.84, gravelThickness: 200 },
  '1500-120deg': { pipeDiameter: 1500, beddingAngle: '120deg', baseWidth: 2660, baseThickness: 560, concretePerM: 1.49, formAreaPerM: 1.12, gravelThickness: 200 },
  '1500-180deg': { pipeDiameter: 1500, beddingAngle: '180deg', baseWidth: 2660, baseThickness: 800, concretePerM: 2.02, formAreaPerM: 1.60, gravelThickness: 200 },
  '1500-flat':   { pipeDiameter: 1500, beddingAngle: 'flat',   baseWidth: 2660, baseThickness: 200, concretePerM: 0.53, formAreaPerM: 0.40, gravelThickness: 200 },
};

/** 可用的管径列表 */
export const PIPE_FOUNDATION_DIAMETERS = [300, 400, 500, 600, 800, 1000, 1200, 1500];

/** 所有包角选项 */
export const PIPE_FOUNDATION_ANGLES: BeddingAngle[] = ['90deg', '120deg', '180deg', 'flat'];

/**
 * 根据管径+包角查管道基础表
 */
export function lookupPipeFoundation(pipeDiameter: number, beddingAngle: BeddingAngle): PipeFoundationRow {
  const key = `${pipeDiameter}-${beddingAngle}`;
  if (PIPE_FOUNDATION_TABLE[key]) {
    return PIPE_FOUNDATION_TABLE[key];
  }
  // 找最近管径
  const nearest = PIPE_FOUNDATION_DIAMETERS.reduce((prev, curr) =>
    Math.abs(curr - pipeDiameter) < Math.abs(prev - pipeDiameter) ? curr : prev,
  );
  const fallbackKey = `${nearest}-${beddingAngle}`;
  if (PIPE_FOUNDATION_TABLE[fallbackKey]) {
    return PIPE_FOUNDATION_TABLE[fallbackKey];
  }
  throw new Error(`管道基础: 管径DN${pipeDiameter}+${beddingAngle} 无对应数据`);
}
