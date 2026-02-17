
export type StreamingError = Error & {
  code: string;
  cause?: Error;
};

export type StreamingValidationError = StreamingError & {
  field?: string;
};

export type StreamingSessionError = StreamingError & {
  sessionId: string;
};

export type StreamingPlaybackError = StreamingError & {
  action: string;
};

export type StreamingPreparationError = StreamingError & {
  chunkIndex?: number;
};

const createStreamingBaseError = <T extends object>(
  name: string,
  message: string,
  code: string,
  extras?: T,
  cause?: Error
): StreamingError & T => {
  const error = new Error(message) as StreamingError & T;
  error.name = name;
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  if (extras) {
    Object.assign(error, extras);
  }
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createStreamingBaseError);
  }
  return error;
};

const isNamedStreamingError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const createStreamingError = (
  message: string,
  code: string,
  cause?: Error
): StreamingError => createStreamingBaseError('StreamingError', message, code, undefined, cause);

export const createStreamingValidationError = (
  message: string,
  field?: string
): StreamingValidationError => (
  createStreamingBaseError('StreamingValidationError', message, 'VALIDATION_ERROR', { field })
);

export const createStreamingSessionError = (
  message: string,
  sessionId: string
): StreamingSessionError => (
  createStreamingBaseError('StreamingSessionError', message, 'SESSION_ERROR', { sessionId })
);

export const createStreamingPlaybackError = (
  message: string,
  action: string
): StreamingPlaybackError => (
  createStreamingBaseError('StreamingPlaybackError', message, 'PLAYBACK_ERROR', { action })
);

/**
 * Preparation error - thrown when chunk/segment preparation fails
 */
export const createStreamingPreparationError = (
  message: string,
  chunkIndex?: number
): StreamingPreparationError => (
  createStreamingBaseError('StreamingPreparationError', message, 'PREPARATION_ERROR', { chunkIndex })
);

export const isStreamingValidationError = (err: unknown): err is StreamingValidationError => (
  isNamedStreamingError(err, 'StreamingValidationError')
);

export const isStreamingSessionError = (err: unknown): err is StreamingSessionError => (
  isNamedStreamingError(err, 'StreamingSessionError')
);

export const isStreamingPlaybackError = (err: unknown): err is StreamingPlaybackError => (
  isNamedStreamingError(err, 'StreamingPlaybackError')
);

export const isStreamingPreparationError = (err: unknown): err is StreamingPreparationError => (
  isNamedStreamingError(err, 'StreamingPreparationError')
);
