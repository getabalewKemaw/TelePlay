/**
 * Streaming Preparation Service Custom Errors
 * Production-ready error handling with proper error types
 */

/**
 * Base error class for all streaming-related errors
 */
export class StreamingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'StreamingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - thrown when input parameters are invalid
 */
export class StreamingValidationError extends StreamingError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'StreamingValidationError';
  }
}

/**
 * Session error - thrown when session operations fail
 */
export class StreamingSessionError extends StreamingError {
  constructor(message: string, public readonly sessionId: string) {
    super(message, 'SESSION_ERROR');
    this.name = 'StreamingSessionError';
  }
}

/**
 * Playback error - thrown when playback control fails
 */
export class StreamingPlaybackError extends StreamingError {
  constructor(message: string, public readonly action: string) {
    super(message, 'PLAYBACK_ERROR');
    this.name = 'StreamingPlaybackError';
  }
}

/**
 * Preparation error - thrown when chunk/segment preparation fails
 */
export class StreamingPreparationError extends StreamingError {
  constructor(message: string, public readonly chunkIndex?: number) {
    super(message, 'PREPARATION_ERROR');
    this.name = 'StreamingPreparationError';
  }
}
