import { useFileState } from './useFileState'

import { usePlayerStore } from '../stores/usePlayerStore'
import { usePlayerEngine } from './usePlayerEngine'
import { useUIStore } from '../stores/useUIStore'
import { useShallow } from 'zustand/shallow'
import { isDirectPlayable } from '../utils/appControllerUtils'

export function useAppController() {
  const {
    files,
    filteredFiles,
    selectedFile,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,

    loadFiles,
    setSearchTerm,
    setFilterDecoded,
    handleSortChange,
    handleFileSelect,
    handleNext,
    handlePrev,
    pickDirectory
  } = useFileState()

  const {
    isTableOpen,
    isSidebarCollapsed,
    isDarkMode,
    toggleSidebar,
    toggleTable,
    toggleTheme
  } = useUIStore(useShallow((state) => ({
    isTableOpen: state.isTableOpen,
    isSidebarCollapsed: state.isSidebarCollapsed,
    isDarkMode: state.isDarkMode,
    toggleSidebar: state.toggleSidebar,
    toggleTable: state.toggleTable,
    toggleTheme: state.toggleTheme
  })))

  const {
    isDecoding,
    activeSession,
    playbackRate,
    volume,
    outputFormat,
    convertFormat,
    isConverting,
    waveformRef,
    audioRef,
    nativeTime,
    nativeDuration,
    nativePlaying,
    forceNativeAudio,
    wavesurferRef,
    isWaveformReady,
    isPlaying,
    currentTime,
    duration,
    setOutputFormat,
    setConvertFormat,
    streamingPeaks,
    streamingDuration,
    isChunkedStreaming
  } = usePlayerStore(useShallow((state) => ({
    isDecoding: state.isDecoding,
    activeSession: state.activeSession,
    playbackRate: state.playbackRate,
    volume: state.volume,
    outputFormat: state.outputFormat,
    convertFormat: state.convertFormat,
    isConverting: state.isConverting,
    waveformRef: state.waveformRef,
    audioRef: state.audioRef,
    nativeTime: state.nativeTime,
    nativeDuration: state.nativeDuration,
    nativePlaying: state.nativePlaying,
    forceNativeAudio: state.forceNativeAudio,
    wavesurferRef: state.wavesurferRef,
    isWaveformReady: state.isWaveformReady,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    setOutputFormat: state.setOutputFormat,
    setConvertFormat: state.setConvertFormat,
    streamingPeaks: state.streamingPeaks,
    streamingDuration: state.streamingDuration,
    isChunkedStreaming: state.isChunkedStreaming
  })))

  const {
    handleDecodeAndPlay,
    handleDownload,
    handleConvertAndDownload,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    handlePlayPause
  } = usePlayerEngine()

  return {
    files,
    filteredFiles,
    selectedFile,
    isDecoding,
    activeSession,
    playbackRate,
    volume,
    outputFormat,
    convertFormat,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    isConverting,
    isTableOpen,
    isSidebarCollapsed,
    isDarkMode,
    waveformRef,
    audioRef,
    nativeTime,
    nativeDuration,
    nativePlaying,
    forceNativeAudio,
    wavesurferRef,
    isWaveformReady,
    isPlaying,
    currentTime,
    duration,
    setSearchTerm,
    setFilterDecoded,
    setOutputFormat,
    setConvertFormat,
    handleSortChange,
    handleFileSelect,
    handleDecodeAndPlay,
    handleDownload,
    handleConvertAndDownload,
    handleNext,
    handlePrev,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    pickDirectory,
    playPause: handlePlayPause,
    toggleSidebar,
    toggleTable,
    toggleTheme,
    isDirectPlayable,
    streamingPeaks,
    streamingDuration,
    isChunkedStreaming
  }
}
