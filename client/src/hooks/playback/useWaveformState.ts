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
  // const lastMediaSrc = useRef<string | null>(null)
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
    // media: useExternalAudio ? mediaRef?.current : undefined
  }), [])// we use []to ensure the wavesuffer renders ones as well
// intialize wave suffer 
  const { wavesurferRef, isWaveformReady, isPlaying, playPause, currentTime, duration } = useWaveSurfer(
    waveformRef,
    waveformOptions,
    !disabled
  )


  useEffect(() => {
    if (!useExternalAudio || !mediaRef?.current || !wavesurferRef.current) return

    const ws = wavesurferRef.current
    const media = mediaRef.current

    try {
      // Instead of .load(), we set the media element directly in the options
      // This is the most efficient way to sync WaveSurfer with a native <audio> tag
      ws.setOptions({ media })
    } catch (error) {
      console.warn('Waveform: Failed to sync external media', error)
    }

  })
  
 useEffect(() => {
    if (wavesurferRef.current && isWaveformReady) {
      wavesurferRef.current.setVolume(volume)
    }
  }, [volume, wavesurferRef, isWaveformReady])
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
