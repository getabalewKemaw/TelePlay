
import type { AudioCodec, SampleRate, ChannelConfig, FFmpegExecutionResult } from '../types/ffmpeg/FFmpegTypes.js';

export interface FileConfigDto {
    path: string;
    format?: string;
}

export interface AudioEncodingParamsDto {
    codec: AudioCodec;
    sampleRate: SampleRate;
    channels: ChannelConfig;
    bitrate?: number;
}

export interface DecodeRequestDto {
    fileId?: string;
    input: FileConfigDto;
    output: FileConfigDto;
    codec?: AudioCodec;
    sampleRate?: SampleRate;
    channels?: ChannelConfig;
    bitrate?: number;
}

export interface EncodeRequestDto {
    input: FileConfigDto;
    output: FileConfigDto;
    encoding: AudioEncodingParamsDto;
}

export interface TranscodeRequestDto {
    input: FileConfigDto;
    output: FileConfigDto;
    sourceEncoding: AudioEncodingParamsDto;
    targetEncoding: AudioEncodingParamsDto;
}



