
export type TranscodingError = Error & {
  code: string;
  cause?: Error;
};

export type TranscodingValidationError = TranscodingError & {
  field?: string;
};

export type TranscodingCodecError = TranscodingError & {
  sourceCodec: string;
  targetCodec: string;
};

export type TranscodingFileError = TranscodingError & {
  filePath: string;
};

export type TranscodingChunkError = TranscodingError & {
  chunkIndex: number;
};

const createTranscodingBaseError = <T extends object>(
  name: string,
  message: string,
  code: string,
  extras?: T,
  cause?: Error
): TranscodingError & T => {
  const error = new Error(message) as TranscodingError & T;
  error.name = name;
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  if (extras) {
    Object.assign(error, extras);
  }
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createTranscodingBaseError);
  }
  return error;
};

const isNamedTranscodingError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const createTranscodingError = (
  message: string,
  code: string,
  cause?: Error
): TranscodingError => createTranscodingBaseError('TranscodingError', message, code, undefined, cause);

/**
 * Validation error - thrown when input parameters are invalid
 */
export const createTranscodingValidationError = (
  message: string,
  field?: string
): TranscodingValidationError => (
  createTranscodingBaseError('TranscodingValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * Codec error - thrown when codec operations fail
 */
export const createTranscodingCodecError = (
  message: string,
  sourceCodec: string,
  targetCodec: string
): TranscodingCodecError => (
  createTranscodingBaseError('TranscodingCodecError', message, 'CODEC_ERROR', { sourceCodec, targetCodec })
);

/**
 * File error - thrown when file operations fail
 */
export const createTranscodingFileError = (
  message: string,
  filePath: string
): TranscodingFileError => (
  createTranscodingBaseError('TranscodingFileError', message, 'FILE_ERROR', { filePath })
);

/**
 * Chunk error - thrown when chunk transcoding fails
 */
export const createTranscodingChunkError = (
  message: string,
  chunkIndex: number
): TranscodingChunkError => (
  createTranscodingBaseError('TranscodingChunkError', message, 'CHUNK_ERROR', { chunkIndex })
);

export const isTranscodingValidationError = (err: unknown): err is TranscodingValidationError => (
  isNamedTranscodingError(err, 'TranscodingValidationError')
);

export const isTranscodingCodecError = (err: unknown): err is TranscodingCodecError => (
  isNamedTranscodingError(err, 'TranscodingCodecError')
);

export const isTranscodingFileError = (err: unknown): err is TranscodingFileError => (
  isNamedTranscodingError(err, 'TranscodingFileError')
);

export const isTranscodingChunkError = (err: unknown): err is TranscodingChunkError => (
  isNamedTranscodingError(err, 'TranscodingChunkError')
);
