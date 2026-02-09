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
}

export function useTransportControls({
  wavesurferRef,
  audioRef,
  currentTime,
  duration,
  forceNativeAudio,
  volume,
  setVolume
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
    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = time
      }
      return
    }
    if (!wavesurferRef.current) return
    const bounded = Math.min(Math.max(time, 0), duration || 0)
    wavesurferRef.current.setTime(bounded)
  }, [audioRef, duration, forceNativeAudio, wavesurferRef])

  const handleSkip = useCallback((delta: number) => {
    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(Math.max(audioRef.current.currentTime + delta, 0), audioRef.current.duration || 0)
      }
      return
    }
    if (!wavesurferRef.current) return
    const next = Math.min(Math.max(currentTime + delta, 0), duration || 0)
    wavesurferRef.current.setTime(next)
  }, [audioRef, currentTime, duration, forceNativeAudio, wavesurferRef])

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
