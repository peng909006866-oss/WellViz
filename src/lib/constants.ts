/**
 * WellViz 全局常量定义
 *
 * 基于 RebarViz constants.ts 改造
 * - 移除 22G101 构件相关颜色和施工步骤
 * - 新增井结构专用颜色和施工步骤
 */

// ═══════════════════════════════════════════════════════════════════
// 单位换算
// ═══════════════════════════════════════════════════════════════════

/** mm → m 单位换算 */
export const S = 0.001;

// ═══════════════════════════════════════════════════════════════════
// 井结构颜色
// ═══════════════════════════════════════════════════════════════════

/** 竖向钢筋 */
export const COLOR_VERT_BAR = '#C0392B';
export const COLOR_VERT_BAR_HI = '#E74C3C';

/** 环向钢筋 */
export const COLOR_HORIZ_BAR = '#2980B9';
export const COLOR_HORIZ_BAR_HI = '#3498DB';

/** 盖板/底板钢筋 */
export const COLOR_COVER_BAR = '#8E44AD';
export const COLOR_COVER_BAR_HI = '#9B59B6';

/** 踏步/爬梯 */
export const COLOR_STEPS = '#E67E22';
export const COLOR_STEPS_HI = '#F39C12';

/** 管道接口 */
export const COLOR_PIPE = '#1ABC9C';
export const COLOR_PIPE_HI = '#16A085';

/** 混凝土 — 井体 (灰调) */
export const COLOR_CONCRETE = '#9CA3AF';
export const COLOR_CONCRETE_HI = '#BDC3C7';

/** 盖板 */
export const COLOR_COVER = '#6B7280';
export const COLOR_COVER_HI = '#8E9196';

/** 井盖 (铸铁色) */
export const COLOR_MANHOLE_COVER = '#374151';
export const COLOR_MANHOLE_COVER_HI = '#4B5563';

/** 格栅盖 (雨水口) */
export const COLOR_GRATE = '#4A5568';
export const COLOR_GRATE_HI = '#718096';

/** 沉泥槽 */
export const COLOR_SUMP = '#7F8C8D';

/** 消力池 */
export const COLOR_STILLING = '#95A5A6';

/** 底板 */
export const COLOR_BASE = '#A0AEC0';

// 通用钢筋颜色 (legacy 兼容)
export const COLOR_REBAR = '#C0392B';
export const COLOR_REBAR_HI = '#E74C3C';
export const COLOR_TIEBAR = '#1ABC9C';
export const COLOR_TIEBAR_HI = '#16A085';

// ═══════════════════════════════════════════════════════════════════
// 材质参数
// ═══════════════════════════════════════════════════════════════════

export const REBAR_MATERIAL = {
  roughness: 0.4,
  metalness: 0.6,
};

export const CONCRETE_MATERIAL = {
  color: '#BDC3C7',
  roughness: 0.8,
};

export const COVER_MATERIAL = {
  color: '#6B7280',
  roughness: 0.7,
  metalness: 0.1,
};

export const IRON_MATERIAL = {
  color: '#374151',
  roughness: 0.5,
  metalness: 0.8,
};

// ═══════════════════════════════════════════════════════════════════
// 渲染参数
// ═══════════════════════════════════════════════════════════════════

/** 钢筋圆柱体段数 */
export const REBAR_SEGMENTS = 12;

/** 圆形环采样点数 */
export const RING_CURVE_SAMPLES = 160;

/** 弯钩采样点数 */
export const HOOK_CURVE_SAMPLES = 40;

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
