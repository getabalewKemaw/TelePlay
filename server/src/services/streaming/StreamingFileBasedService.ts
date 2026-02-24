import type { Response } from 'express';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';
import fs from 'fs';
import path from 'path';

export const streamFileBased = async (
  session: StreamingSession,
  range: string | undefined,
  res: Response
): Promise<void> => {
  const filePath = path.resolve(session.filePath);
  const stat = await fs.promises.stat(filePath);
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
};

export const streamingFileBasedService = {
  streamFileBased
};

export type StreamingFileBasedService = typeof streamingFileBasedService;
