
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

const streamingBaseError = <T extends object>(
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
    Error.captureStackTrace(error, streamingBaseError);
  }
  return error;
};

const isNamedStreamingError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const streamingError = (
  message: string,
  code: string,
  cause?: Error
): StreamingError => streamingBaseError('StreamingError', message, code, undefined, cause);

export const streamingValidationError = (
  message: string,
  field?: string
): StreamingValidationError => (
  streamingBaseError('StreamingValidationError', message, 'VALIDATION_ERROR', { field })
);

export const streamingSessionError = (
  message: string,
  sessionId: string
): StreamingSessionError => (
  streamingBaseError('StreamingSessionError', message, 'SESSION_ERROR', { sessionId })
);

export const streamingPlaybackError = (
  message: string,
  action: string
): StreamingPlaybackError => (
  streamingBaseError('StreamingPlaybackError', message, 'PLAYBACK_ERROR', { action })
);

/**
 * Preparation error - thrown when chunk/segment preparation fails
 */
export const streamingPreparationError = (
  message: string,
  chunkIndex?: number
): StreamingPreparationError => (
  streamingBaseError('StreamingPreparationError', message, 'PREPARATION_ERROR', { chunkIndex })
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
