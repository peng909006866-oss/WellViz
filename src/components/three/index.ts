/**
 * Three.js 3D 组件统一导出 — WellViz
 *
 * 基于 RebarViz components/three/index.ts 改造
 * - 新增: ConcreteCylinder, CircularRing, WellCover
 * - 保留(复用): RebarBar, BentRebarEnd, TieBar, DimLine
 * - 废弃: ConcreteBox, StirrupRing (矩形构件不再需要)
 */

export { RebarBar, SlopedRebarBar } from './RebarBar';
export type { RebarBarProps, SlopedRebarBarProps } from './RebarBar';

export { BentRebarEnd } from './BentRebarEnd';
export type { BentRebarEndProps } from './BentRebarEnd';

export { TieBarMesh } from './TieBar';
export type { TieBarMeshProps } from './TieBar';

export { DimLine, VDimLine, DenseZoneMark } from './DimLine';
export type { DimLineProps, VDimLineProps, DenseZoneMarkProps } from './DimLine';

export { ConcreteCylinder, PipeConnectionStub } from './ConcreteCylinder';
export type { ConcreteCylinderProps, PipeConnectionStubProps } from './ConcreteCylinder';

export { CircularRing, VerticalBars } from './CircularRing';
export type { CircularRingProps, VerticalBarsProps } from './CircularRing';

export { WellCover } from './WellCover';
export type { WellCoverProps } from './WellCover';
