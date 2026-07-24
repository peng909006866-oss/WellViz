'use client';

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import type { ManholeParams, RebarMeshInfo } from '@/lib/types';
import {
  ConcreteCylinder,
  PipeConnectionStub,
} from './three/ConcreteCylinder';
import {
  CircularRing,
  VerticalBars,
} from './three/CircularRing';
import { WellCover } from './three/WellCover';
import {
  lookupManhole,
  parseRebarSpec,
} from '@/lib/tables';
import {
  COLOR_VERT_BAR,
  COLOR_VERT_BAR_HI,
  COLOR_HORIZ_BAR,
  COLOR_HORIZ_BAR_HI,
  COLOR_STEPS,
  COLOR_STEPS_HI,
  COLOR_PIPE,
  COLOR_PIPE_HI,
  S,
} from '@/lib/constants';

interface ManholeViewerProps {
  params: ManholeParams;
  selectedInfo: RebarMeshInfo | null;
  onSelect: (info: RebarMeshInfo | null) => void;
  constructionStep: number;
}

export default function ManholeViewer({
  params,
  selectedInfo,
  onSelect,
  constructionStep,
}: ManholeViewerProps) {
  const { row } = lookupManhole(params.diameter);
  const depthM = params.depth * S;
  const innerDia = params.diameter;
  const wallT = row.wallThickness;
  const outerRadius = (innerDia + 2 * wallT) * S / 2;
  const baseT = row.baseThickness;
  const coverT = row.coverThickness;
  const cvr = row.cover;
  const horizR = parseRebarSpec(row.horizBar);
  const vertR = parseRebarSpec(row.vertBar);

  // 环向筋层数
  const horizRingCount = Math.floor((params.depth - baseT) / horizR.spacing) + 1;
  const barrelDepth = params.depth - baseT;
  const ringSpacingM = horizR.spacing * S;

  // 配筋中心半径
  const barCenterRadius = (innerDia + wallT - cvr * 2) / 2;

  // 竖向筋数量
  const vertOuterCirc = Math.PI * (innerDia + 2 * wallT - 2 * cvr) * S * 1000;
  const vertCount = Math.ceil(vertOuterCirc / vertR.spacing);

  const ringYPositions = useMemo(() => {
    const positions: number[] = [];
    const startY = -depthM / 2;
    for (let i = 0; i < horizRingCount; i++) {
      positions.push(startY + (i + 0.5) * ringSpacingM + baseT * S / 2);
    }
    return positions;
  }, [horizRingCount, ringSpacingM, depthM, baseT]);

  // 施工步骤可见性
  const showConcrete = constructionStep >= 0;
  const showBaseBar = constructionStep >= 1;
  const showVertBar = constructionStep >= 2;
  const showHorizBar = constructionStep >= 3;
  const showCover = constructionStep >= 4;
  const showSteps = constructionStep >= 5;
  const showPipes = constructionStep >= 6;

  return (
    <Canvas
      camera={{ position: [outerRadius * 6, depthM * 1.2, outerRadius * 6], fov: 45, near: 0.05, far: 100 }}
      style={{ background: '#f8fafc' }}
      onClick={() => onSelect(null)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 8]} intensity={0.9} />
      <directionalLight position={[-4, 6, -2]} intensity={0.3} />
      <Grid
        args={[20, 20]}
        position={[0, -depthM / 2 - 0.5, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#e2e8f0"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#cbd5e1"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />

      {/* 筒体混凝土 */}
      {showConcrete && (
        <ConcreteCylinder
          position={[0, 0, 0]}
          innerDiameter={innerDia}
          wallThickness={wallT}
          depth={params.depth}
          baseThickness={baseT}
          opacity={0.12}
        />
      )}

      {/* 环向筋 */}
      {showHorizBar && ringYPositions.map((y, i) => (
        <CircularRing
          key={`ring-${i}`}
          position={[0, y, 0]}
          radius={barCenterRadius}
          diameter={horizR.diameter}
          color={COLOR_HORIZ_BAR}
          hiColor={COLOR_HORIZ_BAR_HI}
          info={{
            type: 'horizBar',
            label: `环向筋 #${i + 1}`,
            detail: `${row.horizBar} × ${horizRingCount}层`,
            setId: `horiz-ring-${i}`,
            instanceIndex: i,
            groupLabel: `环向筋 (${horizRingCount}层)`,
            groupCount: horizRingCount,
          }}
          selected={selectedInfo?.setId === `horiz-ring-${i}`}
          onSelect={onSelect}
          renderMode="solid"
        />
      ))}

      {/* 竖向筋 */}
      {showVertBar && (
        <VerticalBars
          position={[0, 0, 0]}
          innerDiameter={innerDia}
          wallThickness={wallT}
          cover={cvr}
          depth={params.depth}
          barDiameter={vertR.diameter}
          spacing={vertR.spacing}
          color={COLOR_VERT_BAR}
          hiColor={COLOR_VERT_BAR_HI}
          renderMode="solid"
        />
      )}

      {/* 盖板 */}
      {showCover && (
        <WellCover
          position={[0, depthM / 2, 0]}
          innerDiameter={innerDia}
          wallThickness={wallT}
          coverThickness={coverT}
          coverType={params.coverType}
        />
      )}

      {/* 踏步/爬梯 */}
      {showSteps && params.hasSteps && (
        <group>
          {Array.from({ length: Math.floor(params.depth / params.stepSpacing) }).map((_, i) => {
            const y = -depthM / 2 + (i + 0.5) * params.stepSpacing * S;
            const x1 = innerDia * S / 2 * 0.8;
            const x2 = innerDia * S / 2 * 0.8;
            return (
              <mesh key={`step-${i}`} position={[0, y, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.006, 0.006, innerDia * S * 0.8, 8]} />
                <meshStandardMaterial
                  color={COLOR_STEPS}
                  roughness={0.5}
                  metalness={0.7}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 管道接口 */}
      {showPipes && params.pipeConnections.map((pipe, i) => {
        const pipeR = pipe.diameter * S / 2;
        const angleRad = (pipe.angle * Math.PI) / 180;
        const x = Math.sin(angleRad) * (innerDia / 2 + wallT) * S;
        const z = Math.cos(angleRad) * (innerDia / 2 + wallT) * S;
        const y = (pipe.invertElevation * S * 1000); // 相对标高转换
        return (
          <PipeConnectionStub
            key={`pipe-${i}`}
            position={[x, y, z]}
            pipeDiameter={pipe.diameter}
            length={300}
            angle={angleRad + Math.PI / 2}
            color={pipe.type === 'inlet' ? '#1ABC9C' : '#E74C3C'}
          />
        );
      })}

      <OrbitControls
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        minDistance={outerRadius * 1.5}
        maxDistance={outerRadius * 20}
      />
      <Environment preset="warehouse" />
    </Canvas>
  );
}
