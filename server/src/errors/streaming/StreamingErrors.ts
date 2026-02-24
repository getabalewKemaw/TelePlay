
export type StreamingError = Error & {
  code: string;
  cause?: Error;
};
export type StreamingValidationError = StreamingError & {
  field?: string;
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

export const streamingValidationError = (
  message: string,
  field?: string
): StreamingValidationError => (
  streamingBaseError('StreamingValidationError', message, 'VALIDATION_ERROR', { field })
);
