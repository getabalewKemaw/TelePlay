
export type ChunkingError = Error & {
  code: string;
  cause?: Error;
};

export type ChunkingValidationError = ChunkingError & {
  field?: string;
};

export type ChunkingFileError = ChunkingError & {
  filePath: string;
};

export type ChunkingMetadataError = ChunkingError & {
  filePath: string;
};

export type ChunkingSeekError = ChunkingError & {
  time: number;
  filePath?: string;
};

const chunkingBaseError = <T extends object>(
  name: string,
  message: string,
  code: string,
  extras?: T,
  cause?: Error
): ChunkingError & T => {
  const error = new Error(message) as ChunkingError & T;
  error.name = name;
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  if (extras) {
    Object.assign(error, extras);
  }
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, chunkingBaseError);
  }
  return error;
};

const isNamedChunkingError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const chunkingError = (
  message: string,
  code: string,
  cause?: Error
): ChunkingError => chunkingBaseError('ChunkingError', message, code, undefined, cause);

/**
 * Validation error - thrown when input parameters are invalid
 */
export const chunkingValidationError = (
  message: string,
  field?: string
): ChunkingValidationError => (
  chunkingBaseError('ChunkingValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * File error - thrown when file operations fail
 */
export const chunkingFileError = (
  message: string,
  filePath: string
): ChunkingFileError => (
  chunkingBaseError('ChunkingFileError', message, 'FILE_ERROR', { filePath })
);

/**
 * Metadata error - thrown when metadata retrieval fails
 */
export const chunkingMetadataError = (
  message: string,
  filePath: string
): ChunkingMetadataError => (
  chunkingBaseError('ChunkingMetadataError', message, 'METADATA_ERROR', { filePath })
);

/**
 * Seek error - thrown when seek operation fails
 */
export const chunkingSeekError = (
  message: string,
  time: number,
  filePath?: string
): ChunkingSeekError => (
  chunkingBaseError('ChunkingSeekError', message, 'SEEK_ERROR', { time, filePath })
);

export const isChunkingValidationError = (err: unknown): err is ChunkingValidationError => (
  isNamedChunkingError(err, 'ChunkingValidationError')
);

export const isChunkingFileError = (err: unknown): err is ChunkingFileError => (
  isNamedChunkingError(err, 'ChunkingFileError')
);

export const isChunkingMetadataError = (err: unknown): err is ChunkingMetadataError => (
  isNamedChunkingError(err, 'ChunkingMetadataError')
);

export const isChunkingSeekError = (err: unknown): err is ChunkingSeekError => (
  isNamedChunkingError(err, 'ChunkingSeekError')
);
