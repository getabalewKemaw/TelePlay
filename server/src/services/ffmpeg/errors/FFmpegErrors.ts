/**
 * FFmpeg Service Custom Errors
 * Production-ready error handling with proper error types
 */

/**
 * Base error class for all FFmpeg-related errors
 */
export class FFmpegError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'FFmpegError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - thrown when input parameters are invalid
 */
export class FFmpegValidationError extends FFmpegError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'FFmpegValidationError';
  }
}

/**
 * Execution error - thrown when FFmpeg execution fails
 */
export class FFmpegExecutionError extends FFmpegError {
  constructor(
    message: string,
    public readonly exitCode: number,
    public readonly stderr: string,
    public readonly executionTime: number
  ) {
    super(message, 'EXECUTION_ERROR');
    this.name = 'FFmpegExecutionError';
  }
}

/**
 * File error - thrown when input/output file operations fail
 */
export class FFmpegFileError extends FFmpegError {
  constructor(message: string, public readonly filePath: string) {
    super(message, 'FILE_ERROR');
    this.name = 'FFmpegFileError';
  }
}

/**
 * Codec error - thrown when codec is not supported or unavailable
 */
export class FFmpegCodecError extends FFmpegError {
  constructor(message: string, public readonly codec: string) {
    super(message, 'CODEC_ERROR');
    this.name = 'FFmpegCodecError';
  }
}

/**
 * Timeout error - thrown when FFmpeg operation exceeds time limit
 */
export class FFmpegTimeoutError extends FFmpegError {
  constructor(message: string, public readonly timeout: number) {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'FFmpegTimeoutError';
  }
}
