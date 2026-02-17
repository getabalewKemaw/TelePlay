
export type SegmentationError = Error & {
  code: string;
  cause?: Error;
};

export type SegmentationValidationError = SegmentationError & {
  field?: string;
};

export type SegmentationStrategyError = SegmentationError & {
  strategy: string;
};

export type SegmentationBufferingError = SegmentationError & {
  bufferSize: number;
};

const createSegmentationBaseError = <T extends object>(
  name: string,
  message: string,
  code: string,
  extras?: T,
  cause?: Error
): SegmentationError & T => {
  const error = new Error(message) as SegmentationError & T;
  error.name = name;
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  if (extras) {
    Object.assign(error, extras);
  }
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createSegmentationBaseError);
  }
  return error;
};

const isNamedSegmentationError = (err: unknown, name: string): err is Error => (
  err instanceof Error && err.name === name
);

export const createSegmentationError = (
  message: string,
  code: string,
  cause?: Error
): SegmentationError => createSegmentationBaseError('SegmentationError', message, code, undefined, cause);

export const createSegmentationValidationError = (
  message: string,
  field?: string
): SegmentationValidationError => (
  createSegmentationBaseError('SegmentationValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * Strategy error - thrown when segmentation strategy fails
 */
export const createSegmentationStrategyError = (
  message: string,
  strategy: string
): SegmentationStrategyError => (
  createSegmentationBaseError('SegmentationStrategyError', message, 'STRATEGY_ERROR', { strategy })
);

/**
 * Buffering error - thrown when buffering operations fail
 */
export const createSegmentationBufferingError = (
  message: string,
  bufferSize: number
): SegmentationBufferingError => (
  createSegmentationBaseError('SegmentationBufferingError', message, 'BUFFERING_ERROR', { bufferSize })
);

export const isSegmentationValidationError = (err: unknown): err is SegmentationValidationError => (
  isNamedSegmentationError(err, 'SegmentationValidationError')
);

export const isSegmentationStrategyError = (err: unknown): err is SegmentationStrategyError => (
  isNamedSegmentationError(err, 'SegmentationStrategyError')
);

export const isSegmentationBufferingError = (err: unknown): err is SegmentationBufferingError => (
  isNamedSegmentationError(err, 'SegmentationBufferingError')
);
