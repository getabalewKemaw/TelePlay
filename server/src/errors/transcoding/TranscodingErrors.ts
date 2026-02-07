
export class TranscodingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TranscodingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - thrown when input parameters are invalid
 */
export class TranscodingValidationError extends TranscodingError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'TranscodingValidationError';
  }
}

/**
 * Codec error - thrown when codec operations fail
 */
export class TranscodingCodecError extends TranscodingError {
  constructor(message: string, public readonly sourceCodec: string, public readonly targetCodec: string) {
    super(message, 'CODEC_ERROR');
    this.name = 'TranscodingCodecError';
  }
}

/**
 * File error - thrown when file operations fail
 */
export class TranscodingFileError extends TranscodingError {
  constructor(message: string, public readonly filePath: string) {
    super(message, 'FILE_ERROR');
    this.name = 'TranscodingFileError';
  }
}

/**
 * Chunk error - thrown when chunk transcoding fails
 */
export class TranscodingChunkError extends TranscodingError {
  constructor(message: string, public readonly chunkIndex: number) {
    super(message, 'CHUNK_ERROR');
    this.name = 'TranscodingChunkError';
  }
}
