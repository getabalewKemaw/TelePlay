import type React from 'react'
import type { MediaFile } from '../api/api'

export interface PlayerProps {
  selectedFile: MediaFile
  isDecoding: boolean
  activeSession: any
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  outputFormat: 'wav' | 'mp3'
  convertFormat: 'aac' | 'ogg' | 'mp3' | 'wav'
  waveformRef: React.RefObject<HTMLDivElement | null>
  audioRef?: React.RefObject<HTMLAudioElement | null>
  useNativeAudio?: boolean
  canDirectPlay: boolean
  isWaveformReady: boolean
  isConverting: boolean
  onDecodeAndPlay: () => void
  onDownload: () => void
  onConvertAndDownload: () => void
  onPlayPause: () => void
  onNext: () => void
  onPrev: () => void
  onRateChange: (rate: number) => void
  onSeek: (time: number) => void
  onSkip: (delta: number) => void
  onVolumeChange: (volume: number) => void
  onOutputFormatChange: (format: 'wav' | 'mp3') => void
  onConvertFormatChange: (format: 'aac' | 'ogg' | 'mp3' | 'wav') => void
}
