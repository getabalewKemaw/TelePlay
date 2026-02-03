import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';

export interface IFileService {
    /**
     * Scan a directory and discover new media files
     */
    discoverFiles(directoryPath: string): Promise<void>;

    /**
     * Get a list of files with filtering and sorting
     */
    listFiles(criteria: ListFilesRequestDto): Promise<{ files: any[]; total: number }>;

    /**
     * Get metadata for a specific file
     */
    getFileMetadata(id: string): Promise<any>;

    /**
     * Process a file (extract metadata and store in DB)
     */
    processFile(filePath: string): Promise<any>;

    /**
     * Register a newly uploaded file
     */
    registerFile(filename: string, filePath: string): Promise<any>;
}
