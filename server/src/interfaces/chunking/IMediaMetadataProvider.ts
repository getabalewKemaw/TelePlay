
import type { MediaMetadata } from '../../types/chunking/ChunkingTypes.js';
export interface IMediaMetadataProvider {
  getMetadata(filePath: string): Promise<MediaMetadata>;
}
