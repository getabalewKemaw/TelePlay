import type { MediaFile } from '../api/api'

export function isDirectPlayable(file: MediaFile) {
  const name = file.filename.toLowerCase()
  const format = (file.format || '').toLowerCase()
  return name.endsWith('.wav') || format === 'wav'
}

export function isLargeFile(file: MediaFile) {
  // Duration guard: files over 2 hours can crash WaveSurfer's in-memory decoder
  if (file.duration > 7200) return true
  const size = typeof file.fileSize === 'string' ? parseInt(file.fileSize, 10) : (file.fileSize as any)
  return Number.isFinite(size) && size > 100 * 1024 * 1024
}

export function getDecodedFormat(file: MediaFile) {
  const decodedPath = file.decodedPath?.toLowerCase() || ''
  if (decodedPath.endsWith('.mp3')) return 'mp3'
  if (decodedPath.endsWith('.wav')) return 'wav'
  if (decodedPath.endsWith('.aac')) return 'aac'
  if (decodedPath.endsWith('.ogg')) return 'ogg'
  return undefined
}

export function inferBaseSampleRate(file: MediaFile) {
  const codec = (file.codec || '').toLowerCase()
  if (codec === 'g728') return 16000
  if (codec === 'g711' || codec === 'g726') return 8000
  return 44100
}

export function inferBaseChannels(file: MediaFile) {
  const codec = (file.codec || '').toLowerCase()
  if (codec === 'g711' || codec === 'g726' || codec === 'g728') return 1
  return 2
}

export function getG726BitrateKbps(file: MediaFile) {
  const raw = file.bitrate
  if (!raw) return undefined
  const asNumber = typeof raw === 'string' ? parseInt(raw, 10) : raw
  if (!Number.isFinite(asNumber)) return undefined
  return asNumber >= 1000 ? Math.round(asNumber / 1000) : asNumber
}
