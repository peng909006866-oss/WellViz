'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { RebarMeshInfo, PipeFoundationParams, PipeFoundationResult } from '@/lib/types';
import { lookupPipeFoundation, BEDDING_ANGLE_LABELS } from '@/lib/tables';

interface PipeFoundationViewerProps {
  params: PipeFoundationParams;
  result: PipeFoundationResult;
  selectedInfo: RebarMeshInfo | null;
  onSelect: (info: RebarMeshInfo | null) => void;
}

const S = 0.001; // mm → m

export default function PipeFoundationViewer({
  params,
  result,
  selectedInfo,
  onSelect,
}: PipeFoundationViewerProps) {
  const row = lookupPipeFoundation(params.pipeDiameter, params.beddingAngle);
  const isFlat = params.beddingAngle === 'flat';

  // Dimensions in meters for 3D scene
  const pipeDiaM = params.pipeDiameter * S;
  const pipeRadius = pipeDiaM / 2;
  const baseWidthM = result.baseWidth * S;
  const baseThicknessM = result.baseThickness * S;
  const gravelThicknessM = result.gravelThickness * S;
  const segmentLength = 3; // 显示 3m 长的段

  // Pipe wall thickness (approximate for concrete pipes)
  const pipeWallM = Math.max(0.04, params.pipeDiameter * S * 0.08); // ~8% of diameter, min 40mm
  const pipeOuterRadius = pipeRadius + pipeWallM;

  // Color for foundation bedding
  const foundationColor = '#95A5A6';
  const foundationHiColor = '#7F8C8D';
  const gravelColor = '#D4C5A9';
  const pipeColor = '#5D6D7E';
  const pipeHiColor = '#4A5568';

  return (
    <Canvas
      camera={{ position: [baseWidthM * 3, baseWidthM * 1.5, baseWidthM * 3], fov: 45, near: 0.05, far: 100 }}
      style={{ background: '#f8fafc' }}
      onClick={() => onSelect(null)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 8]} intensity={0.9} />
      <directionalLight position={[-4, 6, -2]} intensity={0.3} />
      <Grid
        args={[20, 20]}
        position={[0, -baseThicknessM - gravelThicknessM - 0.05, 0]}
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

      <group position={[0, 0, 0]}>
        {/* Gravel bedding layer */}
        <mesh
          position={[0, -baseThicknessM - gravelThicknessM / 2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({
              type: 'gravel',
              label: '碎石垫层',
              detail: `厚度 ${result.gravelThickness}mm × 宽度 ${result.baseWidth}mm`,
            });
          }}
        >
          <boxGeometry args={[baseWidthM, gravelThicknessM, segmentLength]} />
          <meshStandardMaterial
            color={selectedInfo?.type === 'gravel' ? '#C4A97D' : gravelColor}
            roughness={0.9}
            metalness={0}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Concrete foundation base (flat rectangular bottom) */}
        <mesh
          position={[0, -baseThicknessM / 2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({
              type: 'foundation',
              label: '混凝土基础',
              detail: `宽度 ${result.baseWidth}mm × 厚度 ${result.baseThickness}mm`,
            });
          }}
        >
          <boxGeometry args={[baseWidthM, baseThicknessM, segmentLength]} />
          <meshStandardMaterial
            color={selectedInfo?.type === 'foundation' ? foundationHiColor : foundationColor}
            roughness={0.7}
            metalness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Pipe cradle / haunch visualization (non-flat only) */}
        {!isFlat && (
          <group position={[0, 0, 0]}>
            {/* Left haunch */}
            <mesh
              position={[-pipeOuterRadius * 0.5, -baseThicknessM / 2 + baseThicknessM * 0.1, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelect({
                  type: 'foundation',
                  label: `管座 (${BEDDING_ANGLE_LABELS[params.beddingAngle]})`,
                  detail: `管径 DN${params.pipeDiameter} — ${BEDDING_ANGLE_LABELS[params.beddingAngle]}`,
                });
              }}
            >
              <boxGeometry
                args={[pipeOuterRadius * 0.6, baseThicknessM * 0.7, segmentLength]}
              />
              <meshStandardMaterial
                color={selectedInfo?.type === 'foundation' ? foundationHiColor : foundationColor}
                roughness={0.7}
                metalness={0.1}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Right haunch */}
            <mesh
              position={[pipeOuterRadius * 0.5, -baseThicknessM / 2 + baseThicknessM * 0.1, 0]}
            >
              <boxGeometry
                args={[pipeOuterRadius * 0.6, baseThicknessM * 0.7, segmentLength]}
              />
              <meshStandardMaterial
                color={selectedInfo?.type === 'foundation' ? foundationHiColor : foundationColor}
                roughness={0.7}
                metalness={0.1}
                transparent
                opacity={0.5}
              />
            </mesh>
          </group>
        )}

        {/* Pipe section */}
        <mesh
          position={[0, pipeOuterRadius * 0.3, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({
              type: 'pipeSection',
              label: `管道 DN${params.pipeDiameter}`,
              detail: `外径 Φ${Math.round(pipeOuterRadius * 2 * 1000)}mm`,
            });
          }}
        >
          <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, segmentLength, 32]} />
          <meshStandardMaterial
            color={selectedInfo?.type === 'pipeSection' ? pipeHiColor : pipeColor}
            roughness={0.6}
            metalness={0.2}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Pipe inner void visualization */}
        <mesh
          position={[0, pipeOuterRadius * 0.3, 0]}
        >
          <cylinderGeometry args={[pipeRadius * 0.95, pipeRadius * 0.95, segmentLength + 0.01, 32]} />
          <meshStandardMaterial
            color="#CBD5E1"
            roughness={0.9}
            metalness={0}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Dimension annotations — base width line */}
        <group position={[0, -baseThicknessM - gravelThicknessM - 0.15, 0]}>
          {/* Left marker */}
          <mesh position={[-baseWidthM / 2, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.02]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
          {/* Right marker */}
          <mesh position={[baseWidthM / 2, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.02]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
          {/* Horizontal line */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[baseWidthM, 0.01, 0.01]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
        </group>
      </group>

      <OrbitControls
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        minDistance={baseWidthM * 1.5}
        maxDistance={baseWidthM * 12}
      />
    </Canvas>
  );
}
