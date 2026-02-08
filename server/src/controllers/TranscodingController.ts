import type { Request, Response, NextFunction } from 'express';
import { TranscodingService } from '../services/transcoding/TranscodingService.js';
import { FFmpegService } from '../services/ffmpeg/FFmpegService.js';
import type { TranscodeRequestDto } from '../dto/ffmpeg.dto.js';
import type { ApiResponse } from '../dto/base.dto.js';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

type TranscodeConvertRequest = TranscodeRequestDto & { fileId?: string };

export class TranscodingController {
  private transcodingService: TranscodingService;

  constructor(transcodingService?: TranscodingService) {
    this.transcodingService = transcodingService ?? new TranscodingService(new FFmpegService() as any);
  }

  convert = async (req: Request<{}, {}, TranscodeConvertRequest>, res: Response, next: NextFunction) => {
    try {
      const { input, output, sourceEncoding, targetEncoding } = req.body;

      const inputPath = path.resolve(input.path);
      const outputPath = path.resolve(output.path);
      const outputDir = path.dirname(outputPath);

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const result = await this.transcodingService.transcodeChunk({
        inputPath,
        outputPath,
        source,
        Encoding,
        targetEncoding
      });

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

  convertDownload = async (req: Request<{}, {}, TranscodeConvertRequest>, res: Response, next: NextFunction) => {
    try {
      const { input, output, sourceEncoding, targetEncoding } = req.body;

      const inputPath = path.resolve(input.path);
      const tempBase = await fs.mkdtemp(path.join(os.tmpdir(), 'iplayer-convert-'));
      const downloadName = path.basename(output.path);
      const outputPath = path.join(tempBase, downloadName);

      await this.transcodingService.transcodeChunk({
        inputPath,
        outputPath,
        sourceEncoding,
        targetEncoding
      });

      res.download(outputPath, downloadName, async () => {
        try {
          await fs.unlink(outputPath);
          await fs.rmdir(tempBase);
        } catch {
          // best-effort cleanup
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
