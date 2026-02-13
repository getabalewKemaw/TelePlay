import type React from 'react'

export type OutputFormat = 'wav' | 'mp3'
export type ConvertFormat = 'aac' | 'ogg' | 'mp3' | 'wav'

export interface PlayerState {
  isDecoding: boolean
  activeSession: any
  playbackRate: number
  volume: number
  outputFormat: OutputFormat
  convertFormat: ConvertFormat
  isConverting: boolean
  forceNativeAudio: boolean
  useExternalAudio: boolean
  streamingPeaks: number[] | null
  streamingDuration: number | null
  isChunkedStreaming: boolean
  chunkSeekHandler: ((time: number) => void) | null
  nativeTime: number
  nativeDuration: number
  nativePlaying: boolean
  isWaveformReady: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  audioRef: React.RefObject<HTMLAudioElement | null>
  waveformRef: React.RefObject<HTMLDivElement | null>
  wavesurferRef: React.MutableRefObject<any>
  setOutputFormat: (format: OutputFormat) => void
  setConvertFormat: (format: ConvertFormat) => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  setIsDecoding: (next: boolean) => void
  setActiveSession: (session: any) => void
  setIsConverting: (next: boolean) => void
  setForceNativeAudio: (next: boolean) => void
  setUseExternalAudio: (next: boolean) => void
  setStreamingPeaks: (next: number[] | null | ((prev: number[] | null) => number[] | null)) => void
  setStreamingDuration: (next: number | null) => void
  setIsChunkedStreaming: (next: boolean) => void
  setChunkSeekHandler: (handler: ((time: number) => void) | null) => void
  setNativeStatus: (time: number, duration: number, playing: boolean) => void
  setWaveformStatus: (status: { isWaveformReady: boolean, isPlaying: boolean, currentTime: number, duration: number }) => void
  setWaveSurferRef: (ref: React.MutableRefObject<any>) => void
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void
  setWaveformRef: (ref: React.RefObject<HTMLDivElement | null>) => void
}
