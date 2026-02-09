import { useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { createStreamingSession, decodeFile, fetchStreamingChunks, fetchStreamingChunkPeaks } from '../../api/api'
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
  setUseExternalAudio: (next: boolean) => void
  setStreamingPeaks: (next: number[] | null) => void
  setStreamingDuration: (next: number | null) => void
  setIsChunkedStreaming: (next: boolean) => void
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
  setUseExternalAudio,
  setStreamingPeaks,
  setStreamingDuration,
  setIsChunkedStreaming,
  wavesurferRef,
  isWaveformReady,
  audioRef
}: DecodeDeps) {
  const chunkSessionRef = useRef<{
    sessionId?: string
    abort?: AbortController
    mediaUrl?: string
    isActive?: boolean
  }>({})

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
      let useChunkedStreaming = wantsLiveTranscode
      const useNativeAudio = useChunkedStreaming ? false : isLargeFile(targetFile)
      setForceNativeAudio(useNativeAudio)
      setUseExternalAudio(useChunkedStreaming)
      setIsChunkedStreaming(useChunkedStreaming)
      if (!useChunkedStreaming) {
        setStreamingPeaks(null)
        setStreamingDuration(null)
      }

      if (useChunkedStreaming && !finalPath) {
        const outputDir = 'processed'
        const baseName = targetFile.filename.replace(/\.[^/.]+$/, '')
        const outputFilename = `${baseName}_decoded.${outputFormat}`
        decodeFile({
          fileId: targetFile.id,
          input: { path: targetFile.originalPath },
          output: { path: `${outputDir}/${outputFilename}`, format: outputFormat },
          codec: targetFile.codec || 'g711',
          sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
          channels: 1,
          bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined
        }).then(async (decodeResult) => {
          if (decodeResult?.outputPath) {
            const updatedFile = { ...targetFile, decodedPath: decodeResult.outputPath }
            setSelectedFile(updatedFile)
            loadFiles(true)

            // If chunked streaming is active, switch to file-based for waveform sync
            if (chunkSessionRef.current.isActive && audioRef.current) {
              try {
                const currentPlaybackTime = audioRef.current.currentTime || 0
                const fileSession = await createStreamingSession(decodeResult.outputPath, {
                  transport: 'http',
                  mode: 'file-based'
                })
                const fileAudioUrl = `http://localhost:3000/api/streaming/sessions/${fileSession.sessionId}/stream`

                // stop chunked stream
                chunkSessionRef.current.abort?.abort()
                if (chunkSessionRef.current.mediaUrl) {
                  URL.revokeObjectURL(chunkSessionRef.current.mediaUrl)
                }
                chunkSessionRef.current.isActive = false

                audioRef.current.src = fileAudioUrl
                audioRef.current.onloadedmetadata = () => {
                  audioRef.current!.currentTime = Math.min(currentPlaybackTime, audioRef.current!.duration || currentPlaybackTime)
                  audioRef.current!.play().catch(() => undefined)
                }
                setIsChunkedStreaming(false)
                setUseExternalAudio(false)
                setStreamingPeaks(null)
                setStreamingDuration(null)
              } catch {
                // ignore switch errors
              }
            }
          }
        }).catch(() => undefined)
      }

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

      const streamingOutputFormat = useChunkedStreaming ? 'mp3' : outputFormat
      const chunkedOutputFormat = useChunkedStreaming ? 'mp3' : outputFormat
      const liveOptions = {
        transport: 'http',
        mode: 'live',
        outputFormat: streamingOutputFormat,
        inputCodec: inferredCodec,
        sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
        channels: 1,
        bitrate: targetFile.codec === 'g726' ? (getG726BitrateKbps(targetFile) || 32) : undefined,
        saveOutputPath: `processed/${targetFile.filename.replace(/\.[^/.]+$/, '')}_decoded.${outputFormat}`,
        fileId: targetFile.id,
        chunkDuration: 10
      }
      const fileOptions = {
        transport: 'http',
        mode: 'file-based'
      }

      let session: any
      try {
        session = await createStreamingSession(wantsLiveTranscode ? targetFile.originalPath : finalPath!, wantsLiveTranscode ? liveOptions : fileOptions)
      } catch {
        if (!wantsLiveTranscode) {
          useChunkedStreaming = true
          setUseExternalAudio(true)
          session = await createStreamingSession(targetFile.originalPath, liveOptions)
        } else {
          throw new Error('Streaming session failed')
        }
      }
      setActiveSession(session)

      const audioUrl = `http://localhost:3000/api/streaming/sessions/${session.sessionId}/stream`

      if (useChunkedStreaming && audioRef.current) {
        try {
          if (chunkSessionRef.current.abort) {
            chunkSessionRef.current.abort.abort()
          }
          if (chunkSessionRef.current.mediaUrl) {
            URL.revokeObjectURL(chunkSessionRef.current.mediaUrl)
          }

          const chunks = await fetchStreamingChunks(session.sessionId)
          if (Array.isArray(chunks) && chunks.length > 0) {
            const totalDuration = chunks[chunks.length - 1]?.endTime || 0
            const binsPerChunk = 100
            const totalBins = chunks.length * binsPerChunk
            setStreamingDuration(totalDuration)
            setStreamingPeaks(new Array(totalBins).fill(Number.NaN))

            const mediaSource = new MediaSource()
            const mediaUrl = URL.createObjectURL(mediaSource)
            chunkSessionRef.current = { sessionId: session.sessionId, mediaUrl, abort: new AbortController(), isActive: true }
            audioRef.current.src = mediaUrl
            audioRef.current.play().catch(() => undefined)

            mediaSource.addEventListener('sourceopen', async () => {
              const mime = 'audio/mpeg'
              if (!MediaSource.isTypeSupported(mime)) {
                throw new Error('MSE does not support audio/mpeg')
              }
              const sourceBuffer = mediaSource.addSourceBuffer(mime)
              if (totalDuration > 0) {
                try {
                  mediaSource.duration = totalDuration
                } catch {
                  // ignore
                }
              }

              let index = 0
              const appendChunk = async () => {
                if (index >= chunks.length) {
                  try { mediaSource.endOfStream() } catch { /* ignore */ }
                  return
                }
                // load peaks for this chunk (server-generated)
                fetchStreamingChunkPeaks(session.sessionId, index, binsPerChunk).then((peaks) => {
                  if (Array.isArray(peaks)) {
                    setStreamingPeaks((prev) => {
                      if (!prev) return prev
                      const next = prev.slice()
                      const offset = index * binsPerChunk
                      for (let i = 0; i < binsPerChunk; i++) {
                        next[offset + i] = peaks[i] ?? Number.NaN
                      }
                      return next
                    })
                  }
                }).catch(() => undefined)

                const chunkUrl = `http://localhost:3000/api/streaming/sessions/${session.sessionId}/chunks/${index}/stream?format=${chunkedOutputFormat}`
                const response = await fetch(chunkUrl, { signal: chunkSessionRef.current.abort?.signal })
                const buffer = await response.arrayBuffer()

                const waitForBuffer = () => new Promise<void>((resolve) => {
                  if (!sourceBuffer.updating) {
                    resolve()
                    return
                  }
                  const onUpdate = () => {
                    sourceBuffer.removeEventListener('updateend', onUpdate)
                    resolve()
                  }
                  sourceBuffer.addEventListener('updateend', onUpdate)
                })

                await waitForBuffer()
                sourceBuffer.appendBuffer(buffer)

                const onAppended = () => {
                  sourceBuffer.removeEventListener('updateend', onAppended)
                  index += 1
                  appendChunk().catch(() => undefined)
                }
                sourceBuffer.addEventListener('updateend', onAppended)
              }

              appendChunk().catch(() => undefined)
            })

            toast.success('Live chunk playback started', { id: toastId })
            return
          }
        } catch {
          // fallback to continuous stream
        }
      }

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
  }, [audioRef, isWaveformReady, loadFiles, outputFormat, selectedFile, setActiveSession, setForceNativeAudio, setIsChunkedStreaming, setIsDecoding, setSelectedFile, setStreamingDuration, setStreamingPeaks, setUseExternalAudio, wavesurferRef])
}
