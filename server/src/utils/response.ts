import type { Response } from 'express';
import type { ApiResponse } from '../dto/base.dto.js';

type MetaExtra = Record<string, unknown>;

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: MetaExtra
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...(meta ?? {}),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  res.status(status).json(response);
}
