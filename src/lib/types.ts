/**
 * WellViz 类型定义
 *
 * 06MS201 市政排水结构 3D 可视化 + 02S515 排水检查井 + 04S516 管道基础
 * 6 种构件类型: 检查井 / 沉泥井 / 跌水井 / 雨水口 / 排水检查井 / 管道基础
 */

import type { CoverType, WellConcreteGrade, WellType, DrainageManholeShape, BeddingAngle } from './tables';

export type { CoverType, WellConcreteGrade, WellType, DrainageManholeShape, BeddingAngle };

// ═══════════════════════════════════════════════════════════════════
// 管道接口
// ═══════════════════════════════════════════════════════════════════

export interface PipeConnection {
  /** 管径 mm */
  diameter: number;
  /** 管内底标高 m (绝对或相对) */
  invertElevation: number;
  /** 角度 ° (0=正北, 顺时针) */
  angle: number;
  /** 管道类型 */
  type: 'inlet' | 'outlet';
}

// ═══════════════════════════════════════════════════════════════════
// 检查井参数 (06MS201)
// ═══════════════════════════════════════════════════════════════════

export interface ManholeParams {
  id: string;
  /** 井内径 mm (标准: 700, 800, 1000, 1200, 1500) */
  diameter: number;
  /** 井深 mm (从盖板顶到筒体底) */
  depth: number;
  /** 盖板类型 */
  coverType: CoverType;
  /** 混凝土等级 */
  concreteGrade: WellConcreteGrade;
  /** 管道接口列表 */
  pipeConnections: PipeConnection[];
  /** 是否设置爬梯/踏步 */
  hasSteps: boolean;
  /** 踏步间距 mm (默认 300) */
  stepSpacing: number;
}

// ═══════════════════════════════════════════════════════════════════
// 排水检查井参数 (02S515)
// ═══════════════════════════════════════════════════════════════════

export interface DrainageManholeParams {
  id: string;
  /** 管径 mm (DN300-DN1000) */
  pipeDiameter: number;
  /** 井深 mm (从盖板顶到井底) */
  depth: number;
  /** 井型 (圆形/矩形) */
  shape: DrainageManholeShape;
  /** 盖板类型 */
  coverType: CoverType;
  /** 混凝土等级 */
  concreteGrade: WellConcreteGrade;
  /** 管道接口列表 */
  pipeConnections: PipeConnection[];
  /** 是否设置爬梯/踏步 */
  hasSteps: boolean;
  /** 踏步间距 mm (默认 300) */
  stepSpacing: number;
}

// ═══════════════════════════════════════════════════════════════════
// 沉泥井参数
// ═══════════════════════════════════════════════════════════════════

export interface SedimentationParams {
  id: string;
  /** 井内径 mm */
  diameter: number;
  /** 井深 mm (不含沉泥槽) */
  depth: number;
  /** 盖板类型 */
  coverType: CoverType;
  /** 混凝土等级 */
  concreteGrade: WellConcreteGrade;
  /** 管道接口列表 */
  pipeConnections: PipeConnection[];
  /** 是否设置爬梯 */
  hasSteps: boolean;
  stepSpacing: number;
}

// ═══════════════════════════════════════════════════════════════════
// 跌水井参数
// ═══════════════════════════════════════════════════════════════════

export interface DropManholeParams {
  id: string;
  /** 井内径 mm */
  diameter: number;
  /** 井深 mm (从盖板顶到井底) */
  depth: number;
  /** 跌水高度 mm */
  dropHeight: number;
  /** 盖板类型 */
  coverType: CoverType;
  /** 混凝土等级 */
  concreteGrade: WellConcreteGrade;
  /** 进水管 */
  inletPipe?: PipeConnection;
  /** 出水管 */
  outletPipe?: PipeConnection;
  /** 是否设置爬梯 */
  hasSteps: boolean;
  stepSpacing: number;
}

// ═══════════════════════════════════════════════════════════════════
// 雨水口参数
// ═══════════════════════════════════════════════════════════════════

export interface GullyParams {
  id: string;
  /** 尺寸标识 e.g. "680×380", "750×450" */
  size: string;
  /** 格栅类型 */
  grateType: 'single' | 'double' | 'triple';
  /** 混凝土等级 */
  concreteGrade: WellConcreteGrade;
  /** 连接管径 mm */
  pipeDiameter: number;
}

// ═══════════════════════════════════════════════════════════════════
// 管道基础参数 (04S516)
// ═══════════════════════════════════════════════════════════════════

export interface PipeFoundationParams {
  id: string;
  /** 管道公称直径 mm (DN300-DN1500) */
  pipeDiameter: number;
  /** 管座包角 */
  beddingAngle: BeddingAngle;
  /** 管道长度 m */
  pipeLength: number;
  /** 混凝土等级 */
  concreteGrade: WellConcreteGrade;
}

// ═══════════════════════════════════════════════════════════════════
// 管道基础计算结果
// ═══════════════════════════════════════════════════════════════════

export interface PipeFoundationResult {
  /** 基础宽度 mm */
  baseWidth: number;
  /** 基础厚度 mm */
  baseThickness: number;
  /** 碎石垫层厚度 mm */
  gravelThickness: number;
  /** 混凝土总量 m³ */
  concreteVolumeM3: number;
  /** 模板总面积 m² */
  formAreaM2: number;
  /** 碎石垫层体积 m³ */
  gravelVolumeM3: number;
}

// ═══════════════════════════════════════════════════════════════════
// 联合类型
// ═══════════════════════════════════════════════════════════════════

export type WellParams = ManholeParams | DrainageManholeParams | SedimentationParams | DropManholeParams | GullyParams;

export type ComponentType = WellType;

// ═══════════════════════════════════════════════════════════════════
// 渲染模式
// ═══════════════════════════════════════════════════════════════════

export type RebarRenderMode = 'solid' | 'centerline' | 'hybrid';

// ═══════════════════════════════════════════════════════════════════
// 钢筋网格信息 (3D 交互)
// ═══════════════════════════════════════════════════════════════════

export interface RebarMeshInfo {
  type: 'concrete' | 'vertBar' | 'horizBar' | 'coverBar' | 'baseBar'
    | 'cover' | 'steps' | 'pipeConnection'
    | 'sump' | 'stillingBasin'
    | 'wallBar' | 'grate'
    | 'foundation' | 'gravel' | 'pipeSection';
  label: string;
  detail: string;
  setId?: string;
  instanceIndex?: number;
  groupLabel?: string;
  groupCount?: number;
  relatedSetIds?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// 计算结果类型
// ═══════════════════════════════════════════════════════════════════

export interface WellCalcItem {
  name: string;
  spec: string;
  grade: string;
  diameter: number;
  count: number;
  lengthM: number;
  weightKg: number;
  group?: string;
}

export interface WellCalcResult {
  items: WellCalcItem[];
  totalWeightKg: number;
  concreteVolumeM3: number;
  formAreaM2: number;
  wasteRate?: number;
  totalWithWaste?: number;
}

// ═══════════════════════════════════════════════════════════════════
// 施工步骤
// ═══════════════════════════════════════════════════════════════════

export interface ConstructionStep {
  groups: Set<string>;
  label: string;
}

/** 检查井施工步骤 */
export const MANHOLE_CONSTRUCTION_STEPS: ConstructionStep[] = [
  { groups: new Set(['concrete']), label: '模板+混凝土' },
  { groups: new Set(['concrete', 'baseBar']), label: '+底板配筋' },
  { groups: new Set(['concrete', 'baseBar', 'vertBar']), label: '+竖向筋' },
  { groups: new Set(['concrete', 'baseBar', 'vertBar', 'horizBar']), label: '+环向筋' },
  { groups: new Set(['concrete', 'baseBar', 'vertBar', 'horizBar', 'cover']), label: '+盖板+井盖' },
  { groups: new Set(['concrete', 'baseBar', 'vertBar', 'horizBar', 'cover', 'steps']), label: '+踏步' },
  { groups: new Set(['concrete', 'baseBar', 'vertBar', 'horizBar', 'cover', 'steps', 'pipeConnection']), label: '+管道接口' },
];
