import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { createStreamingSession, decodeFile } from '../../api/api'
import type { MediaFile } from '../../api/api'
import { getDecodedFormat, getG726BitrateKbps, isDirectPlayable, isLargeFile } from '../../utils/appControllerUtils'

interface DecodeDeps {
  selectedFile: MediaFile | null
  outputFormat: 'wav' | 'mp3'
  setSelectedFile: (file: MediaFile | null) => void
  loadFiles: (quiet?: boolean) => Promise<void>
  setIsDecoding: (next: boolean) => void
  setActiveSession: (session: any) => void
  setForceNativeAudio: (next: boolean) => void
  wavesurferRef: React.MutableRefObject<any>
  isWaveformReady: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export function useDecodeAndPlay({
  selectedFile,
  outputFormat,
  setSelectedFile,
  loadFiles,
  setIsDecoding,
  setActiveSession,
  setForceNativeAudio,
  wavesurferRef,
  isWaveformReady,
  audioRef
}: DecodeDeps) {
  return useCallback(async (fileOverride?: MediaFile) => {
    const targetFile = fileOverride || selectedFile
    if (!targetFile) return

    const decodedFormat = getDecodedFormat(targetFile)
    const directPlayable = outputFormat === 'wav' && isDirectPlayable(targetFile)
    const hasPlayableOutput = decodedFormat === outputFormat || directPlayable
    setIsDecoding(true)
    const toastId = toast.loading(
      hasPlayableOutput
        ? 'Starting playback...'
        : `Converting to ${outputFormat.toUpperCase()}...`
    )

    try {
      let finalPath = (decodedFormat === outputFormat)
        ? targetFile.decodedPath
        : (directPlayable ? targetFile.originalPath : undefined)

      const wantsLiveTranscode = !finalPath && !directPlayable
      const useNativeAudio = isLargeFile(targetFile)
      setForceNativeAudio(useNativeAudio)

      if (!finalPath && decodedFormat && decodedFormat !== outputFormat && targetFile.decodedPath) {
        const outputDir = 'processed'
        const baseName = targetFile.filename.replace(/\.[^/.]+$/, '')
        const outputFilename = `${baseName}_decoded.${outputFormat}`
        const decodeResult = await decodeFile({
          fileId: targetFile.id,
          input: { path: targetFile.decodedPath },
          output: { path: `${outputDir}/${outputFilename}`, format: outputFormat }
        })
        finalPath = decodeResult.outputPath
        const updatedFile = { ...targetFile, decodedPath: finalPath }
        setSelectedFile(updatedFile)
        await loadFiles(true)
      }

      if (!finalPath && !wantsLiveTranscode) {
        const outputDir = 'processed'
        const baseName = targetFile.filename.replace(/\.[^/.]+$/, '')
        const outputFilename = `${baseName}_decoded.${outputFormat}`

        const decodeResult = await decodeFile({
          fileId: targetFile.id,
          input: { path: targetFile.originalPath },
          output: { path: `${outputDir}/${outputFilename}`, format: outputFormat },
          codec: targetFile.codec || 'g711',
          sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
          channels: 1,
          bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined
        })
        finalPath = decodeResult.outputPath
        const updatedFile = { ...targetFile, decodedPath: finalPath }
        setSelectedFile(updatedFile)

        await loadFiles(true)
      }

      const inferredCodec = (() => {
        const name = targetFile.filename.toLowerCase()
        const codec = (targetFile.codec || '').toLowerCase()
        if (codec.includes('alaw') || name.includes('alaw') || name.includes('g711a')) return 'g711a'
        if (codec.includes('mulaw') || name.includes('mulaw') || name.includes('g711u')) return 'g711'
        return targetFile.codec || 'g711'
      })()

      const sessionOptions = wantsLiveTranscode ? {
        transport: 'http',
        mode: 'live',
        outputFormat: outputFormat,
        inputCodec: inferredCodec,
        sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
        channels: 1,
        bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined,
        saveOutputPath: `processed/${targetFile.filename.replace(/\.[^/.]+$/, '')}_decoded.${outputFormat}`,
        fileId: targetFile.id
      } : {
        transport: 'http',
        mode: 'file-based'
      }

      const session = await createStreamingSession(wantsLiveTranscode ? targetFile.originalPath : finalPath!, sessionOptions)
      setActiveSession(session)

      const audioUrl = `http://localhost:3000/api/streaming/sessions/${session.sessionId}/stream`

      if (useNativeAudio) {
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play().catch(() => undefined)
          toast.success('Live playback started', { id: toastId })
        } else {
          toast.error('Audio engine unavailable.', { id: toastId })
        }
      } else {
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
      }

      if (!useNativeAudio) {
        const ws = wavesurferRef.current
        if (!ws) {
          toast.error('Waveform engine unavailable.', { id: toastId })
          return
        }

        const onReady = () => {
          ws.play()
          toast.success('Playback ready', { id: toastId })
          ws.un('ready', onReady)
        }

        const onError = (err: any) => {
          console.error("WaveSurfer error:", err)
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

    } catch (error) {
      console.error('Decode failed:', error)
      toast.error('Terminal error: Streaming failed.', { id: toastId })
    } finally {
      setIsDecoding(false)
    }
  }, [audioRef, isWaveformReady, loadFiles, outputFormat, selectedFile, setActiveSession, setForceNativeAudio, setIsDecoding, setSelectedFile, wavesurferRef])
}
