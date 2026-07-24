'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { S, CONCRETE_MATERIAL, REBAR_MATERIAL, COLOR_HORIZ_BAR, COLOR_VERT_BAR, COLOR_PIPE, COLOR_GRATE } from '@/lib/constants';

interface GullyViewerProps {
  bodyLength: number;
  bodyWidth: number;
  bodyDepth: number;
  wallThickness: number;
  grateType: 'single' | 'double' | 'triple';
  pipeDiameter: number;
}

/**
 * 雨水口 3D 视图
 *
 * 矩形箱体结构:
 * - 外部混凝土箱体 (BoxGeometry, 带壁厚)
 * - 内部空心 (inner BoxGeometry)
 * - 格栅盖板 (顶部)
 * - 侧壁管道接口
 */
export default function GullyViewer({
  bodyLength,
  bodyWidth,
  bodyDepth,
  wallThickness,
  grateType,
  pipeDiameter,
}: GullyViewerProps) {
  const L = bodyLength * S;   // 长度 m (X 轴)
  const W = bodyWidth * S;    // 宽度 m (Z 轴)
  const D = bodyDepth * S;    // 深度 m (Y 轴)

  const grateCount = grateType === 'single' ? 1 : grateType === 'double' ? 2 : 3;

  // 外部箱体
  const outerGeo = useMemo(
    () => new THREE.BoxGeometry(L, D, W),
    [L, D, W],
  );

  // 内部空心 (视觉效果 — 稍小的半透明体)
  const t = wallThickness * S;
  const innerGeo = useMemo(
    () => new THREE.BoxGeometry(L - 2 * t, D - 2 * t, W - 2 * t),
    [L, D, W, t],
  );

  // 格栅盖 (在顶部，薄板)
  const grateGeo = useMemo(
    () => new THREE.BoxGeometry(L * 1.05 * grateCount, 0.015, W * 1.05),
    [L, W, grateCount],
  );

  // 壁厚内部表面的线框
  const innerEdgeGeo = useMemo(() => {
    const halfL = (L - 2 * t) / 2;
    const halfW = (W - 2 * t) / 2;
    const halfD = (D - 2 * t) / 2;
    const pts: THREE.Vector3[] = [
      // Bottom face
      new THREE.Vector3(-halfL, -halfD, -halfW),
      new THREE.Vector3(halfL, -halfD, -halfW),
      new THREE.Vector3(halfL, -halfD, halfW),
      new THREE.Vector3(-halfL, -halfD, halfW),
      new THREE.Vector3(-halfL, -halfD, -halfW),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [L, W, D, t]);

  // 管道接口 (在一侧壁上)
  const pipeRadius = (pipeDiameter * S) / 2;
  const pipeLen = 0.3; // 伸出长度
  const pipeGeo = useMemo(
    () => new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLen, 16),
    [pipeRadius],
  );

  // 井壁筋可视化 — 沿内壁四周的竖直线
  const wallBarPts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const halfL = (L - 2 * t) / 2;
    const halfW = (W - 2 * t) / 2;
    const halfD = D / 2;
    const spacing = 0.1; // 100mm 间距在模型空间
    const segments = Math.max(4, Math.floor((2 * (L + W)) / spacing));
    for (let i = 0; i < segments; i++) {
      const u = (i / segments) * (2 * (L + W));
      let x: number, z: number;
      if (u < L) {
        x = -halfL + u;
        z = -halfW;
      } else if (u < L + W) {
        x = halfL;
        z = -halfW + (u - L);
      } else if (u < 2 * L + W) {
        x = halfL - (u - L - W);
        z = halfW;
      } else {
        x = -halfL;
        z = halfW - (u - 2 * L - W);
      }
      pts.push(new THREE.Vector3(x, -halfD, z));
      pts.push(new THREE.Vector3(x, halfD, z));
    }
    // 成对制作线段
    const linePts: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      linePts.push(pts[i], pts[i + 1]);
    }
    return new THREE.BufferGeometry().setFromPoints(linePts);
  }, [L, W, D, t]);

  return (
    <Canvas
      camera={{ position: [L * 3, D * 2, Math.max(L, W) * 3], fov: 45, near: 0.05, far: 50 }}
      style={{ background: '#f8fafc' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 8]} intensity={0.9} />
      <directionalLight position={[-4, 6, -2]} intensity={0.3} />
      <Grid
        args={[10, 10]}
        position={[0, -D / 2 - 0.3, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#e2e8f0"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#cbd5e1"
        fadeDistance={20}
        fadeStrength={1}
        infiniteGrid
      />

      {/* 外部混凝土箱体 */}
      <mesh>
        <primitive object={outerGeo} attach="geometry" />
        <meshPhysicalMaterial
          color={CONCRETE_MATERIAL.color}
          transparent
          opacity={0.12}
          roughness={CONCRETE_MATERIAL.roughness}
          depthWrite={false}
        />
      </mesh>

      {/* 内部空心 */}
      <mesh>
        <primitive object={innerGeo} attach="geometry" />
        <meshPhysicalMaterial
          color="#D1D5DB"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          roughness={0.9}
        />
      </mesh>

      {/* 内壁边缘线 */}
      <lineSegments>
        <primitive object={innerEdgeGeo} attach="geometry" />
        <lineBasicMaterial color="#94A3B8" transparent opacity={0.4} />
      </lineSegments>

      {/* 顶部边缘线 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(L, D, W)]} />
        <lineBasicMaterial color="#94A3B8" transparent opacity={0.5} />
      </lineSegments>

      {/* 井壁筋 (竖向) */}
      <lineSegments>
        <primitive object={wallBarPts} attach="geometry" />
        <lineBasicMaterial color={COLOR_VERT_BAR} transparent opacity={0.45} />
      </lineSegments>

      {/* 格栅盖 */}
      <mesh position={[0, D / 2 + 0.007, 0]}>
        <primitive object={grateGeo} attach="geometry" />
        <meshStandardMaterial
          color={COLOR_GRATE}
          roughness={0.5}
          metalness={0.7}
        />
      </mesh>
      {/* 格栅纹理线 (模拟格栅条) */}
      {Array.from({ length: Math.max(6, Math.floor(L * grateCount / 0.05)) }).map((_, i) => {
        const x = -L / 2 * grateCount + i * (L * grateCount / Math.max(6, Math.floor(L * grateCount / 0.05))) + 0.02;
        return (
          <mesh key={`gbar-${i}`} position={[x, D / 2 + 0.02, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.008, 0.005, W * 1.02]} />
            <meshStandardMaterial color="#6B7280" roughness={0.6} metalness={0.5} />
          </mesh>
        );
      })}

      {/* 侧壁管道接口 */}
      <group position={[L / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <primitive object={pipeGeo} attach="geometry" />
          <meshPhysicalMaterial
            color={COLOR_PIPE}
            transparent
            opacity={0.4}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLen, 16)]} />
          <lineBasicMaterial color={COLOR_PIPE} transparent opacity={0.7} />
        </lineSegments>
      </group>

      <OrbitControls
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        minDistance={Math.max(L, W, D) * 1}
        maxDistance={Math.max(L, W, D) * 12}
      />
    </Canvas>
  );
}
