
import type { Request, Response, NextFunction } from 'express';
import { ApiErrorCode } from '../dto/base.dto.js';
import type { ApiResponse } from '../dto/base.dto.js';
import { FFmpegValidationError, FFmpegExecutionError, FFmpegTimeoutError, FFmpegFileError } from '../errors/ffmpeg/FFmpegErrors.js';

/**
 * Global Error Handler Middleware
 * Maps domain-specific errors to standard HTTP responses
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const startTime = (req as any).startTime || Date.now();
    const processingTimeMs = Date.now() - startTime;

    let status = 500;
    let code = ApiErrorCode.INTERNAL_ERROR;
    let message = 'An internal server error occurred';
    let details = undefined;

    // 1. Map Domain Errors to HTTP Statuses & API Codes
    if (err instanceof FFmpegValidationError) {
        status = 400;
        code = ApiErrorCode.VALIDATION_ERROR;
        message = err.message;
        details = { field: err.field };
    } else if (err instanceof FFmpegExecutionError) {
        status = 500;
        code = ApiErrorCode.FFMPEG_ERROR;
        message = 'Media processing execution failed';
        details = {
            exitCode: err.exitCode,
            stderr: process.env.NODE_ENV === 'development' ? err.stderr : undefined
        };
    } else if (err instanceof FFmpegTimeoutError) {
        status = 408;
        code = ApiErrorCode.TIMEOUT;
        message = 'The media processing operation timed out';
        details = { timeout: err.timeout };
    } else if (err instanceof FFmpegFileError) {
        status = 404;
        code = ApiErrorCode.NOT_FOUND;
        message = err.message;
        details = { path: err.filePath };
    } else if (err.status) {
        // Handle standard HTTP errors if they have a status property
        status = err.status;
    }

    // 2. Logging Strategy (Simple console for now, as requested)
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} - Error: ${err.message}`);
    if (err.stack && process.env.NODE_ENV === 'development') {
        console.debug(err.stack);
    }

    // 3. Consistent Response Format
    const response: ApiResponse<null> = {
        success: false,
        error: {
            code,
            message,
            details,
            traceId: req.headers['x-request-id'] as string || Math.random().toString(36).substring(7)
        },
        meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            processingTimeMs
        }
    };

    res.status(status).json(response);
};
