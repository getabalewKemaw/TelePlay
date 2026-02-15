import { fetchStreamingChunkPeaks, fetchStreamingChunks, fetchStreamingSegments } from '../../api/api'
import type { StartChunkedPlaybackArgs } from '../../types/chunkingtypes';
const API_BASE_URL=import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const clamp = (time: number, duration: number) => Math.min(Math.max(time, 0), duration || 0)
export async function startChunkedPlayback({
  sessionId,
  chunkDuration = 10,
  chunkedOutputFormat,
  audioRef,
  chunkSessionRef,
  seekDebounceRef,
  setStreamingDuration,
  setStreamingPeaks,
  setChunkSeekHandler
}: StartChunkedPlaybackArgs) {
  if (!audioRef.current) return false
  if (chunkSessionRef.current.abort) {
    chunkSessionRef.current.abort.abort()
  }
  if (chunkSessionRef.current.mediaUrl) {
    URL.revokeObjectURL(chunkSessionRef.current.mediaUrl)
  }
  const chunks = await fetchStreamingChunks(sessionId)
  if (!Array.isArray(chunks) || chunks.length === 0) return false
  const segments = await fetchStreamingSegments(sessionId).catch(() => [])
  const totalDuration = chunks[chunks.length - 1]?.endTime || 0
  const binsPerChunk = 100
  const totalBins = chunks.length * binsPerChunk
  setStreamingDuration(totalDuration)
  setStreamingPeaks(new Array(totalBins).fill(Number.NaN))
  const streamState = {
    requestId: 0,
    startFromIndex: 0,
    seekTime: 0
  }

// find which chunk containg the given timestamp(segmentation)
  const getChunkIndexForTime = (time: number) => {
    const safeTime = clamp(time, totalDuration)
    const indexFromChunks = chunks.findIndex((c: any) => c.startTime <= safeTime && c.endTime > safeTime)
    if (indexFromChunks >= 0) return indexFromChunks

    if (Array.isArray(segments) && segments.length > 0) {
      const segment = segments.find((s: any) => s.startTime <= safeTime && s.endTime > safeTime)
      if (segment?.chunks?.length) {
        const segmentChunk = segment.chunks.find((c: any) => c.startTime <= safeTime && c.endTime > safeTime)
        const segChunkIndex = segmentChunk?.index ?? segment.chunks[0]?.index
        if (typeof segChunkIndex === 'number') return segChunkIndex
      }
    }

    return Math.max(0, Math.min(chunks.length - 1, Math.floor(safeTime / chunkDuration)))
  }
  // intialize  media sources  and start fetching chunks sequntially 
  const startChunkPipeline = (startIndex: number, seekTime: number) => {
    streamState.requestId += 1
    const requestId = streamState.requestId
    streamState.startFromIndex = startIndex
    streamState.seekTime = seekTime
    const baseChunkStart = chunks[startIndex]?.startTime ?? 0
    chunkSessionRef.current.abort?.abort()
    if (chunkSessionRef.current.mediaUrl) {
      URL.revokeObjectURL(chunkSessionRef.current.mediaUrl)
    }
    const mediaSource = new MediaSource()
    const mediaUrl = URL.createObjectURL(mediaSource)
    chunkSessionRef.current = {
      sessionId,
      mediaUrl,
      abort: new AbortController(),
      isActive: true
    }

    if (!audioRef.current) return
    audioRef.current.src = mediaUrl
    audioRef.current.play().catch(() => undefined)

    mediaSource.addEventListener('sourceopen', async () => {
      if (requestId !== streamState.requestId) return

      const mime = 'audio/mpeg'
      if (!MediaSource.isTypeSupported(mime)) {
        throw new Error('MSE does not support audio/mpeg')
      }

      const sourceBuffer = mediaSource.addSourceBuffer(mime)
      sourceBuffer.mode = 'segments'
      sourceBuffer.timestampOffset = baseChunkStart
      if (totalDuration > 0) {
        try {
          mediaSource.duration = totalDuration
        } catch {
          // ignore duration set errors
        }
      }

      let index = startIndex
      let firstChunkAppended = false

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

      const appendChunk = async () => {
        if (requestId !== streamState.requestId) return
        if (index >= chunks.length) {
          try { mediaSource.endOfStream() } catch { /* ignore */ }
          return
        }

        fetchStreamingChunkPeaks(sessionId, index, binsPerChunk).then((peaks) => {
          if (Array.isArray(peaks)) {
            setStreamingPeaks((prev: number[] | null) => {
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

        const chunkUrl = `${API_BASE_URL}/api/streaming/sessions/${sessionId}/chunks/${index}/stream?format=${chunkedOutputFormat}`
        const response = await fetch(chunkUrl, { signal: chunkSessionRef.current.abort?.signal })
        if (!response.ok) throw new Error(`Chunk request failed: ${response.status}`)
        const buffer = await response.arrayBuffer()

        await waitForBuffer()
        if (requestId !== streamState.requestId) return
        sourceBuffer.appendBuffer(buffer)
        const onAppended = () => {
          sourceBuffer.removeEventListener('updateend', onAppended)
          if (requestId !== streamState.requestId) return
          if (!firstChunkAppended && audioRef.current) {
            firstChunkAppended = true
            const boundedSeek = clamp(streamState.seekTime, totalDuration || streamState.seekTime)
            try {
              audioRef.current.currentTime = Math.max(0.01, boundedSeek)
              audioRef.current.play().catch(() => undefined)
            } catch {
              // ignore seek errors during init
            }
          }
          index += 1
          appendChunk().catch(() => undefined)
        }
        sourceBuffer.addEventListener('updateend', onAppended)
      }
      appendChunk().catch(() => undefined)
    })
  }

  setChunkSeekHandler((time: number) => {
    if (seekDebounceRef.current) {
      clearTimeout(seekDebounceRef.current)
    }
    seekDebounceRef.current = setTimeout(() => {
      const targetIndex = getChunkIndexForTime(time)
      startChunkPipeline(targetIndex, time)
    }, 180)
  })

  startChunkPipeline(0, 0)
  return true
}
