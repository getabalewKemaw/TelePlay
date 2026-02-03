
/**
 * Shared Base Response for all API responses
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiErrorResponse;
    meta?: ResponseMetadata;
}

export interface ApiErrorResponse {
    code: string;
    message: string;
    details?: any;
    traceId?: string;
}

export interface ResponseMetadata {
    timestamp: string;
    version: string;
    processingTimeMs?: number;
}

/**
 * Common Error Codes
 */
export enum ApiErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    FFMPEG_ERROR = 'FFMPEG_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    TIMEOUT = 'TIMEOUT'
}
