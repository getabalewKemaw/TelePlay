import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';
export interface IFileService {
    discoverFiles(directoryPath: string): Promise<void>;
    listFiles(criteria: ListFilesRequestDto): Promise<{ files: any[]; total: number }>;
    getFileMetadata(id: string): Promise<any>;
    processFile(filePath: string): Promise<any>;
    registerFile(filename: string, filePath: string): Promise<any>;
}
