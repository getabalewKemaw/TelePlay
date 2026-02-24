import prisma from '../../lib/prisma.js';

type MediaFile = any;

export const findById = async (id: string): Promise<MediaFile | null> => {
  return prisma.mediaFile.findUnique({ where: { id } });
};

export const findFirstByPathFilters = async (pathFilters: any[]): Promise<MediaFile | null> => {
  return prisma.mediaFile.findFirst({
    where: {
      OR: pathFilters
    }
  });
};

export const findSourceFileByStem = async (sourceStem: string, audioExtensions: string[]): Promise<MediaFile | null> => {
  return prisma.mediaFile.findFirst({
    where: {
      OR: audioExtensions.map((ext) => ({
        filename: { equals: `${sourceStem}${ext}`, mode: 'insensitive' as const }
      }))
    },
    orderBy: { updatedAt: 'desc' }
  });
};

export const upsertWithMetadata = async (
  normalizedPath: string,
  filename: string,
  metadataResult: {
    duration?: number | null;
    fileSize?: number | null;
    format?: string | null;
    codec?: string | null;
    bitrate?: number | null;
  }
): Promise<MediaFile> => {
  return prisma.mediaFile.upsert({
    where: { originalPath: normalizedPath },
    create: {
      filename,
      originalPath: normalizedPath,
      duration: metadataResult.duration,
      fileSize: metadataResult.fileSize ? BigInt(metadataResult.fileSize) : null,
      format: metadataResult.format,
      codec: metadataResult.codec,
      bitrate: metadataResult.bitrate,
      status: 'pending',
      metadata: { decodeProgress: 0, decodeState: 'pending' } as any
    },
    update: {
      filename,
      duration: metadataResult.duration,
      fileSize: metadataResult.fileSize ? BigInt(metadataResult.fileSize) : null,
      format: metadataResult.format,
      codec: metadataResult.codec,
      bitrate: metadataResult.bitrate,
      status: 'pending',
      metadata: { decodeProgress: 0, decodeState: 'pending' } as any
    }
  });
};

export const upsertWithError = async (
  normalizedPath: string,
  filename: string,
  errorMessage: string
): Promise<MediaFile> => {
  return prisma.mediaFile.upsert({
    where: { originalPath: normalizedPath },
    create: {
      filename,
      originalPath: normalizedPath,
      duration: 0,
      status: 'error',
      metadata: { error: errorMessage } as any
    },
    update: {
      filename
    }
  });
};

export const updateStatusProcessing = async (
  id: string,
  progress: number,
  state: 'processing' | 'pending' = 'processing'
): Promise<void> => {
  await prisma.mediaFile.update({
    where: { id },
    data: {
      status: 'processing',
      metadata: {
        decodeProgress: progress,
        decodeState: state
      } as any
    }
  });
};

export const updateProgress = async (id: string, progress: number): Promise<void> => {
  await prisma.mediaFile.update({
    where: { id },
    data: {
      status: 'processing',
      metadata: {
        decodeProgress: progress,
        decodeState: 'processing'
      } as any
    }
  });
};

export const updateStatusReady = async (id: string, decodedPath?: string): Promise<void> => {
  await prisma.mediaFile.update({
    where: { id },
    data: {
      ...(decodedPath ? { decodedPath } : {}),
      status: 'ready',
      metadata: {
        decodeProgress: 100,
        decodeState: 'completed'
      } as any
    }
  });
};

export const updateStatusError = async (id: string, errorMessage: string): Promise<void> => {
  await prisma.mediaFile.update({
    where: { id },
    data: {
      status: 'error',
      metadata: {
        error: errorMessage,
        decodeState: 'failed'
      } as any
    }
  });
};

export const updateDecodedPathReady = async (id: string, decodedPath: string): Promise<void> => {
  await prisma.mediaFile.update({
    where: { id },
    data: {
      decodedPath,
      status: 'ready'
    }
  });
};

export const listFiles = async (queryOptions: any): Promise<MediaFile[]> => {
  return prisma.mediaFile.findMany(queryOptions);
};

export const countFiles = async (where: any): Promise<number> => {
  return prisma.mediaFile.count({ where });
};

export const fileRepository = {
  findById,
  findFirstByPathFilters,
  findSourceFileByStem,
  upsertWithMetadata,
  upsertWithError,
  updateStatusProcessing,
  updateProgress,
  updateStatusReady,
  updateStatusError,
  updateDecodedPathReady,
  listFiles,
  countFiles
};

export type FileRepository = typeof fileRepository;
