import { toast } from 'react-hot-toast'
import type React from 'react'

interface AttachPlaybackArgs {
  useNativeAudio: boolean
  audioUrl: string
  audioRef: React.RefObject<HTMLAudioElement | null>
  wavesurferRef: React.MutableRefObject<any>
  isWaveformReady: boolean
  wantsLiveTranscode: boolean
  toastId: string
}

export async function attachPlaybackAndStart({
  useNativeAudio,
  audioUrl,
  audioRef,
  wavesurferRef,
  isWaveformReady,
  wantsLiveTranscode,
  toastId
}: AttachPlaybackArgs) {
  if (useNativeAudio) {
    if (audioRef.current) {
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(() => undefined)
      toast.success('Live playback started', { id: toastId })
      return
    }
    toast.error('Audio engine unavailable.', { id: toastId })
    return
  }

  const waitForWaveform = () => new Promise<void>((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      if (wavesurferRef.current && isWaveformReady) {
        resolve()
        return
      }
      if (Date.now() - start > 2000) {
        reject(new Error('Waveform not ready'))
        return
      }
      setTimeout(tick, 50)
    }
    tick()
  })

  try {
    await waitForWaveform()
  } catch {
    toast.error('Waveform is still loading. Try again in a moment.', { id: toastId })
    return
  }

  const ws = wavesurferRef.current
  if (!ws) {
    toast.error('Waveform engine unavailable.', { id: toastId })
    return
  }

  ws.stop()
  ws.load(audioUrl)

  const onReady = () => {
    ws.play()
    toast.success('Playback ready', { id: toastId })
    ws.un('ready', onReady)
  }

  const onError = (err: any) => {
    console.error('WaveSurfer error:', err)
    toast.error('Stream signal lost', { id: toastId })
    ws.un('error', onError)
  }

  if (wantsLiveTranscode) {
    setTimeout(() => {
      ws.play()
    }, 250)
    toast.success('Live playback started', { id: toastId })
  } else {
    ws.once('ready', onReady)
  }
  ws.once('error', onError)
}

