import { Target } from 'lucide-react';
import type { MediaFile } from '../../api/api'
import { getG726BitrateKbps } from '../appControllerUtils'



// dynamic chunk sizing based on file duration
// Change the parameter from a number to the MediaFile object
const getOptimalChunkSize = (targetfile: MediaFile) => {
  const duration = targetfile.duration;

  if (duration > 3600) return 30; 
  if (duration > 1800) return 20; 
  return 10;
};


export const getBaseName = (filename: string) => filename.replace(/\.[^/.]+$/, '')

export const getOutputPath = (filename: string, outputFormat: 'wav' | 'mp3') => {
  const outputDir = 'processed'
  const outputFilename = `${getBaseName(filename)}_decoded.${outputFormat}`
  return `${outputDir}/${outputFilename}`
}

export const inferCodec = (targetFile: MediaFile) => {
  const name = targetFile.filename.toLowerCase()
  const codec = (targetFile.codec || '').toLowerCase()
  if (codec.includes('alaw') || name.includes('alaw') || name.includes('g711a')) return 'g711a'
  if (codec.includes('mulaw') || name.includes('mulaw') || name.includes('g711u')) return 'g711'
  return targetFile.codec || 'g711'
}

export const buildDecodePayload = (targetFile: MediaFile, outputPath: string, outputFormat: 'wav' | 'mp3', inputPath?: string) => ({
  fileId: targetFile.id,
  input: { path: inputPath || targetFile.originalPath },
  output: { path: outputPath, format: outputFormat },
  codec: targetFile.codec || 'g711',
  sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
  channels: 1,
  bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined
})

export const buildStreamOptions = (targetFile: MediaFile, outputFormat: 'wav' | 'mp3', useChunkedStreaming: boolean) => {
  const inferredCodec = inferCodec(targetFile)
  const streamingOutputFormat = useChunkedStreaming ? 'mp3' : outputFormat
   const d=targetFile.duration;
  return {
    liveOptions: {
      transport: 'http',
      mode: 'live',
      outputFormat: streamingOutputFormat,
      inputCodec: inferredCodec,
      sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
      channels: 1,
      bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined,
      saveOutputPath: getOutputPath(targetFile.filename, outputFormat),
      fileId: targetFile.id,
      chunkDuration:d>3600?30:d>1800?20:10
    },
    fileOptions: {
      transport: 'http',
      mode: 'file-based'
    },
    chunkedOutputFormat: useChunkedStreaming ? 'mp3' : outputFormat
  }
}

