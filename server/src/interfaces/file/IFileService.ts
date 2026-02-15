import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';

export interface IFileService {
    discoverFiles(directoryPath: string): Promise<void>;
    listFiles(criteria: ListFilesRequestDto): Promise<{ files: FileMetadataDto[]; total: number }>;
    getFileMetadata(id: string): Promise<FileMetadataDto>;
    processFile(filePath: string): Promise<FileMetadataDto>;
    registerFile(filename: string, filePath: string): Promise<FileMetadataDto>;
}
