
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

const ffmpegBaseError = <T extends object>(
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
    Error.captureStackTrace(error, ffmpegBaseError);
  }
  return error;
};

const isNamedFFmpegError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const ffmpegError = (
  message: string,
  code: string,
  cause?: Error
): FFmpegError => ffmpegBaseError('FFmpegError', message, code, undefined, cause);

export const ffmpegValidationError = (
  message: string,
  field?: string
): FFmpegValidationError => (
  ffmpegBaseError('FFmpegValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * Execution error - thrown when FFmpeg execution fails
 */
export const ffmpegExecutionError = (
  message: string,
  exitCode: number,
  stderr: string,
  executionTime: number
): FFmpegExecutionError => (
  ffmpegBaseError('FFmpegExecutionError', message, 'EXECUTION_ERROR', {
    exitCode,
    stderr,
    executionTime
  })
);

/**
 * File error - thrown when input/output file operations fail
 */
export const ffmpegFileError = (
  message: string,
  filePath: string
): FFmpegFileError => (
  ffmpegBaseError('FFmpegFileError', message, 'FILE_ERROR', { filePath })
);

/**
 * Codec error - thrown when codec is not supported or unavailable
 */
export const ffmpegCodecError = (
  message: string,
  codec: string
): FFmpegCodecError => (
  ffmpegBaseError('FFmpegCodecError', message, 'CODEC_ERROR', { codec })
);

/**
 * Timeout error - thrown when FFmpeg operation exceeds time limit
 */
export const ffmpegTimeoutError = (
  message: string,
  timeout: number
): FFmpegTimeoutError => (
  ffmpegBaseError('FFmpegTimeoutError', message, 'TIMEOUT_ERROR', { timeout })
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
