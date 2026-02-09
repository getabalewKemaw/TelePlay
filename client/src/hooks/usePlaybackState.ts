import { useState } from 'react'
import type { MediaFile } from '../api/api'
import { useNativeAudioState } from './playback/useNativeAudioState'
import { useWaveformState } from './playback/useWaveformState'
import { useTransportControls } from './playback/useTransportControls'
import { useDecodeAndPlay } from './playback/useDecodeAndPlay'
import { useDownloadActions } from './playback/useDownloadActions'

interface PlaybackDeps {
  selectedFile: MediaFile | null
  setSelectedFile: (file: MediaFile | null) => void
  loadFiles: (quiet?: boolean) => Promise<void>
}

export function usePlaybackState({
  selectedFile,
  setSelectedFile,
  loadFiles
}: PlaybackDeps) {
  const [isDecoding, setIsDecoding] = useState(false)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3'>('wav')
  const [convertFormat, setConvertFormat] = useState<'aac' | 'ogg' | 'mp3' | 'wav'>('aac')
  const [isConverting, setIsConverting] = useState(false)
  const [forceNativeAudio, setForceNativeAudio] = useState(false)
  const [volume, setVolume] = useState(0.9)
  const [useExternalAudio, setUseExternalAudio] = useState(false)
  const [streamingPeaks, setStreamingPeaks] = useState<number[] | null>(null)
  const [streamingDuration, setStreamingDuration] = useState<number | null>(null)
  const [isChunkedStreaming, setIsChunkedStreaming] = useState(false)

  const { audioRef, nativeTime, nativeDuration, nativePlaying } = useNativeAudioState({ forceRaf: isChunkedStreaming })

  const {
    waveformRef,
    wavesurferRef,
    isWaveformReady,
    isPlaying,
    playPause,
    currentTime,
    duration
  } = useWaveformState({ volume, disabled: forceNativeAudio || isChunkedStreaming, useExternalAudio, mediaRef: audioRef })

  const {
    playbackRate,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange
  } = useTransportControls({
    wavesurferRef,
    audioRef,
    currentTime,
    duration,
    forceNativeAudio: forceNativeAudio || isChunkedStreaming,
    volume,
    setVolume
  })

  const handleDecodeAndPlay = useDecodeAndPlay({
    selectedFile,
    outputFormat,
    setSelectedFile,
    loadFiles,
    setIsDecoding,
    setActiveSession,
    setForceNativeAudio,
    setUseExternalAudio,
    setStreamingPeaks,
    setStreamingDuration,
    setIsChunkedStreaming,
    wavesurferRef,
    isWaveformReady,
    audioRef
  })

  const { handleDownload, handleConvertAndDownload } = useDownloadActions({
    selectedFile,
    convertFormat,
    setIsConverting
  })

  return {
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
    handleDecodeAndPlay,
    handleDownload,
    handleConvertAndDownload,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    playPause,
    streamingPeaks,
    streamingDuration,
    isChunkedStreaming
  }
}
