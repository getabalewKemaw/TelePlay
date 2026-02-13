import type React from 'react'
import { useEffect, useRef, useState } from 'react'

interface NativeAudioOptions {
  forceRaf?: boolean
  audioRef?: React.RefObject<HTMLAudioElement | null>
}

export function useNativeAudioState(options: NativeAudioOptions = {}) {
  const internalRef = useRef<HTMLAudioElement>(null)
  const audioRef = options.audioRef ?? internalRef
  const [nativeTime, setNativeTime] = useState(0)
  const [nativeDuration, setNativeDuration] = useState(0)
  const [nativePlaying, setNativePlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let rafId: number | null = null

    // single source of truth for updating state
    const syncState = () => {
      setNativeTime(audio.currentTime || 0)
      setNativeDuration(audio.duration || 0)
      setNativePlaying(!audio.paused)

      // Only continue the high-speed loop if forceRaf is on AND music is playing
      if (options.forceRaf && !audio.paused) {
        rafId = requestAnimationFrame(syncState)
      }
    }

    const handlePlay = () => {
      setNativePlaying(true)
      if (options.forceRaf) rafId = requestAnimationFrame(syncState)
    }

    const handlePause = () => {
      setNativePlaying(false)
      if (rafId) cancelAnimationFrame(rafId)
    }

    // Standard events for metadata and manual seeking
    audio.addEventListener('timeupdate', syncState)
    audio.addEventListener('loadedmetadata', syncState)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', syncState)
      audio.removeEventListener('loadedmetadata', syncState)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [options.forceRaf,audioRef]) // Only re-run if the RAF setting changes

  return {
    audioRef,
    nativeTime,
    nativeDuration,
    nativePlaying
  }
}
