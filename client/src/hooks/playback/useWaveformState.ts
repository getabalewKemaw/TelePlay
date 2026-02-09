import { useEffect, useMemo, useRef } from 'react'
import { useWaveSurfer } from '../useWaveSurfer'

interface WaveformStateOptions {
  volume: number
  disabled: boolean
  useExternalAudio?: boolean
  mediaRef?: React.RefObject<HTMLAudioElement | null>
}

export function useWaveformState({ volume, disabled, useExternalAudio, mediaRef }: WaveformStateOptions) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const lastMediaSrc = useRef<string | null>(null)
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
    mediaControls: false,
    media: useExternalAudio ? mediaRef?.current : undefined
  }), [mediaRef, useExternalAudio])

  const { wavesurferRef, isWaveformReady, isPlaying, playPause, currentTime, duration } = useWaveSurfer(
    waveformRef,
    waveformOptions,
    !disabled
  )

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume)
    }
  }, [volume, wavesurferRef])

  useEffect(() => {
    if (!useExternalAudio) return
    if (!mediaRef?.current) return
    if (!wavesurferRef.current) return
    try {
      const currentSrc = mediaRef.current.currentSrc || mediaRef.current.src
      if (currentSrc && currentSrc !== lastMediaSrc.current) {
        lastMediaSrc.current = currentSrc
        wavesurferRef.current.load(mediaRef.current as any)
      }
    } catch {
      // ignore load errors for streaming media elements
    }
  }, [mediaRef, useExternalAudio, wavesurferRef])

  return {
    waveformRef,
    wavesurferRef,
    isWaveformReady,
    isPlaying,
    playPause,
    currentTime,
    duration
  }
}
