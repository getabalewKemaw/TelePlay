import { promises as fs } from 'fs';
import path from 'path';
import { isDirectoryExists, AUDIO_EXTENSIONS } from '../../utils/fileUtils.js';

export const discoverAudioFiles = async (directoryPath: string): Promise<string[]> => {
  const dirExists = await isDirectoryExists(directoryPath);
  if (!dirExists) return [];

  const directoriesToScan: string[] = [directoryPath];
  const filesToProcess: string[] = [];

  while (directoriesToScan.length > 0) {
    const dir = directoriesToScan.shift();
    if (!dir) break;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          directoriesToScan.push(fullPath);
          continue;
        }
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (AUDIO_EXTENSIONS.includes(ext)) {
            filesToProcess.push(fullPath);
          }
        }
      }
    } catch (error) {
      // keep scanning other folders if one directory fails (e.g. permissions)
      console.error(`Skipping ${dir}:`, error);
    }
  }

  return filesToProcess;
};

export const fileDiscoveryService = {
  discoverAudioFiles
};

export type FileDiscoveryService = typeof fileDiscoveryService;
