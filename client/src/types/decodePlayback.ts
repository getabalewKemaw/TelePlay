import type React from 'react'
import type { MediaFile } from '../api/api'
export interface DecodeDeps {
  selectedFile: MediaFile | null
  outputFormat: 'wav' | 'mp3'
  setSelectedFile: (file: MediaFile | null) => void
  loadFiles: (quiet?: boolean) => Promise<void>
  setIsDecoding: (next: boolean) => void
  setActiveSession: (session: any) => void
  setForceNativeAudio: (next: boolean) => void
  setUseExternalAudio: (next: boolean) => void
  setStreamingPeaks: (next: number[] | null | ((prev: number[] | null) => number[] | null)) => void
  setStreamingDuration: (next: number | null) => void
  setIsChunkedStreaming: (next: boolean) => void
  setChunkSeekHandler: (handler: ((time: number) => void) | null) => void
  wavesurferRef: React.MutableRefObject<any>
  isWaveformReady: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export interface ChunkSessionState {
  sessionId?: string
  abort?: AbortController
  mediaUrl?: string
  isActive?: boolean
}

