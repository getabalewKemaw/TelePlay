import type { Request, Response, NextFunction } from 'express';
import { TranscodingService } from '../services/transcoding/TranscodingService.js';
import type { TranscodeRequestDto } from '../dto/ffmpeg.dto.js';
import type { ApiResponse } from '../dto/base.dto.js';
import { buildChunkTranscodingParams } from '../utils/transcoding/transcodingRequestUtils.js';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

type TranscodeConvertRequest = TranscodeRequestDto & { fileId?: string };

export class TranscodingController {
  private transcodingService: TranscodingService;

  constructor(transcodingService?: TranscodingService) {
    this.transcodingService = transcodingService ?? new TranscodingService();
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

      const params = buildChunkTranscodingParams(inputPath, outputPath, sourceEncoding, targetEncoding);
      const result = await this.transcodingService.transcodeChunk(params);

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

      const params = buildChunkTranscodingParams(inputPath, outputPath, sourceEncoding, targetEncoding);
      await this.transcodingService.transcodeChunk(params);

      res.download(outputPath, downloadName, async () => {
        try {
          await fs.unlink(outputPath);
          await fs.rm(tempBase, { recursive: true, force: true });
        } catch {
          // best-effort cleanup
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
