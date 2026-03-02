import { useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { createStreamingSession, decodeFile } from '../../api/api'
import type { MediaFile } from '../../api/api'
import { getDecodedFormat, isDirectPlayable, isLargeFile } from '../../utils/appControllerUtils'
import { startChunkedPlayback } from '../../utils/playback/chunkedPlayback'
import { attachPlaybackAndStart } from '../../utils/playback/playbackAttach'
import { buildDecodePayload, buildStreamOptions, getOutputPath } from '../../utils/playback/decodeHelpers'
import type { ChunkSessionState, DecodeDeps } from '../../types/decodePlayback'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
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
  setChunkSeekHandler,
  wavesurferRef,
  audioRef
}: DecodeDeps) {
  const chunkSessionRef = useRef<ChunkSessionState>({})
  const seekDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(async (fileOverride?: MediaFile) => {
    const targetFile = fileOverride || selectedFile
    if (!targetFile) return

    if (seekDebounceRef.current) {
      clearTimeout(seekDebounceRef.current)
      seekDebounceRef.current = null
    }
    setChunkSeekHandler(null)

    const decodedFormat = getDecodedFormat(targetFile)
    const isDecodedReady = !!targetFile.decodedPath && targetFile.status !== 'processing' && targetFile.status !== 'error'
    const directPlayable = outputFormat === 'wav' && isDirectPlayable(targetFile)
    const hasPlayableOutput = (isDecodedReady && decodedFormat === outputFormat) || directPlayable
    setIsDecoding(true)
    const toastId = toast.loading(
      hasPlayableOutput ? 'Starting playback...' : `Converting to ${outputFormat.toUpperCase()}...`
    )

    try {
      let finalPath = (isDecodedReady && decodedFormat === outputFormat)
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
        setChunkSeekHandler(null)
      }

      if (!finalPath && isDecodedReady && decodedFormat && decodedFormat !== outputFormat && targetFile.decodedPath) {
        const convertedPath = getOutputPath(targetFile.filename, outputFormat)
        const decodeResult = await decodeFile({
          fileId: targetFile.id,
          input: { path: targetFile.decodedPath },
          output: { path: convertedPath, format: outputFormat }
        })
        finalPath = decodeResult.outputPath
        setSelectedFile({ ...targetFile, decodedPath: finalPath })
        await loadFiles(true)
      }

      if (!finalPath && !wantsLiveTranscode) {
        const decodePath = getOutputPath(targetFile.filename, outputFormat)
        const decodeResult = await decodeFile(buildDecodePayload(targetFile, decodePath, outputFormat))
        finalPath = decodeResult.outputPath
        setSelectedFile({ ...targetFile, decodedPath: finalPath })
        await loadFiles(true)
      }

      const { liveOptions, fileOptions, chunkedOutputFormat } = buildStreamOptions(targetFile, outputFormat, useChunkedStreaming)


      let session: any
      try {
        session = await createStreamingSession(
          wantsLiveTranscode ? targetFile.originalPath : finalPath!,
          wantsLiveTranscode ? liveOptions : fileOptions
        )
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
      const audioUrl = `${API_BASE_URL}/api/streaming/sessions/${session.sessionId}/stream`

      if (useChunkedStreaming && audioRef.current) {
        const started = await startChunkedPlayback({
          sessionId: session.sessionId,
          chunkDuration: session.chunkDuration || 10,
          chunkedOutputFormat,
          audioRef,
          chunkSessionRef,
          seekDebounceRef,
          setStreamingDuration,
          setStreamingPeaks,
          setChunkSeekHandler
        }).catch(() => false)

        if (started) {
          toast.success('Live chunk playback started', { id: toastId })
          return
        }
      }

      await attachPlaybackAndStart({
        useNativeAudio,
        audioUrl,
        audioRef,
        wavesurferRef,
        wantsLiveTranscode,
        toastId
      })
    } catch (error) {
      console.error('Decode failed:', error)
      toast.error('Terminal error: Streaming failed.', { id: toastId })
    } finally {
      setIsDecoding(false)
    }
  }, [
    audioRef,
    loadFiles,
    outputFormat,
    selectedFile,
    setActiveSession,
    setChunkSeekHandler,
    setForceNativeAudio,
    setIsChunkedStreaming,
    setIsDecoding,
    setSelectedFile,
    setStreamingDuration,
    setStreamingPeaks,
    setUseExternalAudio,
    wavesurferRef
  ])
}
