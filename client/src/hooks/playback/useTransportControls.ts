import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
interface TransportDeps {
  wavesurferRef: React.MutableRefObject<any>
  audioRef: React.RefObject<HTMLAudioElement | null>
  currentTime: number
  duration: number
  forceNativeAudio: boolean
  playbackRate: number
  setPlaybackRate: (next: number) => void
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
  playbackRate,
  setPlaybackRate,
  setVolume,
  isChunkedStreaming,
  chunkSeekHandler
}: TransportDeps) {
  const handleRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate)
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate)
      toast(`Time Warp: ${rate}x`)
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }, [audioRef, wavesurferRef, setPlaybackRate])

  const handleSeek = useCallback((time: number) => {
    const targetTime = Math.min(Math.max(time, 0), duration || 0)

    if (isChunkedStreaming && chunkSeekHandler) {
      chunkSeekHandler(targetTime)
      return
    }

    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = targetTime
      }
      return
    }
    
    wavesurferRef.current?.setTime(targetTime)
  }, [audioRef, chunkSeekHandler, duration, forceNativeAudio, isChunkedStreaming, wavesurferRef])

  const handleSkip = useCallback((delta: number) => {
    handleSeek(currentTime + delta)
  }, [handleSeek, currentTime])

  const handleVolumeChange = useCallback((nextVolume: number) => {
    setVolume(nextVolume)
    wavesurferRef.current?.setVolume(nextVolume)
    if (audioRef.current) {
      audioRef.current.volume = nextVolume
    }
  }, [audioRef, wavesurferRef,setVolume])

  return {
    playbackRate,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange
  }
}
