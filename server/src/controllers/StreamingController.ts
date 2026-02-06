
import type { Request, Response, NextFunction } from 'express';
import { StreamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import type { CreateSessionRequestDto, PlaybackControlRequestDto, PrepareItemsRequestDto } from '../dto/streaming.dto.js';
import type { IStreamingPreparationService } from '../interfaces/streaming/IStreamingPreparationService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import prisma from '../lib/prisma.js';

export class StreamingController {
    private streamingService: IStreamingPreparationService;

    constructor(streamingService?: IStreamingPreparationService) {
        this.streamingService = streamingService || new (StreamingPreparationService as any)();
    }

    createSession = async (req: Request<{}, {}, CreateSessionRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { filePath, options } = req.body;
            const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
            const session = await this.streamingService.createSession(resolvedPath, options);
            const response: ApiResponse<any> = {
                success: true,
                data: session,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    };

    prepareChunks = async (req: Request<{ sessionId: string }, {}, PrepareItemsRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const { indices } = req.body;
            const chunks = await this.streamingService.prepareChunks(sessionId, indices);
            const response: ApiResponse<any> = {
                success: true,
                data: chunks,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    handlePlaybackControl = async (req: Request<{ sessionId: string }, {}, PlaybackControlRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const result = await this.streamingService.handlePlaybackControl(sessionId, req.body);
            const response: ApiResponse<any> = {
                success: true,
                data: result,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getStreamMetadata = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const metadata = await this.streamingService.getStreamMetadata(sessionId);
            const response: ApiResponse<any> = {
                success: true,
                data: metadata,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    cleanupSession = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            await this.streamingService.cleanupSession(sessionId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    stream = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.streamingService.getSession(sessionId);

            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            if (session.mode === 'live') {
                const filePath = path.resolve(session.filePath);
                const outputFormat = session.outputFormat || 'mp3';
                const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';

                res.setHeader('Content-Type', mimeType);
                res.setHeader('Transfer-Encoding', 'chunked');
                res.removeHeader('Accept-Ranges');

                const args: string[] = [];

                // Raw input options before -i
                if (session.inputCodec) {
                    const codec = session.inputCodec;
                    const inputFormatMap: Record<string, string> = {
                        g711: 'mulaw',
                        g711a: 'alaw',
                        g726: 'g726',
                        g728: 'g728',
                        pcm_s16le: 's16le',
                        pcm_s24le: 's24le'
                    };
                    if (codec in inputFormatMap) {
                        args.push('-f', inputFormatMap[codec]!);
                    }

                    if (codec === 'g726' && session.bitrate) {
                        const codeSize = Math.floor(session.bitrate / 8);
                        args.push('-code_size', codeSize.toString());
                        args.push('-acodec', 'g726');
                        if (session.sampleRate) {
                            args.push('-sample_rate', session.sampleRate.toString());
                        }
                    } else if (codec === 'g711') {
                        args.push('-acodec', 'pcm_mulaw');
                    } else if (codec === 'g711a') {
                        args.push('-acodec', 'pcm_alaw');
                    } else if (codec === 'g728') {
                        args.push('-acodec', 'g728');
                    }

                    if (session.sampleRate && codec !== 'g726') {
                        args.push('-ar', session.sampleRate.toString());
                    }
                    if (session.channels) {
                        args.push('-ac', session.channels.toString());
                    }
                }

                args.push('-i', filePath);
                args.push('-map', '0:a:0');
                args.push('-vn');

                if (outputFormat === 'mp3') {
                    args.push('-acodec', 'libmp3lame');
                } else if (outputFormat === 'wav') {
                    args.push('-acodec', 'pcm_s16le');
                    if (session.sampleRate) {
                        args.push('-ar', session.sampleRate.toString());
                    }
                    if (session.channels) {
                        args.push('-ac', session.channels.toString());
                    }
                }
                // Stream + optionally save to file
                if (session.saveOutputPath) {
                    const savePath = path.resolve(session.saveOutputPath).replace(/\\/g, '/');
                    const saveDir = path.dirname(savePath);
                    if (!fs.existsSync(saveDir)) {
                        fs.mkdirSync(saveDir, { recursive: true });
                    }
                    const teeTarget = `[f=${outputFormat}]pipe:1|[f=${outputFormat}]${savePath}`;
                    args.push('-f', 'tee', teeTarget);
                } else {
                    args.push('-f', outputFormat);
                    args.push('pipe:1');
                }

                const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
                const cleanup = () => {
                    if (!ff.killed) {
                        ff.kill('SIGTERM');
                    }
                };
                res.on('close', cleanup);
                res.on('error', cleanup);

                ff.stdout.pipe(res);

                ff.stderr.on('data', (data: Buffer) => {
                    console.warn('FFmpeg stream:', data.toString());
                });

                ff.on('close', async (code) => {
                    if (code === 0 && session.saveOutputPath && session.fileId) {
                        try {
                            await prisma.mediaFile.update({
                                where: { id: session.fileId },
                                data: { decodedPath: path.resolve(session.saveOutputPath), status: 'ready' }
                            });
                        } catch (e) {
                            console.warn('Failed to update decodedPath after live stream:', e);
                        }
                    }
                });

                ff.on('error', (err) => {
                    console.error('FFmpeg stream error:', err);
                });

                return;
            }

            const filePath = path.resolve(session.filePath);
            const stat = await fs.promises.stat(filePath);
            const range = req.headers.range;

            const ext = path.extname(filePath).toLowerCase();
            const mimeType = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'application/octet-stream';

            if (!range) {
                res.writeHead(200, {
                    'Content-Length': stat.size,
                    'Content-Type': mimeType,
                    'Accept-Ranges': 'bytes'
                });
                fs.createReadStream(filePath).pipe(res);
                return;
            }

            const match = /^bytes=(\d+)-(\d*)$/.exec(range);
            if (!match) {
                res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
                return;
            }

            const start = parseInt(match[1]!, 10);
            const end = match[2] ? Math.min(parseInt(match[2], 10), stat.size - 1) : stat.size - 1;

            if (start >= stat.size || end < start) {
                res.writeHead(200, {
                    'Content-Length': stat.size,
                    'Content-Type': mimeType,
                    'Accept-Ranges': 'bytes'
                });
                fs.createReadStream(filePath).pipe(res);
                return;
            }

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Content-Type': mimeType
            });

            fs.createReadStream(filePath, { start, end }).pipe(res);
        } catch (error) {
            next(error);
        }
    };
}


