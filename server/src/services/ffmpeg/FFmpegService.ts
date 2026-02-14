
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
import { mapCodecToFFmpeg } from '../../utils/ffmpeg/codecMap.js';
export class FFmpegService implements IFfmpegService {
  private readonly executor: IFfmpegExecutor;
  constructor(executor?: IFfmpegExecutor) {
    this.executor = executor ?? new FFmpegExecutor();
  }
  async decode(params: DecodeParams): Promise<FFmpegExecutionResult> {
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    const normalizedCodec = this.normalizeDecodeCodec(params.codec);
    if (normalizedCodec) {
      FFmpegValidator.validateCodec(normalizedCodec);
      // validate sample rates and channel if provided.
      if (this.isRawCodec(normalizedCodec)) {
        if (!params.sampleRate) {
          throw new FFmpegValidationError(
            `Sample rate is required for ${normalizedCodec} decoding`,
            'sampleRate'
          );
        }
        if (!params.channels) {
          throw new FFmpegValidationError(
            `Channels are required for ${normalizedCodec} decoding`,
            'channels'
          );
        }
        FFmpegValidator.validateSampleRate(params.sampleRate);
        FFmpegValidator.validateChannels(params.channels);

        // G.726 requires bitrate
        if (normalizedCodec === 'g726' && !params.bitrate) {
          throw new FFmpegValidationError(
            'Bitrate is required for G.726 decoding (8, 16, 24, or 32 kbps)',
            'bitrate'
          );
        }
        if (params.bitrate) {
          FFmpegValidator.validateBitrate(params.bitrate);
        }
      }
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
    const additionalArgs = this.buildDecodeAdditionalArgs({
      codec: normalizedCodec,
      sampleRate: params.sampleRate,
      channels: params.channels,
      bitrate: params.bitrate,
      inputFormat: params.input.format
    });

    const outputFormat = params.output.format || 'wav';
    const outputCodec = outputFormat === 'mp3' ? 'mp3' : undefined;

    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      codec: outputCodec,
      sampleRate: normalizedCodec && this.isRawCodec(normalizedCodec)
        ? undefined
        : params.sampleRate,
      channels: normalizedCodec && this.isRawCodec(normalizedCodec)
        ? undefined
        : params.channels,
      bitrate: undefined,
      format: outputFormat, // Default to WAV for output
      startTime: params.startTime,
      duration: params.duration,
      additionalArgs: additionalArgs.length > 0 ? additionalArgs : undefined
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }
  async encode(params: EncodeParams): Promise<FFmpegExecutionResult> {
    
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');

    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    FFmpegValidator.validateEncodingParams(params.encoding);

    // Build command options
    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      codec: params.encoding.codec,
      sampleRate: params.encoding.sampleRate,
      channels: params.encoding.channels,
      bitrate: params.encoding.bitrate,
      format: params.output.format,
      startTime: params.startTime,
      duration: params.duration,
      additionalArgs: params.input.format ? ['-f', params.input.format] : undefined
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }
  async transcode(params: TranscodeParams): Promise<FFmpegExecutionResult> {
    // Validate input
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');

    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    FFmpegValidator.validateEncodingParams(params.sourceEncoding);
    FFmpegValidator.validateEncodingParams(params.targetEncoding);
    const containerExts = new Set(['.wav', '.mp3', '.aac', '.ogg', '.opus', '.m4a']);
    const inputExt = params.input.path ? path.extname(params.input.path).toLowerCase() : '';
    const isContainerInput = containerExts.has(inputExt);
    const needsInputCodec = !isContainerInput && ['g711', 'g726', 'g728', 'pcm_s16le', 'pcm_s24le'].includes(params.sourceEncoding.codec);
    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      codec: params.targetEncoding.codec,
      sampleRate: params.targetEncoding.sampleRate,
      channels: params.targetEncoding.channels,
      bitrate: params.targetEncoding.bitrate,
      format: params.output.format,
      startTime: params.startTime,
      duration: params.duration,
      additionalArgs: [
        ...(params.input.format && !isContainerInput ? ['-f', params.input.format] : []),
        ...(needsInputCodec ? [
          '-acodec', mapCodecToFFmpeg(params.sourceEncoding.codec),
          '-ar', params.sourceEncoding.sampleRate.toString(),
          '-ac', params.sourceEncoding.channels.toString()
        ] : [])
      ]
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
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
  private normalizeDecodeCodec(codec?: string): string | undefined {
    if (!codec) return undefined;
    if (codec === 'pcm_mulaw' || codec === 'pcm_alaw') return 'g711';
    if (codec === 'adpcm_g726') return 'g726';
    return codec;
  }
  private isRawCodec(codec: string): boolean {
    return codec === 'g711' || codec === 'g726' || codec === 'g728';
  }
  private buildDecodeAdditionalArgs(params: {
    codec?: string;
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
    inputFormat?: string;
  }): string[] {
    const { codec, sampleRate, channels, bitrate, inputFormat } = params;
    const additionalArgs: string[] = [];

    if (codec && this.isRawCodec(codec)) {
      const inputFormatMap: Record<string, string> = {
        g711: 'mulaw',
        g726: 'g726',
        g728: 'g728'
      };

      const format = inputFormatMap[codec];
      if (format) {
        additionalArgs.push('-f', format);
      }

      if (codec === 'g726' && bitrate) {
        const codeSize = Math.floor(bitrate / 8);
        additionalArgs.push('-code_size', codeSize.toString());
        additionalArgs.push('-acodec', 'g726');
        if (sampleRate) {
          additionalArgs.push('-sample_rate', sampleRate.toString());
        }
      } else if (codec === 'g711') {
        additionalArgs.push('-acodec', 'pcm_mulaw');
      } else if (codec === 'g728') {
        additionalArgs.push('-acodec', 'g728');
      }

      if (sampleRate && codec !== 'g726') {
        additionalArgs.push('-ar', sampleRate.toString());
      }
      if (channels) {
        additionalArgs.push('-ac', channels.toString());
      }
      return additionalArgs;
    }

    if (inputFormat) {
      additionalArgs.push('-f', inputFormat);
    }
    return additionalArgs;
  }
}
