import { promises as fs } from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { ffmpegService } from '../services/ffmpeg/FFmpegService.js';
import type { DecodeRequestDto } from '../dto/ffmpeg.dto.js';
import type { ApiResponse } from '../dto/base.dto.js';
import prisma from '../lib/prisma.js';
import path from 'path';
import { isdirectoryExists } from '../utils/fileUtils.js';
import { enforcePathPolicy } from '../utils/pathPolicy.js';

// reqparams,resbody,req.body,query
export const decode = async (req: Request<{}, {}, DecodeRequestDto>, res: Response, next: NextFunction) => {
  try {
    const { fileId, ...decodeParams } = req.body;
    decodeParams.input.path = enforcePathPolicy(decodeParams.input.path, 'Input path');
    const requestedOutputPath = decodeParams.output?.path
      ? enforcePathPolicy(decodeParams.output.path, 'Output path', { allowNonExisting: true, allowTemp: true })
      : undefined;
    if (fileId) {
      const existing = await prisma.mediaFile.findUnique({ where: { id: fileId } });
      const existingDecoded = existing?.decodedPath ? path.resolve(existing.decodedPath) : undefined;
      if (existingDecoded && await isdirectoryExists(existingDecoded)) {
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
      if (!await isdirectoryExists(outputDir)) {
        await fs.mkdir(outputDir, { recursive: true });
      }
      if (await isdirectoryExists(outputPath)) {
        if (fileId) {
          await prisma.mediaFile.update({
            where: { id: fileId },
            data: {
             decodedPath: outputPath,
              status: 'ready'
            }
          });
        }
        const response: ApiResponse<any> = {
          success: true,
          data: { success: true, outputPath, alreadyDecoded: true },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        return res.status(200).json(response);
      }
    }

    const result = await ffmpegService.decode(decodeParams);

    // If we have a fileId, update the database with the decoded path
    if (fileId && result.success && result.outputPath) {
      await prisma.mediaFile.update({
        where: { id: fileId },
        data: {
          decodedPath: result.outputPath,
          status: 'ready'
        }
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
