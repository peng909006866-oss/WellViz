/**
 * WellViz 输入校验
 *
 * 基于 RebarViz validate.ts 适配
 * - 校验井径/井深/管径范围
 */

import type { ManholeParams, SedimentationParams, DropManholeParams, GullyParams } from './types';
import { getAvailableDiameters, GULLY_TABLE } from './tables';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateManhole(params: ManholeParams): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.id || params.id.trim() === '') {
    errors.push({ field: 'id', message: '请输入井编号' });
  }

  const validDiameters = getAvailableDiameters('manhole');
  if (!validDiameters.includes(params.diameter)) {
    errors.push({
      field: 'diameter',
      message: `井径Φ${params.diameter} 非标准尺寸，可用: ${validDiameters.join(', ')}`,
    });
  }

  if (params.depth < 500 || params.depth > 8000) {
    errors.push({ field: 'depth', message: '井深应在 500-8000mm 之间' });
  }

  if (params.concreteGrade !== 'C25' && params.concreteGrade !== 'C30' && params.concreteGrade !== 'C35') {
    errors.push({ field: 'concreteGrade', message: '混凝土等级应为 C25/C30/C35' });
  }

  return errors;
}

export function validateSedimentation(params: SedimentationParams): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.id || params.id.trim() === '') {
    errors.push({ field: 'id', message: '请输入井编号' });
  }

  const validDiameters = getAvailableDiameters('sedimentation');
  if (!validDiameters.includes(params.diameter)) {
    errors.push({
      field: 'diameter',
      message: `沉泥井径Φ${params.diameter} 非标准尺寸，可用: ${validDiameters.join(', ')}`,
    });
  }

  if (params.depth < 1500 || params.depth > 8000) {
    errors.push({ field: 'depth', message: '井深应在 1500-8000mm 之间' });
  }

  return errors;
}

export function validateDropManhole(params: DropManholeParams): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.id || params.id.trim() === '') {
    errors.push({ field: 'id', message: '请输入井编号' });
  }

  const validDiameters = getAvailableDiameters('dropManhole');
  if (!validDiameters.includes(params.diameter)) {
    errors.push({
      field: 'diameter',
      message: `跌水井径Φ${params.diameter} 非标准尺寸，可用: ${validDiameters.join(', ')}`,
    });
  }

  if (params.depth < 2500 || params.depth > 10000) {
    errors.push({ field: 'depth', message: '井深应在 2500-10000mm 之间' });
  }

  if (params.dropHeight < 500 || params.dropHeight > 5000) {
    errors.push({ field: 'dropHeight', message: '跌水高度应在 500-5000mm 之间' });
  }

  return errors;
}

export function validateGully(params: GullyParams): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.id || params.id.trim() === '') {
    errors.push({ field: 'id', message: '请输入雨水口编号' });
  }

  const validSizes = Object.keys(GULLY_TABLE);
  if (!validSizes.includes(params.size)) {
    errors.push({
      field: 'size',
      message: `尺寸 ${params.size} 非标准，可用: ${validSizes.join(', ')}`,
    });
  }

  return errors;
}
