
import type { ChunkSessionState } from './decodePlayback'
export interface StartChunkedPlaybackArgs {
  sessionId: string
  chunkDuration?: number
  chunkedOutputFormat: 'wav' | 'mp3'
  audioRef: React.RefObject<HTMLAudioElement | null>
  chunkSessionRef: React.MutableRefObject<ChunkSessionState>
  seekDebounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  setStreamingDuration: (next: number | null) => void
  setStreamingPeaks: (next: number[] | null | ((prev: number[] | null) => number[] | null)) => void
  setChunkSeekHandler: (handler: ((time: number) => void) | null) => void
}

export const clamp = (time: number, duration: number) => Math.min(Math.max(time, 0), duration || 0)
