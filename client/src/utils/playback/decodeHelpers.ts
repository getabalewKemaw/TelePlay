import type { MediaFile } from '../../api/api'
import { getG726BitrateKbps } from '../appControllerUtils'

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
  if (codec === 'g726' || name.includes('g726')) return 'g726'
  if (codec === 'g728' || name.includes('g728')) return 'g728'
  if (codec === 'pcm_mulaw' || codec === 'pcm_alaw' || codec === 'adpcm_g726') return codec
  if (codec === 'gsm') {
    // Some raw .g711 files may be probed as gsm; default to g711 for decode path.
    return 'g711'
  }
  if (name.endsWith('.g711') || name.endsWith('.g711u') || name.endsWith('.g711a')) return 'g711'
  return targetFile.codec || 'g711'
}

export const buildDecodePayload = (targetFile: MediaFile, outputPath: string, outputFormat: 'wav' | 'mp3', inputPath?: string) => ({
  fileId: targetFile.id,
  input: { path: inputPath || targetFile.originalPath },
  output: { path: outputPath, format: outputFormat },
  codec: inferCodec(targetFile),
  sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
  channels: 1,
  bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined
})

export const buildStreamOptions = (targetFile: MediaFile, outputFormat: 'wav' | 'mp3', useChunkedStreaming: boolean) => {
  const inferredCodec = inferCodec(targetFile)
  const streamingOutputFormat = useChunkedStreaming ? 'mp3' : outputFormat
  const d = targetFile.duration
  return {
    liveOptions: {
      transport: 'http',
      mode: 'live',
      outputFormat: streamingOutputFormat,
      inputCodec: inferredCodec,
      sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
      channels: 1,
      bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined,
      // Background auto-decode handles persisted decoded files. Avoid concurrent writes during live stream.
      saveOutputPath: undefined,
      fileId: targetFile.id,
      chunkDuration: d > 3600 ? 30 : d > 1800 ? 20 : 10
    },
    fileOptions: {
      transport: 'http',
      mode: 'file-based'
    },
    chunkedOutputFormat: useChunkedStreaming ? 'mp3' : outputFormat
  }
}
