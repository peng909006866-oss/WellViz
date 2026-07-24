'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { S, CONCRETE_MATERIAL } from '@/lib/constants';

export interface ConcreteCylinderProps {
  position: [number, number, number];
  /** 井内径 mm */
  innerDiameter: number;
  /** 壁厚 mm */
  wallThickness: number;
  /** 井深 mm */
  depth: number;
  /** 底板厚 mm */
  baseThickness: number;
  opacity?: number;
  color?: string;
}

/**
 * 圆形井筒体混凝土渲染
 *
 * 使用 CylinderGeometry(openEnded=true) 实现空心筒体
 * 内径 = innerDiameter / 2, 外径 = (innerDiameter + 2*wallThickness) / 2
 */
export function ConcreteCylinder({
  position,
  innerDiameter,
  wallThickness,
  depth,
  baseThickness,
  opacity = 0.15,
  color = CONCRETE_MATERIAL.color,
}: ConcreteCylinderProps) {
  const innerRadius = (innerDiameter * S) / 2;
  const outerRadius = ((innerDiameter + 2 * wallThickness) * S) / 2;
  const depthM = depth * S;
  const baseDepthM = baseThickness * S;

  // 筒体几何体 — 使用两个 Cylinder 制作空心效果
  // 外部: 实心圆柱 (outer)
  // 内部: 切割用（采用 CSG 思想，这里简化为两个叠加）
  // 实际使用: 外柱 + 内柱（背景色），视觉上制作空心效果
  const outerGeo = useMemo(
    () => new THREE.CylinderGeometry(outerRadius, outerRadius, depthM, 48, 1, true),
    [outerRadius, depthM],
  );

  const innerGeo = useMemo(
    () => new THREE.CylinderGeometry(innerRadius, innerRadius, depthM * 1.01, 48, 1, true),
    [innerRadius, depthM],
  );

  // 底板几何
  const baseGeo = useMemo(
    () => new THREE.CylinderGeometry(outerRadius, outerRadius, baseDepthM, 48),
    [outerRadius, baseDepthM],
  );

  // 筒体边缘线
  const barrelEdges = useMemo(() => {
    const segments = 48;
    const topPts: THREE.Vector3[] = [];
    const botPts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * outerRadius;
      const z = Math.sin(angle) * outerRadius;
      const halfH = depthM / 2;
      topPts.push(new THREE.Vector3(x, halfH, z));
      botPts.push(new THREE.Vector3(x, -halfH, z));
    }
    // 创建顶部和底部两个环
    const topGeo = new THREE.BufferGeometry().setFromPoints(topPts);
    const botGeo = new THREE.BufferGeometry().setFromPoints(botPts);
    return { topGeo, botGeo };
  }, [outerRadius, depthM]);

  return (
    <group position={position}>
      {/* 筒体外壁 */}
      <mesh>
        <primitive object={outerGeo} attach="geometry" />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={CONCRETE_MATERIAL.roughness}
        />
      </mesh>
      {/* 筒体内壁 */}
      <mesh>
        <primitive object={innerGeo} attach="geometry" />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity * 0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={CONCRETE_MATERIAL.roughness}
        />
      </mesh>

      {/* 底板 */}
      <mesh position={[0, -depthM / 2, 0]}>
        <primitive object={baseGeo} attach="geometry" />
        <meshPhysicalMaterial
          color="#A0AEC0"
          transparent
          opacity={opacity * 1.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.85}
        />
      </mesh>

      {/* 顶部边缘线 */}
      <lineSegments>
        <primitive object={barrelEdges.topGeo} attach="geometry" />
        <lineBasicMaterial color="#94A3B8" transparent opacity={0.6} />
      </lineSegments>
      {/* 底部边缘线 */}
      <lineSegments>
        <primitive object={barrelEdges.botGeo} attach="geometry" />
        <lineBasicMaterial color="#94A3B8" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

export interface PipeConnectionStubProps {
  position: [number, number, number];
  /** 管径 mm */
  pipeDiameter: number;
  /** 管壁显著长度 */
  length: number;
  /** 角度 (radians) */
  angle: number;
  color?: string;
}

/**
 * 管道接口 stub — 在圆筒体侧壁突出显示管道接口位置
 */
export function PipeConnectionStub({
  position,
  pipeDiameter,
  length,
  angle,
  color = '#1ABC9C',
}: PipeConnectionStubProps) {
  const radius = (pipeDiameter * S) / 2;
  const lenM = length * S;

  const stubGeo = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, lenM, 16),
    [radius, lenM],
  );

  return (
    <group
      position={position}
      rotation={[0, angle, 0]}
    >
      <mesh>
        <primitive object={stubGeo} attach="geometry" />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.4}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, lenM, 16)]} />
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}
