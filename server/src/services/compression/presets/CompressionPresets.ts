
//pre configured compression settings.
import type { CompressionPreset } from '../../../types/compression/CompressionTypes.js';

export const COMPRESSION_PRESETS: CompressionPreset[] = [
  {
    name: 'fast',
    level: 'low',
    strategy: 'fast',
    targetBitrate: 128,
    description: 'Fast compression with minimal quality loss',
    useCase: 'Quick compression for preview or low-bandwidth streaming'
  },
  {
    name: 'balanced',
    level: 'medium',
    strategy: 'balanced',
    targetBitrate: 96,
    description: 'Balanced compression between size and quality',
    useCase: 'General purpose compression for most use cases'
  },
  {
    name: 'small',
    level: 'high',
    strategy: 'size',
    targetBitrate: 64,
    description: 'Maximum compression for smallest file size',
    useCase: 'Storage optimization or very low bandwidth scenarios'
  },
  {
    name: 'quality',
    level: 'low',
    strategy: 'quality',
    targetBitrate: 192,
    description: 'High quality compression with minimal size reduction',
    useCase: 'When quality is more important than file size'
  },
  {
    name: 'maximum',
    level: 'maximum',
    strategy: 'size',
    targetBitrate: 48,
    description: 'Maximum compression, smallest files, lowest quality',
    useCase: 'Extreme storage constraints or very low bandwidth'
  },
  {
    name: 'streaming',
    level: 'medium',
    strategy: 'balanced',
    targetBitrate: 80,
    description: 'Optimized for streaming with good quality',
    useCase: 'Live streaming or progressive download scenarios'
  },
  {
    name: 'archive',
    level: 'high',
    strategy: 'size',
    targetBitrate: 56,
    description: 'High compression for long-term storage',
    useCase: 'Archiving media files to save storage space'
  }
];


