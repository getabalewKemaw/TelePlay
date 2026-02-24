import { promises as fs } from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { ffmpegService } from '../services/ffmpeg/FFmpegService.js';
import type { DecodeRequestDto } from '../dto/ffmpeg.dto.js';
import type { DecodeParams } from '../types/ffmpeg/FFmpegTypes.js';
import prisma from '../lib/prisma.js';
import path from 'path';
import { isDirectoryExists } from '../utils/fileUtils.js';
import { enforcePathPolicy } from '../utils/pathPolicy.js';
import { sendSuccess } from '../utils/response.js';

const progressPersistStep = 1;

const getProgressPercent = (
  progress: { out_time_ms?: number; out_time_us?: number },
  totalDurationMs?: number
): number | undefined => {
  if (!totalDurationMs || totalDurationMs <= 0) return undefined;
  const outMs = typeof progress.out_time_ms === 'number'
    ? progress.out_time_ms
    : (typeof progress.out_time_us === 'number' ? progress.out_time_us / 1000 : undefined);
  if (typeof outMs !== 'number' || !Number.isFinite(outMs)) return undefined;
  return Math.max(0, Math.min(100, Math.floor((outMs / totalDurationMs) * 100)));
};

// Request params/res body/req.query.
export const decode = async (req: Request<{}, {}, DecodeRequestDto>, res: Response, next: NextFunction) => {
  try {
    const { fileId, ...decodeParams } = req.body;
    decodeParams.input.path = enforcePathPolicy(decodeParams.input.path, 'Input path');
    const requestedOutputPath = decodeParams.output?.path
      ? enforcePathPolicy(decodeParams.output.path, 'Output path', { allowNonExisting: true, allowTemp: true })
      : undefined;
    let sourceDurationSeconds: number | undefined;
    if (fileId) {
      const existing = await prisma.mediaFile.findUnique({ where: { id: fileId } });
      sourceDurationSeconds = typeof existing?.duration === 'number' ? existing.duration : undefined;
      const existingDecoded = existing?.decodedPath ? path.resolve(existing.decodedPath) : undefined;
      if (existingDecoded && existing?.status === 'ready' && await isDirectoryExists(existingDecoded)) {
        if (!requestedOutputPath || requestedOutputPath === existingDecoded) {
          return res.status(409).json({
            success: false,
            error: { message: 'File already decoded', code: 'ALREADY_DECODED' },
            data: { outputPath: existingDecoded },
            meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
          });
        }
      }
    }
    const outputPath = requestedOutputPath;
    if (outputPath) {
      if (decodeParams.output) {
        decodeParams.output.path = outputPath;
      }
      const outputDir = path.dirname(outputPath);
      if (!await isDirectoryExists(outputDir)) {
        await fs.mkdir(outputDir, { recursive: true });
      }
    }

    let lastPersistedProgress = -progressPersistStep;
    const totalDurationMs = sourceDurationSeconds && sourceDurationSeconds > 0
      ? sourceDurationSeconds * 1000
      : undefined;

    if (fileId) {
      await prisma.mediaFile.update({
        where: { id: fileId },
        data: {
          status: 'processing',
          metadata: {
            decodeProgress: 0,
            decodeState: 'processing'
          } as any
        }
      });
    }

    const executionParams: DecodeParams = {
      ...decodeParams,
      onProgress: (update) => {
        if (!fileId) return;
        const progress = getProgressPercent(update, totalDurationMs);
        if (progress === undefined) return;
        if (progress < lastPersistedProgress + progressPersistStep && progress !== 100) return;
        lastPersistedProgress = progress;
        void prisma.mediaFile.update({
          where: { id: fileId },
          data: {
            status: 'processing',
            metadata: {
              decodeProgress: progress,
              decodeState: 'processing'
            } as any
          }
        }).catch(() => undefined);
      }
    };

    const result = await ffmpegService.decode(executionParams);

    // If we have a fileId, update the database with the decoded path
    if (fileId && result.success && result.outputPath) {
      await prisma.mediaFile.update({
        where: { id: fileId },
        data: {
          decodedPath: result.outputPath,
          status: 'ready',
          metadata: {
            decodeProgress: 100,
            decodeState: 'completed'
          } as any
        }
      });
    }

    sendSuccess(res, result);
  } catch (error) {
    const fileId = req.body?.fileId;
    if (fileId) {
      await prisma.mediaFile.update({
        where: { id: fileId },
        data: {
          status: 'error',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            decodeState: 'failed'
          } as any
        }
      }).catch(() => undefined);
    }
    next(error);
  }
};
