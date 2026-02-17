
export type FFmpegError = Error & {
  code: string;
  cause?: Error;
};

export type FFmpegValidationError = FFmpegError & {
  field?: string;
};

export type FFmpegExecutionError = FFmpegError & {
  exitCode: number;
  stderr: string;
  executionTime: number;
};

export type FFmpegFileError = FFmpegError & {
  filePath: string;
};

export type FFmpegCodecError = FFmpegError & {
  codec: string;
};

export type FFmpegTimeoutError = FFmpegError & {
  timeout: number;
};

const createFFmpegBaseError = <T extends object>(
  name: string,
  message: string,
  code: string,
  extras?: T,
  cause?: Error
): FFmpegError & T => {
  const error = new Error(message) as FFmpegError & T;
  error.name = name;
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  if (extras) {
    Object.assign(error, extras);
  }
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createFFmpegBaseError);
  }
  return error;
};

const isNamedFFmpegError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const createFFmpegError = (
  message: string,
  code: string,
  cause?: Error
): FFmpegError => createFFmpegBaseError('FFmpegError', message, code, undefined, cause);

export const createFFmpegValidationError = (
  message: string,
  field?: string
): FFmpegValidationError => (
  createFFmpegBaseError('FFmpegValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * Execution error - thrown when FFmpeg execution fails
 */
export const createFFmpegExecutionError = (
  message: string,
  exitCode: number,
  stderr: string,
  executionTime: number
): FFmpegExecutionError => (
  createFFmpegBaseError('FFmpegExecutionError', message, 'EXECUTION_ERROR', {
    exitCode,
    stderr,
    executionTime
  })
);

/**
 * File error - thrown when input/output file operations fail
 */
export const createFFmpegFileError = (
  message: string,
  filePath: string
): FFmpegFileError => (
  createFFmpegBaseError('FFmpegFileError', message, 'FILE_ERROR', { filePath })
);

/**
 * Codec error - thrown when codec is not supported or unavailable
 */
export const createFFmpegCodecError = (
  message: string,
  codec: string
): FFmpegCodecError => (
  createFFmpegBaseError('FFmpegCodecError', message, 'CODEC_ERROR', { codec })
);

/**
 * Timeout error - thrown when FFmpeg operation exceeds time limit
 */
export const createFFmpegTimeoutError = (
  message: string,
  timeout: number
): FFmpegTimeoutError => (
  createFFmpegBaseError('FFmpegTimeoutError', message, 'TIMEOUT_ERROR', { timeout })
);

export const isFFmpegValidationError = (err: unknown): err is FFmpegValidationError => (
  isNamedFFmpegError(err, 'FFmpegValidationError')
);

export const isFFmpegExecutionError = (err: unknown): err is FFmpegExecutionError => (
  isNamedFFmpegError(err, 'FFmpegExecutionError')
);

export const isFFmpegTimeoutError = (err: unknown): err is FFmpegTimeoutError => (
  isNamedFFmpegError(err, 'FFmpegTimeoutError')
);

export const isFFmpegFileError = (err: unknown): err is FFmpegFileError => (
  isNamedFFmpegError(err, 'FFmpegFileError')
);
