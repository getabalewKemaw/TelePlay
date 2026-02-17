
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

const createChunkingBaseError = <T extends object>(
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
    Error.captureStackTrace(error, createChunkingBaseError);
  }
  return error;
};

const isNamedChunkingError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const createChunkingError = (
  message: string,
  code: string,
  cause?: Error
): ChunkingError => createChunkingBaseError('ChunkingError', message, code, undefined, cause);

/**
 * Validation error - thrown when input parameters are invalid
 */
export const createChunkingValidationError = (
  message: string,
  field?: string
): ChunkingValidationError => (
  createChunkingBaseError('ChunkingValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * File error - thrown when file operations fail
 */
export const createChunkingFileError = (
  message: string,
  filePath: string
): ChunkingFileError => (
  createChunkingBaseError('ChunkingFileError', message, 'FILE_ERROR', { filePath })
);

/**
 * Metadata error - thrown when metadata retrieval fails
 */
export const createChunkingMetadataError = (
  message: string,
  filePath: string
): ChunkingMetadataError => (
  createChunkingBaseError('ChunkingMetadataError', message, 'METADATA_ERROR', { filePath })
);

/**
 * Seek error - thrown when seek operation fails
 */
export const createChunkingSeekError = (
  message: string,
  time: number,
  filePath?: string
): ChunkingSeekError => (
  createChunkingBaseError('ChunkingSeekError', message, 'SEEK_ERROR', { time, filePath })
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
