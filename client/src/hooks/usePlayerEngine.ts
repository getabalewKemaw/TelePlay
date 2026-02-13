import { useEffect, useMemo } from 'react'
import { useNativeAudioState } from './playback/useNativeAudioState'
import { useWaveSurfer } from './useWaveSurfer'
import { usePlayerStore } from '../stores/usePlayerStore'
import { useShallow } from 'zustand/shallow'
import { useTransportControls } from './playback/useTransportControls'
import { useDecodeAndPlay } from './playback/useDecodeAndPlay'
import { useDownloadActions } from './playback/useDownloadActions'
import { useFileStore } from '../stores/useFileStore'
import { useFileActions } from './useFileActions'
export function usePlayerEngine() {
  const {
    audioRef,
    waveformRef,
    wavesurferRef,
    forceNativeAudio,
    isChunkedStreaming,
    useExternalAudio,
    volume,
    playbackRate,
    outputFormat,
    convertFormat,
    chunkSeekHandler,
    isWaveformReady: storeWaveformReady,
    currentTime: storeCurrentTime,
    duration: storeDuration,
    streamingDuration,
    setNativeStatus,
    setWaveformStatus,
    setWaveSurferRef,
    setPlaybackRate,
    setVolume,
    setIsDecoding,
    setActiveSession,
    setForceNativeAudio,
    setUseExternalAudio,
    setStreamingPeaks,
    setStreamingDuration,
    setIsChunkedStreaming,
    setChunkSeekHandler,
    setIsConverting
  } = usePlayerStore(useShallow((state) => ({
    audioRef: state.audioRef,
    waveformRef: state.waveformRef,
    wavesurferRef: state.wavesurferRef,
    forceNativeAudio: state.forceNativeAudio,
    isChunkedStreaming: state.isChunkedStreaming,
    useExternalAudio: state.useExternalAudio,
    volume: state.volume,
    playbackRate: state.playbackRate,
    outputFormat: state.outputFormat,
    convertFormat: state.convertFormat,
    chunkSeekHandler: state.chunkSeekHandler,
    isWaveformReady: state.isWaveformReady,
    currentTime: state.currentTime,
    duration: state.duration,
    streamingDuration: state.streamingDuration,
    setNativeStatus: state.setNativeStatus,
    setWaveformStatus: state.setWaveformStatus,
    setWaveSurferRef: state.setWaveSurferRef,
    setPlaybackRate: state.setPlaybackRate,
    setVolume: state.setVolume,
    setIsDecoding: state.setIsDecoding,
    setActiveSession: state.setActiveSession,
    setForceNativeAudio: state.setForceNativeAudio,
    setUseExternalAudio: state.setUseExternalAudio,
    setStreamingPeaks: state.setStreamingPeaks,
    setStreamingDuration: state.setStreamingDuration,
    setIsChunkedStreaming: state.setIsChunkedStreaming,
    setChunkSeekHandler: state.setChunkSeekHandler,
    setIsConverting: state.setIsConverting
  })))

  const {
    nativeTime: nativeTimeLocal,
    nativeDuration: nativeDurationLocal,
    nativePlaying: nativePlayingLocal
  } = useNativeAudioState({
    forceRaf: isChunkedStreaming,
    audioRef
  })

  useEffect(() => {
    setNativeStatus(nativeTimeLocal, nativeDurationLocal, nativePlayingLocal)
  }, [nativeTimeLocal, nativeDurationLocal, nativePlayingLocal, setNativeStatus])

  const waveformOptions = useMemo(() => ({
    waveColor: '#989f9eff',
    progressColor: '#0f172a',
    cursorColor: '#0f172a',
    barWidth: 3,
    barGap: 4,
    barRadius: 3,
    splitChannels: false,
    normalize: true,
    responsive: true,
    height: 80,
    backend: 'MediaElement',
    mediaControls: false
  }), [])

  const {
    wavesurferRef: hookWaveSurferRef,
    isWaveformReady,
    isPlaying,
    currentTime,
    duration
  } = useWaveSurfer(
    waveformRef,
    waveformOptions,
    !(forceNativeAudio || isChunkedStreaming)
  )

  useEffect(() => {
    if (hookWaveSurferRef !== wavesurferRef) {
      setWaveSurferRef(hookWaveSurferRef)
    }
  }, [hookWaveSurferRef, setWaveSurferRef, wavesurferRef])

  useEffect(() => {
    setWaveformStatus({
      isWaveformReady,
      isPlaying,
      currentTime,
      duration
    })
  }, [currentTime, duration, isPlaying, isWaveformReady, setWaveformStatus])

  const effectiveDuration = isChunkedStreaming
    ? (streamingDuration || nativeDurationLocal)
    : (forceNativeAudio ? nativeDurationLocal : storeDuration)
  const effectiveCurrentTime = (isChunkedStreaming || forceNativeAudio) ? nativeTimeLocal : storeCurrentTime

  const { playbackRate: rate, handleRateChange, handleSeek, handleSkip, handleVolumeChange } = useTransportControls({
    wavesurferRef,
    audioRef,
    currentTime: effectiveCurrentTime,
    duration: effectiveDuration,
    forceNativeAudio: forceNativeAudio || isChunkedStreaming,
    playbackRate,
    setPlaybackRate,
    setVolume,
    isChunkedStreaming,
    chunkSeekHandler
  })

  const handlePlayPause = () => {
    if (forceNativeAudio || isChunkedStreaming) {
      if (!audioRef.current) return
      if (nativePlayingLocal) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => undefined)
      }
      return
    }
    wavesurferRef.current?.playPause()
  }

  const { selectedFile, setSelectedFile } = useFileStore(useShallow((state) => ({
    selectedFile: state.selectedFile,
    setSelectedFile: state.setSelectedFile
  })))
  const { loadFiles } = useFileActions()

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
    setChunkSeekHandler,
    wavesurferRef,
    isWaveformReady: storeWaveformReady,
    audioRef
  })

  const { handleDownload, handleConvertAndDownload } = useDownloadActions({
    selectedFile,
    convertFormat,
    setIsConverting
  })

  useEffect(() => {
    if (!useExternalAudio || !audioRef?.current || !wavesurferRef.current) return
    try {
      wavesurferRef.current.setOptions({ media: audioRef.current })
    } catch (error) {
      console.warn('Waveform: Failed to sync external media', error)
     
    }
  }, [audioRef, useExternalAudio, wavesurferRef])

  useEffect(() => {
    if (wavesurferRef.current && isWaveformReady) {
      wavesurferRef.current.setVolume(volume)
    }
  }, [volume, wavesurferRef, isWaveformReady])

  return {
    playbackRate: rate,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    handleDecodeAndPlay,
    handleDownload,
    handleConvertAndDownload,
    handlePlayPause
  }
}
