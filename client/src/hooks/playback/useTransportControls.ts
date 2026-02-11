import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'

interface TransportDeps {
  wavesurferRef: React.MutableRefObject<any>
  audioRef: React.RefObject<HTMLAudioElement | null>
  currentTime: number
  duration: number
  forceNativeAudio: boolean
  volume: number
  setVolume: (next: number) => void
  isChunkedStreaming: boolean
  chunkSeekHandler: ((time: number) => void) | null
}

export function useTransportControls({
  wavesurferRef,
  audioRef,
  currentTime,
  duration,
  forceNativeAudio,
  volume,
  setVolume,
  isChunkedStreaming,
  chunkSeekHandler
}: TransportDeps) {
  const [playbackRate, setPlaybackRate] = useState(1)

  const handleRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate)
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate)
      toast(`Time Warp: ${rate}x`)
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }, [audioRef, wavesurferRef])

  const handleSeek = useCallback((time: number) => {
    if (isChunkedStreaming && chunkSeekHandler) {
      const bounded = Math.min(Math.max(time, 0), duration || 0)
      chunkSeekHandler(bounded)
      return
    }

    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = time
      }
      return
    }
    if (!wavesurferRef.current) return
    const bounded = Math.min(Math.max(time, 0), duration || 0)
    wavesurferRef.current.setTime(bounded)
  }, [audioRef, chunkSeekHandler, duration, forceNativeAudio, isChunkedStreaming, wavesurferRef])

  const handleSkip = useCallback((delta: number) => {
    if (isChunkedStreaming && chunkSeekHandler) {
      const next = Math.min(Math.max(currentTime + delta, 0), duration || 0)
      chunkSeekHandler(next)
      return
    }

    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(Math.max(audioRef.current.currentTime + delta, 0), audioRef.current.duration || 0)
      }
      return
    }
    if (!wavesurferRef.current) return
    const next = Math.min(Math.max(currentTime + delta, 0), duration || 0)
    wavesurferRef.current.setTime(next)
  }, [audioRef, chunkSeekHandler, currentTime, duration, forceNativeAudio, isChunkedStreaming, wavesurferRef])

  const handleVolumeChange = useCallback((nextVolume: number) => {
    setVolume(nextVolume)
    wavesurferRef.current?.setVolume(nextVolume)
    if (audioRef.current) {
      audioRef.current.volume = nextVolume
    }
  }, [audioRef, wavesurferRef])

  return {
    playbackRate,
    setPlaybackRate,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange
  }
}
