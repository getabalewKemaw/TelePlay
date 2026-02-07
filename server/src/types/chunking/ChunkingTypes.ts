
export interface ChunkMetadata {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  byteOffset?: number;
  byteSize?: number;
  filePath?: string;
}
export interface ChunkingConfig {
  chunkDuration: number ;
  totalDuration: number ;

  generateFiles?: boolean | undefined;
  outputDirectory?:  string | undefined;
  baseFilename?: string | undefined;
}
export interface ChunkingResult {
  chunks: ChunkMetadata[];
  totalChunks: number;
  totalDuration: number;
  chunkDuration: number;
  lastChunkDuration: number;
}
export interface SeekParams {
  time: number;
  exact?: boolean;
}

export interface SeekResult {
  chunk: ChunkMetadata;
  offsetInChunk: number;
  exact: boolean;
}
export interface MediaMetadata {
  duration: number;
  fileSize?: number |undefined;
  format?: string |undefined;
  codec?: string |undefined;
  bitrate?: number|undefined;
}
export interface ChunkingOptions {
  chunkDuration?: number;
  generateFiles?: boolean;
  outputDirectory?: string;
  baseFilename?: string;
}
