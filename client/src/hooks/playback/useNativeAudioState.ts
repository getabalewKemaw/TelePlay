import { useEffect, useRef, useState } from 'react'

export function useNativeAudioState() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [nativeTime, setNativeTime] = useState(0)
  const [nativeDuration, setNativeDuration] = useState(0)
  const [nativePlaying, setNativePlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setNativeTime(audio.currentTime || 0)
    const onDur = () => setNativeDuration(audio.duration || 0)
    const onPlay = () => setNativePlaying(true)
    const onPause = () => setNativePlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDur)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDur)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  return {
    audioRef,
    nativeTime,
    nativeDuration,
    nativePlaying
  }
}
