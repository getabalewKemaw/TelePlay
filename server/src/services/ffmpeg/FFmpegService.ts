import type { IFfmpegService } from '../../interfaces/ffmpeg/IFfmpegService.js';
import type { IFfmpegExecutor } from '../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type {
  DecodeParams,
  EncodeParams,
  TranscodeParams,
  FFmpegExecutionResult
} from '../../types/ffmpeg/FFmpegTypes.js';
import { FFmpegValidator } from '../../validator/ffmpeg/FFmpegValidator.js';
import { FFmpegFileError, FFmpegValidationError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { FFmpegExecutor } from './implementations/FFmpegExecutor.js';
import path from 'path';
import {
  buildDecodeAdditionalArgs,
  buildDecodeCommandOptions,
  buildEncodeCommandOptions,
  buildTranscodeCommandOptions,
  isRawCodec,
  normalizeDecodeCodec
} from '../../utils/ffmpeg/ffmpegServiceUtils.js';

export class FFmpegService implements IFfmpegService {
  private readonly executor: IFfmpegExecutor;

  constructor(executor?: IFfmpegExecutor) {
    this.executor = executor ?? new FFmpegExecutor();
  }

  async decode(params: DecodeParams): Promise<FFmpegExecutionResult> {
    this.validateCommonParams(params.input.path, params.output.path);
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);

    const normalizedCodec = normalizeDecodeCodec(params.codec);
    if (normalizedCodec) {
      FFmpegValidator.validateCodec(normalizedCodec);
      this.validateDecodeCodecRequirements(normalizedCodec, params);
    }

    if (params.sampleRate) {
      FFmpegValidator.validateSampleRate(params.sampleRate);
    }
    if (params.channels) {
      FFmpegValidator.validateChannels(params.channels);
    }
    if (params.bitrate) {
      FFmpegValidator.validateBitrate(params.bitrate);
    }

    const additionalArgs = buildDecodeAdditionalArgs({
      codec: normalizedCodec,
      sampleRate: params.sampleRate,
      channels: params.channels,
      bitrate: params.bitrate,
      inputFormat: params.input.format
    });

    const commandOptions = buildDecodeCommandOptions(
      params,
      normalizedCodec,
      additionalArgs
    );

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  async encode(params: EncodeParams): Promise<FFmpegExecutionResult> {
    this.validateCommonParams(params.input.path, params.output.path);
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    FFmpegValidator.validateEncodingParams(params.encoding);

    const commandOptions = buildEncodeCommandOptions(params);

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  async transcode(params: TranscodeParams): Promise<FFmpegExecutionResult> {
    this.validateCommonParams(params.input.path, params.output.path);
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    FFmpegValidator.validateEncodingParams(params.sourceEncoding);
    FFmpegValidator.validateEncodingParams(params.targetEncoding);

    const containerExts = new Set(['.wav', '.mp3', '.aac', '.ogg', '.opus', '.m4a']);
    const inputExt = params.input.path ? path.extname(params.input.path).toLowerCase() : '';
    const isContainerInput = containerExts.has(inputExt);
    const needsInputCodec = !isContainerInput && ['g711', 'g726', 'g728', 'pcm_s16le', 'pcm_s24le'].includes(params.sourceEncoding.codec);

    const commandOptions = buildTranscodeCommandOptions(
      params,
      isContainerInput,
      needsInputCodec
    );

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  private validateCommonParams(inputPath: string, outputPath: string): void {
    FFmpegValidator.validateFilePath(inputPath, 'input');
    FFmpegValidator.validateFilePath(outputPath, 'output');
  }

  private validateDecodeCodecRequirements(codec: string, params: DecodeParams): void {
    if (!isRawCodec(codec)) return;

    if (!params.sampleRate) {
      throw new FFmpegValidationError(
        `Sample rate is required for ${codec} decoding`,
        'sampleRate'
      );
    }
    if (!params.channels) {
      throw new FFmpegValidationError(
        `Channels are required for ${codec} decoding`,
        'channels'
      );
    }

    if (codec === 'g726' && !params.bitrate) {
      throw new FFmpegValidationError(
        'Bitrate is required for G.726 decoding (8, 16, 24, or 32 kbps)',
        'bitrate'
      );
    }
  }

  private handleExecutionError(
    error: unknown,
    inputPath: string,
    outputPath: string
  ): void {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new FFmpegFileError(
        `File not found: ${inputPath}`,
        inputPath
      );
    }
  }
}
