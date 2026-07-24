'use client';

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import type { RebarMeshInfo, RebarRenderMode } from '@/lib/types';
import { S, REBAR_MATERIAL, RING_CURVE_SAMPLES } from '@/lib/constants';

const MIN_HIT_RADIUS = 0.045;

export interface CircularRingProps {
  /** 中心位置 [x, y, z] */
  position: [number, number, number];
  /** 配筋中心半径 mm */
  radius: number;
  /** 钢筋直径 mm */
  diameter: number;
  /** 颜色 */
  color: string;
  /** 高亮色 */
  hiColor: string;
  /** 交互信息 */
  info: RebarMeshInfo;
  /** 是否被选中 */
  selected: boolean;
  /** 选中回调 */
  onSelect: (info: RebarMeshInfo | null) => void;
  /** 渲染模式 */
  renderMode?: RebarRenderMode;
}

/**
 * 圆形钢筋环组件
 *
 * 基于 RebarViz StirrupRing.tsx 改造
 * - 矩形箍筋环 → 圆形钢筋环
 * - 核心: TorusGeometry 替代 tubeGeometry 沿矩形路径
 * - 用于井壁环向配筋的可视化
 */
export function CircularRing({
  position,
  radius,
  diameter,
  color,
  hiColor,
  info,
  selected,
  onSelect,
  renderMode = 'solid',
}: CircularRingProps) {
  const [hovered, setHovered] = useState(false);

  const r = (diameter * S) / 2; // 钢筋半径 m
  const ringR = radius * S; // 配筋环半径 m
  const hitR = Math.max(r * 5, MIN_HIT_RADIUS);

  // TorusGeometry(majorRadius, minorRadius, radialSegments, tubularSegments)
  const torusGeo = useMemo(
    () => new THREE.TorusGeometry(ringR, r, 8, 48),
    [ringR, r],
  );

  const hitTorusGeo = useMemo(
    () => new THREE.TorusGeometry(ringR, hitR, 6, 36),
    [ringR, hitR],
  );

  // 中心线 (用于 centerline 渲染模式)
  const lineGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = RING_CURVE_SAMPLES;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * ringR,
        0,
        Math.sin(angle) * ringR,
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [ringR]);

  const activeColor = selected ? hiColor : hovered ? hiColor : color;
  const showSolid = renderMode === 'solid' || (renderMode === 'hybrid' && (selected || hovered));
  const showCenterline = renderMode === 'centerline' || !showSolid;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(selected ? null : info);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 实体环形筋 */}
      {showSolid && (
        <mesh>
          <primitive object={torusGeo} attach="geometry" />
          <meshStandardMaterial
            color={activeColor}
            roughness={REBAR_MATERIAL.roughness}
            metalness={REBAR_MATERIAL.metalness}
            emissive={selected ? hiColor : '#000000'}
            emissiveIntensity={selected ? 0.3 : 0}
          />
        </mesh>
      )}
      {/* 中心线 */}
      {showCenterline && (
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial color={activeColor} transparent opacity={selected ? 0.95 : 0.58} />
        </lineSegments>
      )}
      {/* 碰撞检测 */}
      <mesh>
        <primitive object={hitTorusGeo} attach="geometry" />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * 竖向钢筋组
 *
 * 沿圆心在筒体外周均匀分布
 * 每根竖向筋是从底板顶到井口顶的直杆
 */
export interface VerticalBarsProps {
  /** 组位置 */
  position: [number, number, number];
  /** 井内径 mm */
  innerDiameter: number;
  /** 壁厚 mm */
  wallThickness: number;
  /** 保护层 mm */
  cover: number;
  /** 井深 mm */
  depth: number;
  /** 钢筋直径 mm */
  barDiameter: number;
  /** 钢筋间距 mm */
  spacing: number;
  /** 颜色 */
  color: string;
  /** 高亮色 */
  hiColor: string;
  /** 渲染模式 */
  renderMode?: RebarRenderMode;
  /** 选中回调 (可选) */
  onSelectBar?: (index: number) => void;
  /** 选中索引 */
  selectedIndex?: number;
}

export function VerticalBars({
  position,
  innerDiameter,
  wallThickness,
  cover,
  depth,
  barDiameter,
  spacing,
  color,
  hiColor,
  renderMode = 'solid',
  onSelectBar,
  selectedIndex,
}: VerticalBarsProps) {
  // 计算竖筋位置
  const { barRadius, count, barLength, bars } = useMemo(() => {
    const centerRadius = (innerDiameter + wallThickness - cover * 2) / 2; // mm
    const barRadiusM = centerRadius * S;
    const outerCirc = Math.PI * (innerDiameter + 2 * wallThickness - 2 * cover) * S;
    const cnt = Math.max(Math.ceil((outerCirc * 1000) / spacing), 4);
    const len = depth * S;
    const barrelR = (barDiameter * S) / 2;

    const positions: { angle: number; x: number; z: number }[] = [];
    for (let i = 0; i < cnt; i++) {
      const angle = (i / cnt) * Math.PI * 2;
      positions.push({
        angle,
        x: Math.cos(angle) * barRadiusM,
        z: Math.sin(angle) * barRadiusM,
      });
    }

    return { barRadius: barrelR, count: cnt, barLength: len, bars: positions };
  }, [innerDiameter, wallThickness, cover, depth, barDiameter, spacing]);

  const showSolid = renderMode === 'solid' || renderMode === 'hybrid';

  const barGeo = useMemo(
    () => new THREE.CylinderGeometry(barRadius, barRadius, barLength, 8),
    [barRadius, barLength],
  );

  return (
    <group position={position}>
      {bars.map((bar, i) => (
        <group
          key={i}
          position={[bar.x, 0, bar.z]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectBar?.(i);
          }}
        >
          {showSolid && (
            <mesh>
              <primitive object={barGeo} attach="geometry" />
              <meshStandardMaterial
                color={selectedIndex === i ? hiColor : color}
                roughness={REBAR_MATERIAL.roughness}
                metalness={REBAR_MATERIAL.metalness}
                emissive={selectedIndex === i ? hiColor : '#000000'}
                emissiveIntensity={selectedIndex === i ? 0.3 : 0}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
