
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
    if (params.codec) {
      // normalize codec aliases
      if (params.codec === 'pcm_mulaw' || params.codec === 'pcm_alaw') {
        params.codec = 'g711';
      } else if (params.codec === 'adpcm_g726') {
        params.codec = 'g726';
      }

      FFmpegValidator.validateCodec(params.codec);
      // validate sample rates and channel if provided.
      if (params.codec === 'g711' || params.codec === 'g726' || params.codec === 'g728') {
        if (!params.sampleRate) {
          throw new FFmpegValidationError(
            `Sample rate is required for ${params.codec} decoding`,
            'sampleRate'
          );
        }
        if (!params.channels) {
          throw new FFmpegValidationError(
            `Channels are required for ${params.codec} decoding`,
            'channels'
          );
        }
        FFmpegValidator.validateSampleRate(params.sampleRate);
        FFmpegValidator.validateChannels(params.channels);

        // G.726 requires bitrate
        if (params.codec === 'g726' && !params.bitrate) {
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
    const additionalArgs: string[] = [];
    if (params.codec && (params.codec === 'g711' || params.codec === 'g726' || params.codec === 'g728')) {
      // map codec to input format/demuxer
      const inputFormatMap: Record<string, string> = {
        g711: 'mulaw',
        g726: 'g726',
        g728: 'g728'
      };

      if (params.codec in inputFormatMap) {
        const format = inputFormatMap[params.codec];
        if (format) {
          additionalArgs.push('-f', format);
        }
      }

      if (params.codec === 'g726' && params.bitrate) {
        // G.726 raw demuxer uses code_size to determine bits per sample
        // 16kbps = 2 bits, 24kbps = 3 bits, 32kbps = 4 bits, 40kbps = 5 bits
        const codeSize = Math.floor(params.bitrate / 8);
        additionalArgs.push('-code_size', codeSize.toString());
        additionalArgs.push('-acodec', 'g726');

        // raw demuxer also uses -sample_rate
        if (params.sampleRate) {
          additionalArgs.push('-sample_rate', params.sampleRate.toString());
        }
      } else if (params.codec === 'g711') {
        additionalArgs.push('-acodec', 'pcm_mulaw');
      } else if (params.codec === 'g728') {
        additionalArgs.push('-acodec', 'g728');
      }

      //  For raw streams, sample rate and channels MUST be before -i
      if (params.sampleRate && params.codec !== 'g726') { // G.726 uses -sample_rate for demuxer
        additionalArgs.push('-ar', params.sampleRate.toString());
      }
      if (params.channels) {
        additionalArgs.push('-ac', params.channels.toString());
      }
    } else if (params.input.format) {
      additionalArgs.push('-f', params.input.format);
    }

    const outputFormat = params.output.format || 'wav';
    const outputCodec = outputFormat === 'mp3' ? 'mp3' : undefined;

    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      codec: outputCodec,
      sampleRate: params.codec && ['g711', 'g726', 'g728'].includes(params.codec)
        ? undefined
        : params.sampleRate,
      channels: params.codec && ['g711', 'g726', 'g728'].includes(params.codec)
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
          '-acodec', this.mapCodecToFFmpeg(params.sourceEncoding.codec),
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
  private mapCodecToFFmpeg(codec: string): string {
    const codecMap: Record<string, string> = {
      g711: 'pcm_mulaw',
      g726: 'g726',
      g728: 'g728',
      pcm_s16le: 'pcm_s16le',
      pcm_s24le: 'pcm_s24le',
      aac: 'aac',
      mp3: 'libmp3lame',
      opus: 'libopus'
    };

    return codecMap[codec] || codec;
  }
}
