import type { AudioCodec, SampleRate, ChannelConfig, AudioEncodingParams } from '../../types/ffmpeg/FFmpegTypes.js';
import { ffmpegValidationError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { SUPPORTED_CHANNELS, SUPPORTED_CODECS, SUPPORTED_SAMPLE_RATES } from '../../constants/ffmpeg/index.js';
import path from 'path';

export const validateCodec: (codec: string) => asserts codec is AudioCodec = (codec) => {
  if (!SUPPORTED_CODECS.has(codec as AudioCodec)) {
    throw ffmpegValidationError(
      `Unsupported codec: ${codec}. Supported codecs: ${Array.from(SUPPORTED_CODECS).join(', ')}`,
      'codec'
    );
  }
};

export const validateSampleRate: (sampleRate: number) => asserts sampleRate is SampleRate = (sampleRate) => {
  if (!SUPPORTED_SAMPLE_RATES.has(sampleRate as SampleRate)) {
    throw ffmpegValidationError(
      `Unsupported sample rate: ${sampleRate}Hz. Supported rates: ${Array.from(SUPPORTED_SAMPLE_RATES).join(', ')}Hz`,
      'sampleRate'
    );
  }
};

export const validateChannels: (channels: number) => asserts channels is ChannelConfig = (channels) => {
  if (!SUPPORTED_CHANNELS.has(channels as ChannelConfig)) {
    throw ffmpegValidationError(
      `Unsupported channel count: ${channels}. Supported: ${Array.from(SUPPORTED_CHANNELS).join(', ')}`,
      'channels'
    );
  }
};

export const validateBitrate: (bitrate: number | undefined) => void = (bitrate) => {
  if (bitrate !== undefined) {
    if (bitrate <= 0 || bitrate > 10000) {
      throw ffmpegValidationError(
        `Invalid bitrate: ${bitrate}kbps. Must be between 1 and 10000 kbps`,
        'bitrate'
      );
    }
  }
};

export const validateEncodingParams: (params: AudioEncodingParams) => void = (params) => {
  validateCodec(params.codec);
  validateSampleRate(params.sampleRate);
  validateChannels(params.channels);
  validateBitrate(params.bitrate);
};

export const validateInputFile: (filePath: string) => Promise<void> = async (filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw ffmpegValidationError('Input file path is required and must be a string', 'input');
  }

  if (!existsSync(filePath)) {
    throw ffmpegValidationError(
      `Input file does not exist: ${filePath}`,
      'input'
    );
  }

  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch (error) {
    throw ffmpegValidationError(
      `Input file is not readable: ${filePath}`,
      'input'
    );
  }
};

export const validateOutputPath: (filePath: string) => Promise<void> = async (filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw ffmpegValidationError('Output file path is required and must be a string', 'output');
  }
  const outputDir = path.dirname(filePath);

  if (!existsSync(outputDir)) {
    throw ffmpegValidationError(
      `Output directory does not exist: ${outputDir}`,
      'output'
    );
  }

  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch (error) {
    throw ffmpegValidationError(
      `Output directory is not writable: ${outputDir}`,
      'output'
    );
  }
};

export const validateFilePath: (filePath: string, fieldName: string) => void = (filePath, fieldName) => {
  if (!filePath || typeof filePath !== 'string') {
    throw ffmpegValidationError(
      `${fieldName} file path is required and must be a string`,
      fieldName
    );
  }

  if (path.isAbsolute(filePath) && !filePath.match(/^[a-zA-Z]:/)) {
    // Basic validation for absolute paths
      throw ffmpegValidationError(
        `Invalid file path format: ${filePath}`,
        fieldName
      );
  }
};
