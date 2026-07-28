/**
 * WellViz 井结构计算引擎
 *
 * 计算逻辑:
 * 1. 根据井径查表 → 壁厚、配筋、每米混凝土量
 * 2. 环向筋: 环筋周长 = π×(井径+壁厚-2×保护层), 层数 = floor((井深-底板)/间距)+1
 * 3. 竖向筋: 长度 = 井深+弯钩-保护层, 数量 = ceil(π×筒体中径/间距)
 * 4. 混凝土量 = concretePerM×井深 + 底板 + 盖板
 * 5. 总重量 = Σ(各级钢筋长度×每米重量)
 *
 * 支持: 06MS201 (市政排水) + 02S515 (排水检查井) + 04S516 (管道基础)
 */

import type {
  ManholeParams,
  DrainageManholeParams,
  SedimentationParams,
  DropManholeParams,
  GullyParams,
  PipeFoundationParams,
  PipeFoundationResult,
  WellCalcItem,
  WellCalcResult,
} from './types';
import {
  lookupManhole,
  lookupDrainageManhole,
  lookupSedimentation,
  lookupDropManhole,
  lookupGully,
  lookupPipeFoundation,
  parseRebarSpec,
  rebarWeightPerM,
  type WellTableRow,
  type DrainageManholeTableRow,
  type GullyTableRow,
  type SedimentationExtra,
  type DropManholeExtra,
  COVER_TYPE_LABELS,
} from './tables';

// ═══════════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════════

/** 将 mm 转为 m */
const M = 0.001;

/** 计算环形周长 (m) — 在配筋中心线半径上计算 */
function ringCircumference(innerDia: number, wallThickness: number, cover: number): number {
  const centerRadius = (innerDia + wallThickness - cover * 2) / 2; // mm
  return Math.PI * 2 * centerRadius * M; // m
}

function ringCenterRadius(innerDia: number, wallThickness: number, cover: number): number {
  return (innerDia + wallThickness - cover * 2) / 2; // mm
}

// ═══════════════════════════════════════════════════════════════════
// 通用井钢筋计算
// ═══════════════════════════════════════════════════════════════════

interface CalcWellRebarInput {
  diameter: number;
  depth: number;
  wallThickness: number;
  baseThickness: number;
  cover: number;
  vertBar: string;
  horizBar: string;
  coverBar: string;
  baseBar: string;
  concreteGrade: string;
}

function calcWellRebarCore(input: CalcWellRebarInput): WellCalcItem[] {
  const { diameter, depth, wallThickness, baseThickness, cover, vertBar, horizBar, coverBar, baseBar } = input;
  const items: WellCalcItem[] = [];

  const depthM = depth * M;
  const barrelDepth = depth - baseThickness; // 筒体有效深度
  const barrelDepthM = barrelDepth * M;
  const circ = ringCircumference(diameter, wallThickness, cover);
  const centerR = ringCenterRadius(diameter, wallThickness, cover);

  // ── 环向筋 (水平分布筋) ──
  const horizR = parseRebarSpec(horizBar);
  const horizRings = Math.floor(barrelDepth / horizR.spacing) + 1;
  const horizSingleLen = circ; // 每圈长度 m
  const horizTotalLen = horizSingleLen * horizRings;
  const horizWeight = horizTotalLen * rebarWeightPerM(horizR.diameter);

  items.push({
    name: '环向筋',
    spec: horizBar,
    grade: horizR.grade,
    diameter: horizR.diameter,
    count: horizRings,
    lengthM: horizSingleLen,
    weightKg: parseFloat(horizWeight.toFixed(2)),
    group: 'horizBar',
  });

  // ── 竖向筋 ──
  const vertR = parseRebarSpec(vertBar);
  const barrelOuterCirc = Math.PI * (diameter + 2 * wallThickness) * M; // 外壁周长
  const vertCount = Math.ceil((barrelOuterCirc * 1000) / vertR.spacing); // 每圈根数
  // 竖筋长度 = 井深 + 顶部弯钩(10d)
  const vertHookLen = 10 * vertR.diameter * M;
  const vertSingleLen = depthM + vertHookLen;
  const vertTotalLen = vertSingleLen * vertCount;
  const vertWeight = vertTotalLen * rebarWeightPerM(vertR.diameter);

  items.push({
    name: '竖向筋',
    spec: vertBar,
    grade: vertR.grade,
    diameter: vertR.diameter,
    count: vertCount,
    lengthM: parseFloat(vertSingleLen.toFixed(3)),
    weightKg: parseFloat(vertWeight.toFixed(2)),
    group: 'vertBar',
  });

  // ── 盖板配筋 ──
  const coverR = parseRebarSpec(coverBar);
  const coverIsDouble = coverBar.includes('(double)') || coverBar.includes('双层');
  const coverOuterDia = diameter + 2 * wallThickness;
  const coverRebarCount = Math.ceil((coverOuterDia * M * Math.PI * 1000) / coverR.spacing);
  const coverSingleLen = coverOuterDia * M; // m (每根跨越井口直径)
  const coverLayers = coverIsDouble ? 2 : 1;
  const coverWeight = coverSingleLen * coverRebarCount * rebarWeightPerM(coverR.diameter) * coverLayers;

  items.push({
    name: '盖板筋',
    spec: coverBar,
    grade: coverR.grade,
    diameter: coverR.diameter,
    count: coverRebarCount * coverLayers,
    lengthM: parseFloat(coverSingleLen.toFixed(3)),
    weightKg: parseFloat(coverWeight.toFixed(2)),
    group: 'coverBar',
  });

  // ── 底板配筋 ──
  const baseR = parseRebarSpec(baseBar);
  const baseIsDouble = baseBar.includes('(double)') || baseBar.includes('双层');
  const baseOuterDia = diameter + 2 * wallThickness;
  const baseRebarCount = Math.ceil((baseOuterDia * M * Math.PI * 1000) / baseR.spacing);
  const baseSingleLen = baseOuterDia * M;
  const baseLayers = baseIsDouble ? 2 : 1;
  const baseWeight = baseSingleLen * baseRebarCount * rebarWeightPerM(baseR.diameter) * baseLayers;

  items.push({
    name: '底板筋',
    spec: baseBar,
    grade: baseR.grade,
    diameter: baseR.diameter,
    count: baseRebarCount * baseLayers,
    lengthM: parseFloat(baseSingleLen.toFixed(3)),
    weightKg: parseFloat(baseWeight.toFixed(2)),
    group: 'baseBar',
  });

  return items;
}

// ═══════════════════════════════════════════════════════════════════
// 通用混凝土与模板计算
// ═══════════════════════════════════════════════════════════════════

interface CalcWellConcreteInput {
  concretePerM: number;
  depth: number;
  baseConcrete: number;
  coverThickness: number;
  diameter: number;
  wallThickness: number;
}

function calcConcreteVol(input: CalcWellConcreteInput): { volume: number; formArea: number } {
  const { concretePerM, depth, baseConcrete, coverThickness, diameter, wallThickness } = input;
  const depthM = depth * M;

  // 筒体混凝土
  const barrelVol = concretePerM * depthM;

  // 盖板混凝土
  const coverOuterDia = (diameter + 2 * wallThickness + 200) * M; // 盖板比井外径大200mm
  const coverArea = Math.PI * (coverOuterDia / 2) ** 2;
  const coverVol = coverArea * coverThickness * M;

  // 底板混凝土 (查表提供)
  const baseVol = baseConcrete;

  const volume = barrelVol + baseVol + coverVol;

  // 模板面积: 内模 + 外模
  const innerForm = Math.PI * diameter * M * depthM;
  const outerForm = Math.PI * (diameter + 2 * wallThickness) * M * depthM;
  const formArea = innerForm + outerForm;

  return { volume: parseFloat(volume.toFixed(3)), formArea: parseFloat(formArea.toFixed(2)) };
}

// ═══════════════════════════════════════════════════════════════════
// 公共计算入口
// ═══════════════════════════════════════════════════════════════════

export function calcManhole(params: ManholeParams): WellCalcResult {
  const { row, warning } = lookupManhole(params.diameter);

  const items = calcWellRebarCore({
    diameter: row.diameter,
    depth: params.depth,
    wallThickness: row.wallThickness,
    baseThickness: row.baseThickness,
    cover: row.cover,
    vertBar: row.vertBar,
    horizBar: row.horizBar,
    coverBar: row.coverBar,
    baseBar: row.baseBar,
    concreteGrade: params.concreteGrade,
  });

  const { volume, formArea } = calcConcreteVol({
    concretePerM: row.concretePerM,
    depth: params.depth,
    baseConcrete: row.baseConcrete,
    coverThickness: row.coverThickness,
    diameter: row.diameter,
    wallThickness: row.wallThickness,
  });

  const totalWeight = items.reduce((sum, it) => sum + it.weightKg, 0);

  return {
    items,
    totalWeightKg: parseFloat(totalWeight.toFixed(2)),
    concreteVolumeM3: volume,
    formAreaM2: formArea,
    wasteRate: 0.03,
    totalWithWaste: parseFloat((totalWeight * 1.03).toFixed(2)),
  };
}

/** 02S515 排水检查井计算 */
export function calcDrainageManhole(params: DrainageManholeParams): WellCalcResult {
  const { row } = lookupDrainageManhole(params.pipeDiameter, params.depth, params.shape);

  const items = calcWellRebarCore({
    diameter: row.diameter,
    depth: params.depth,
    wallThickness: row.wallThickness,
    baseThickness: row.baseThickness,
    cover: row.cover,
    vertBar: row.vertBar,
    horizBar: row.horizBar,
    coverBar: row.coverBar,
    baseBar: row.baseBar,
    concreteGrade: params.concreteGrade,
  });

  const { volume, formArea } = calcConcreteVol({
    concretePerM: row.concretePerM,
    depth: params.depth,
    baseConcrete: row.baseConcrete,
    coverThickness: row.coverThickness,
    diameter: row.diameter,
    wallThickness: row.wallThickness,
  });

  const totalWeight = items.reduce((sum, it) => sum + it.weightKg, 0);

  return {
    items,
    totalWeightKg: parseFloat(totalWeight.toFixed(2)),
    concreteVolumeM3: volume,
    formAreaM2: formArea,
    wasteRate: 0.03,
    totalWithWaste: parseFloat((totalWeight * 1.03).toFixed(2)),
  };
}

export function calcSedimentation(params: SedimentationParams): WellCalcResult {
  const { row, extra } = lookupSedimentation(params.diameter);

  const items = calcWellRebarCore({
    diameter: row.diameter,
    depth: params.depth + extra.sumpDepth,
    wallThickness: row.wallThickness,
    baseThickness: row.baseThickness,
    cover: row.cover,
    vertBar: row.vertBar,
    horizBar: row.horizBar,
    coverBar: row.coverBar,
    baseBar: row.baseBar,
    concreteGrade: params.concreteGrade,
  });

  // 沉泥井额外：沉泥槽体积
  const sumpVol = Math.PI * ((row.diameter + 2 * row.wallThickness) * M / 2) ** 2 * extra.sumpDepth * M * 1.1; // 增加10%贴边

  const { volume, formArea } = calcConcreteVol({
    concretePerM: row.concretePerM,
    depth: params.depth + extra.sumpDepth,
    baseConcrete: row.baseConcrete,
    coverThickness: row.coverThickness,
    diameter: row.diameter,
    wallThickness: row.wallThickness,
  });

  const totalVolume = volume + parseFloat(sumpVol.toFixed(3));
  const totalWeight = items.reduce((sum, it) => sum + it.weightKg, 0);

  return {
    items,
    totalWeightKg: parseFloat(totalWeight.toFixed(2)),
    concreteVolumeM3: parseFloat(totalVolume.toFixed(3)),
    formAreaM2: formArea,
    wasteRate: 0.03,
    totalWithWaste: parseFloat((totalWeight * 1.03).toFixed(2)),
  };
}

export function calcDropManhole(params: DropManholeParams): WellCalcResult {
  const { row, extra } = lookupDropManhole(params.diameter);

  const items = calcWellRebarCore({
    diameter: row.diameter,
    depth: params.depth,
    wallThickness: row.wallThickness,
    baseThickness: row.baseThickness,
    cover: row.cover,
    vertBar: row.vertBar,
    horizBar: row.horizBar,
    coverBar: row.coverBar,
    baseBar: row.baseBar,
    concreteGrade: params.concreteGrade,
  });

  // 消力池附加混凝土
  const basinVol = extra.stillingBasinLength * M * extra.stillingBasinDepth * M * row.wallThickness * M * 2;

  const { volume, formArea } = calcConcreteVol({
    concretePerM: row.concretePerM,
    depth: params.depth,
    baseConcrete: row.baseConcrete,
    coverThickness: row.coverThickness,
    diameter: row.diameter,
    wallThickness: row.wallThickness,
  });

  const totalVolume = parseFloat((volume + basinVol).toFixed(3));
  const totalWeight = items.reduce((sum, it) => sum + it.weightKg, 0);

  return {
    items,
    totalWeightKg: parseFloat(totalWeight.toFixed(2)),
    concreteVolumeM3: totalVolume,
    formAreaM2: formArea,
    wasteRate: 0.03,
    totalWithWaste: parseFloat((totalWeight * 1.03).toFixed(2)),
  };
}

export function calcGully(params: GullyParams): WellCalcResult {
  const row = lookupGully(params.size);
  if (!row) {
    throw new Error(`雨水口尺寸 ${params.size} 不在标准图集中`);
  }

  const items: WellCalcItem[] = [];

  // 井壁筋 — 简化为沿四周分布
  const wallR = parseRebarSpec(row.wallBar);
  const wallPerimeter = 2 * (row.bodyLength + row.bodyWidth) * M;
  const wallCount = Math.ceil((wallPerimeter * 1000) / wallR.spacing);
  const wallSingleLen = row.bodyDepth * M;
  const wallWeight = wallCount * wallSingleLen * rebarWeightPerM(wallR.diameter);

  items.push({
    name: '井壁筋',
    spec: row.wallBar,
    grade: wallR.grade,
    diameter: wallR.diameter,
    count: wallCount,
    lengthM: parseFloat(wallSingleLen.toFixed(3)),
    weightKg: parseFloat(wallWeight.toFixed(2)),
    group: 'wallBar',
  });

  // 底板筋
  const baseR = parseRebarSpec(row.baseBar);
  const baseCount = Math.ceil((row.bodyWidth * M * 1000) / baseR.spacing);
  const baseSingleLen = row.bodyLength * M;
  const baseWeight = baseCount * baseSingleLen * rebarWeightPerM(baseR.diameter);

  items.push({
    name: '底板筋',
    spec: row.baseBar,
    grade: baseR.grade,
    diameter: baseR.diameter,
    count: baseCount,
    lengthM: parseFloat(baseSingleLen.toFixed(3)),
    weightKg: parseFloat(baseWeight.toFixed(2)),
    group: 'baseBar',
  });

  const totalWeight = items.reduce((sum, it) => sum + it.weightKg, 0);

  return {
    items,
    totalWeightKg: parseFloat(totalWeight.toFixed(2)),
    concreteVolumeM3: row.concretePerUnit,
    formAreaM2: row.formAreaPerUnit,
    wasteRate: 0.03,
    totalWithWaste: parseFloat((totalWeight * 1.03).toFixed(2)),
  };
}

// ═══════════════════════════════════════════════════════════════════
// 04S516 管道基础计算
// ═══════════════════════════════════════════════════════════════════

/**
 * 计算管道基础混凝土量、模板面积和碎石垫层
 *
 * 计算逻辑:
 * 1. 根据管径+包角查表 → 基础宽度/厚度/每米混凝土量
 * 2. 总混凝土量 = concretePerM × 管道长度
 * 3. 模板面积 = formAreaPerM × 管道长度 (两侧)
 * 4. 碎石垫层体积 = baseWidth × gravelThickness × 管道长度
 */
export function calcPipeFoundation(params: PipeFoundationParams): PipeFoundationResult {
  const row = lookupPipeFoundation(params.pipeDiameter, params.beddingAngle);

  const baseWidthM = row.baseWidth * M;
  const baseThicknessM = row.baseThickness * M;
  const gravelThicknessM = row.gravelThickness * M;

  // 总混凝土量
  const concreteVolumeM3 = parseFloat((row.concretePerM * params.pipeLength).toFixed(3));

  // 模板面积 (两侧)
  const formAreaM2 = parseFloat((row.formAreaPerM * params.pipeLength).toFixed(2));

  // 碎石垫层体积: 宽度 × 厚度 × 长度
  const gravelVolumeM3 = parseFloat((baseWidthM * gravelThicknessM * params.pipeLength).toFixed(3));

  return {
    baseWidth: row.baseWidth,
    baseThickness: row.baseThickness,
    gravelThickness: row.gravelThickness,
    concreteVolumeM3,
    formAreaM2,
    gravelVolumeM3,
  };
}

/**
 * 获取查表结果中的壁厚等信息，用于 3D 渲染
 */
export function getWellDimensions(params: { wellType: string; diameter?: number; size?: string; pipeDiameter?: number; depth?: number; shape?: string }): {
  diameter: number;
  wallThickness: number;
  baseThickness: number;
  coverThickness: number;
  cover: number;
  vertBar: string;
  horizBar: string;
  coverBar: string;
  baseBar: string;
} | null {
  switch (params.wellType) {
    case 'manhole': {
      if (!params.diameter) return null;
      const { row } = lookupManhole(params.diameter);
      return {
        diameter: row.diameter,
        wallThickness: row.wallThickness,
        baseThickness: row.baseThickness,
        coverThickness: row.coverThickness,
        cover: row.cover,
        vertBar: row.vertBar,
        horizBar: row.horizBar,
        coverBar: row.coverBar,
        baseBar: row.baseBar,
      };
    }
    case 'drainageManhole': {
      if (!params.pipeDiameter || !params.depth || !params.shape) return null;
      const { row } = lookupDrainageManhole(
        params.pipeDiameter,
        params.depth,
        params.shape as 'circular' | 'rectangular',
      );
      return {
        diameter: row.diameter,
        wallThickness: row.wallThickness,
        baseThickness: row.baseThickness,
        coverThickness: row.coverThickness,
        cover: row.cover,
        vertBar: row.vertBar,
        horizBar: row.horizBar,
        coverBar: row.coverBar,
        baseBar: row.baseBar,
      };
    }
    case 'sedimentation': {
      if (!params.diameter) return null;
      const { row } = lookupSedimentation(params.diameter);
      return {
        diameter: row.diameter,
        wallThickness: row.wallThickness,
        baseThickness: row.baseThickness,
        coverThickness: row.coverThickness,
        cover: row.cover,
        vertBar: row.vertBar,
        horizBar: row.horizBar,
        coverBar: row.coverBar,
        baseBar: row.baseBar,
      };
    }
    case 'dropManhole': {
      if (!params.diameter) return null;
      const { row } = lookupDropManhole(params.diameter);
      return {
        diameter: row.diameter,
        wallThickness: row.wallThickness,
        baseThickness: row.baseThickness,
        coverThickness: row.coverThickness,
        cover: row.cover,
        vertBar: row.vertBar,
        horizBar: row.horizBar,
        coverBar: row.coverBar,
        baseBar: row.baseBar,
      };
    }
    case 'gully': {
      if (!params.size) return null;
      const row = lookupGully(params.size);
      if (!row) return null;
      return {
        diameter: row.bodyLength,
        wallThickness: row.wallThickness,
        baseThickness: row.baseThickness,
        coverThickness: 0,
        cover: row.cover,
        vertBar: row.wallBar,
        horizBar: row.wallBar,
        coverBar: '',
        baseBar: row.baseBar,
      };
    }
    default:
      return null;
  }
}
