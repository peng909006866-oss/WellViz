'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { S, COVER_MATERIAL, IRON_MATERIAL } from '@/lib/constants';
import type { CoverType } from '@/lib/tables';

export interface WellCoverProps {
  position: [number, number, number];
  /** 井内径 mm */
  innerDiameter: number;
  /** 壁厚 mm */
  wallThickness: number;
  /** 盖板厚度 mm */
  coverThickness: number;
  /** 盖板类型 */
  coverType: CoverType;
}

/**
 * 盖板 + 井盖 3D 渲染
 *
 * 盖板: 圆形平板 (比井外径大一圈)
 * 井盖: 中心凸起 (铸铁/钢筋混凝土)
 */
export function WellCover({
  position,
  innerDiameter,
  wallThickness,
  coverThickness,
  coverType,
}: WellCoverProps) {
  const outerRadius = ((innerDiameter + 2 * wallThickness + 200) * S) / 2; // 比井外径大 200mm
  const coverThicknessM = coverThickness * S;
  const innerRadius = (innerDiameter * S) / 2;

  // 盖板 (圆形平板)
  const coverGeo = useMemo(
    () => new THREE.CylinderGeometry(outerRadius, outerRadius, coverThicknessM, 48),
    [outerRadius, coverThicknessM],
  );

  // 井口环 (座圈)
  const seatRingOuter = ((innerDiameter + 100) * S) / 2;
  const seatRingInner = (innerDiameter * S) / 2;
  const seatH = 0.03; // 30mm 座圈高度

  const seatGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * seatRingOuter;
      const z = Math.sin(angle) * seatRingOuter;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    }
    // Inner hole
    const hole = new THREE.Path();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * seatRingInner;
      const z = Math.sin(angle) * seatRingInner;
      if (i === 0) hole.moveTo(x, z);
      else hole.lineTo(x, z);
    }
    shape.holes.push(hole);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = { steps: 1, depth: seatH, bevelEnabled: false };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [seatRingOuter, seatRingInner, seatH]);

  // 井盖 (中心圆盘，铸铁/混凝土)
  const lidGeo = useMemo(
    () => new THREE.CylinderGeometry(innerRadius * 1.1, innerRadius * 1.1, 0.02, 48),
    [innerRadius],
  );

  const isIron = coverType === 'lightCastIron' || coverType === 'heavyCastIron';
  const lidColor = isIron ? IRON_MATERIAL.color : COVER_MATERIAL.color;
  const lidRoughness = isIron ? IRON_MATERIAL.roughness : COVER_MATERIAL.roughness;
  const lidMetalness = isIron ? IRON_MATERIAL.metalness : COVER_MATERIAL.metalness;

  // 边缘线
  const edgeGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * outerRadius,
        0,
        Math.sin(angle) * outerRadius,
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [outerRadius]);

  const totalHeight = coverThicknessM + seatH + 0.01;

  return (
    <group position={position}>
      {/* 盖板 */}
      <mesh position={[0, 0, 0]}>
        <primitive object={coverGeo} attach="geometry" />
        <meshPhysicalMaterial
          color={COVER_MATERIAL.color}
          transparent
          opacity={0.25}
          roughness={COVER_MATERIAL.roughness}
          metalness={COVER_MATERIAL.metalness}
          depthWrite={false}
        />
      </mesh>
      {/* 盖板边缘线 */}
      <lineSegments position={[0, coverThicknessM / 2 + 0.001, 0]}>
        <primitive object={edgeGeo} attach="geometry" />
        <lineBasicMaterial color="#6B7280" transparent opacity={0.4} />
      </lineSegments>

      {/* 座圈 */}
      <group position={[0, coverThicknessM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <primitive object={seatGeo} attach="geometry" />
          <meshStandardMaterial
            color="#9CA3AF"
            roughness={0.6}
            metalness={0.3}
          />
        </mesh>
      </group>

      {/* 井盖 */}
      <mesh position={[0, coverThicknessM + seatH + 0.01, 0]}>
        <primitive object={lidGeo} attach="geometry" />
        <meshStandardMaterial
          color={lidColor}
          roughness={lidRoughness}
          metalness={lidMetalness}
        />
      </mesh>
    </group>
  );
}
