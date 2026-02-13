import { create } from 'zustand'
import type { PlayerState } from '../types/playerStore'

export const usePlayerStore = create<PlayerState>((set) => ({
  isDecoding: false,
  activeSession: null,
  playbackRate: 1,
  volume: 0.9,
  outputFormat: 'wav',
  convertFormat: 'aac',
  isConverting: false,
  forceNativeAudio: false,
  useExternalAudio: false,
  streamingPeaks: null,
  streamingDuration: null,
  isChunkedStreaming: false,
  chunkSeekHandler: null,
  nativeTime: 0,
  nativeDuration: 0,
  nativePlaying: false,
  isWaveformReady: false,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  audioRef: { current: null },
  waveformRef: { current: null },
  wavesurferRef: { current: null },
  setOutputFormat: (format) => set({ outputFormat: format }),
  setConvertFormat: (format) => set({ convertFormat: format }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume }),
  setIsDecoding: (next) => set({ isDecoding: next }),
  setActiveSession: (session) => set({ activeSession: session }),
  setIsConverting: (next) => set({ isConverting: next }),
  setForceNativeAudio: (next) => set({ forceNativeAudio: next }),
  setUseExternalAudio: (next) => set({ useExternalAudio: next }),
  setStreamingPeaks: (next) => set((state) => ({
    streamingPeaks: typeof next === 'function' ? next(state.streamingPeaks) : next
  })),
  setStreamingDuration: (next) => set({ streamingDuration: next }),
  setIsChunkedStreaming: (next) => set({ isChunkedStreaming: next }),
  setChunkSeekHandler: (handler) => set({ chunkSeekHandler: handler }),
  setNativeStatus: (time, duration, playing) => set({ nativeTime: time, nativeDuration: duration, nativePlaying: playing }),
  setWaveformStatus: (status) => set({
    isWaveformReady: status.isWaveformReady,
    isPlaying: status.isPlaying,
    currentTime: status.currentTime,
    duration: status.duration
  }),
  setWaveSurferRef: (ref) => set({ wavesurferRef: ref }),
  setAudioRef: (ref) => set({ audioRef: ref }),
  setWaveformRef: (ref) => set({ waveformRef: ref })
}))
