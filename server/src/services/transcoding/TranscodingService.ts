
import type { ITranscodingService } from '../../interfaces/transcoding/ITranscodingService.js';
import type { IFfmpegExecutor } from '../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type {
  TranscodingResult,
  ChunkTranscodingParams,
  TranscodingConfig,
  SourceCodec,
  TargetCodec
} from '../../types/transcoding/TranscodingTypes.js';
import { TranscodingValidationError, TranscodingCodecError, TranscodingFileError } from '../../errors/transcoding/TranscodingErrors.js';
import { promises as fs } from 'fs';
import path from 'path';
import { FFmpegExecutor } from '../ffmpeg/implementations/FFmpegExecutor.js';
import { buildTranscodeCommandOptions } from '../../utils/ffmpeg/ffmpegServiceUtils.js';
import { isdirectoryExists } from '../../utils/fileUtils.js';
const DEFAULT_TARGET_CODEC: TargetCodec = 'aac';

import { CODEC_COMPATIBILITY } from '../../utils/transcoding/transcodingRequestUtils.js';
export class TranscodingService implements ITranscodingService {
  private readonly ffmpegExecutor: IFfmpegExecutor;

  constructor(ffmpegExecutor?: IFfmpegExecutor) {
    this.ffmpegExecutor = ffmpegExecutor ?? new FFmpegExecutor();
  }

  async transcodeChunk(params: ChunkTranscodingParams): Promise<TranscodingResult> {
    if (! await isdirectoryExists(params.inputPath)) {
      throw new TranscodingFileError(`Chunk file does not exist: ${params.inputPath}`, params.inputPath);
    }

    this.validateSourceEncoding(params.sourceEncoding);
    this.validateTargetEncoding(params.sourceEncoding.codec, params.targetEncoding);

    const originalStats = await fs.stat(params.inputPath);
    const originalSize = originalStats.size;
    const startTime = Date.now();
    const config: TranscodingConfig = {
      source: params.sourceEncoding,
      target: params.targetEncoding,
      mode: 'chunk'
    };

    try {
      await this.performTranscoding(params.inputPath, params.outputPath, config);
    } catch (error) {
      throw new TranscodingCodecError(
        `Chunk transcoding failed: ${error instanceof Error ? error.message : String(error)}`,
        params.sourceEncoding.codec,
        params.targetEncoding.codec
      );
    }

    const executionTime = Date.now() - startTime;
    const transcodedStats = await fs.stat(params.outputPath);
    const transcodedSize = transcodedStats.size;

    return {
      outputPath: params.outputPath,
      originalSize,
      transcodedSize,
      executionTime,
      sourceCodec: params.sourceEncoding.codec,
      targetCodec: params.targetEncoding.codec,
      config
    };
  }

  getRecommendedTargetCodec(sourceCodec: string): string {
    const compatibility = CODEC_COMPATIBILITY[sourceCodec as SourceCodec];
    if (!compatibility) {
      return DEFAULT_TARGET_CODEC;
    }

    return compatibility.recommended;
  }

  private async performTranscoding(
    inputPath: string,
    outputPath: string,
    config: TranscodingConfig
  ): Promise<void> {
    const transcodeParams = {
      input: { path: inputPath },
      output: { path: outputPath },
      sourceEncoding: {
        codec: config.source.codec,
        sampleRate: config.source.sampleRate,
        channels: config.source.channels,
        bitrate: config.source.bitrate
      },
      targetEncoding: {
        codec: config.target.codec,
        sampleRate: config.target.sampleRate,
        channels: config.target.channels,
        bitrate: config.target.bitrate
      }
    };

    const containerExts = new Set(['.wav', '.mp3', '.aac', '.ogg', '.opus', '.m4a']);
    const inputExt = path.extname(inputPath).toLowerCase();
    const isContainerInput = containerExts.has(inputExt);
    const needsInputCodec = !isContainerInput
      && ['g711', 'g726', 'g728', 'pcm_s16le', 'pcm_s24le'].includes(config.source.codec);
    const commandOptions = buildTranscodeCommandOptions(
      transcodeParams,
      isContainerInput,
      needsInputCodec
    );

    await this.ffmpegExecutor.execute(commandOptions);
  }

  private validateSourceEncoding(encoding: { codec: SourceCodec; bitrate?: number }): void {
    if (encoding.codec === 'g726' && !encoding.bitrate) {
      throw new TranscodingValidationError(
        'Source bitrate is required for G.726 codec',
        'sourceBitrate'
      );
    }
  }

  private validateTargetEncoding(sourceCodec: SourceCodec, encoding: { codec: TargetCodec; bitrate?: number }): void {
    const compatibility = CODEC_COMPATIBILITY[sourceCodec];
    if (!compatibility.compatible.includes(encoding.codec)) {
      throw new TranscodingValidationError(
        `Target codec ${encoding.codec} is not compatible with source codec ${sourceCodec}`,
        'targetEncoding.codec'
      );
    }
    if (encoding.bitrate !== undefined && encoding.bitrate <= 0) {
      throw new TranscodingValidationError(
        'Target bitrate must be greater than 0',
        'targetEncoding.bitrate'
      );
    }
  }
}

