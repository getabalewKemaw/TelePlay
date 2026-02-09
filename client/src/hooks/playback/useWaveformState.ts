import { useEffect, useMemo, useRef } from 'react'
import { useWaveSurfer } from '../useWaveSurfer'

interface WaveformStateOptions {
  volume: number
  disabled: boolean
}

export function useWaveformState({ volume, disabled }: WaveformStateOptions) {
  const waveformRef = useRef<HTMLDivElement>(null)
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
  }), [])

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
