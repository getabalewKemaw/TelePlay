
export class SegmentationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SegmentationError';
    Error.captureStackTrace(this, this.constructor);
  }
}
export class SegmentationValidationError extends SegmentationError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'SegmentationValidationError';
  }
}

/**
 * Strategy error - thrown when segmentation strategy fails
 */
export class SegmentationStrategyError extends SegmentationError {
  constructor(message: string, public readonly strategy: string) {
    super(message, 'STRATEGY_ERROR');
    this.name = 'SegmentationStrategyError';
  }
}

/**
 * Buffering error - thrown when buffering operations fail
 */
export class SegmentationBufferingError extends SegmentationError {
  constructor(message: string, public readonly bufferSize: number) {
    super(message, 'BUFFERING_ERROR');
    this.name = 'SegmentationBufferingError';
  }
}
