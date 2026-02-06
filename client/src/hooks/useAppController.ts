import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { fetchFiles, createStreamingSession, decodeFile, uploadFile } from '../api/api'
import type { MediaFile } from '../api/api'
import { useWaveSurfer } from './useWaveSurfer'
import type { SortDir, SortKey } from '../components/FileTable/FileTable'

export function useAppController() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(0.9)
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3'>('wav')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDecoded, setFilterDecoded] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('filename')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [isTableOpen, setIsTableOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
    if (stored === 'dark') return true
    if (stored === 'light') return false
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const waveformRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [nativeTime, setNativeTime] = useState(0)
  const [nativeDuration, setNativeDuration] = useState(0)
  const [nativePlaying, setNativePlaying] = useState(false)
  const [forceNativeAudio, setForceNativeAudio] = useState(false)

  const waveformOptions = useMemo(() => ({
    waveColor: '#2dd4bf',
    progressColor: '#0f172a',
    cursorColor: '#0f172a',
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    barHeight: 1,
    cursorWidth: 2,
    normalize: true,
    responsive: true,
    height: 120,
    backend: 'MediaElement',
    mediaControls: false,
  }), [])

  const { wavesurfer, wavesurferRef, isWaveformReady, isPlaying, playPause, currentTime, duration } = useWaveSurfer(waveformRef, waveformOptions, !forceNativeAudio)

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume)
    }
  }, [volume, wavesurferRef])

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

  useEffect(() => {
    loadFiles(true)
    const interval = setInterval(() => {
      loadFiles(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadFiles = async (quiet = false) => {
    try {
      const data = await fetchFiles()
      const filesArray = Array.isArray(data) ? data : (data?.files || [])
      setFiles(filesArray)
      if (!quiet) toast.success(`Inventory synchronized: ${filesArray.length} files detected.`)
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast.error('Inventory synchronization failed.')
    }
  }

  const filteredFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const base = files.filter(file => {
      const matchesSearch = term.length === 0 || file.filename.toLowerCase().includes(term)
      const matchesType = filterDecoded ? !!file.decodedPath : true
      return matchesSearch && matchesType
    })

    const sorted = [...base].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'duration') {
        return ((a.duration || 0) - (b.duration || 0)) * dir
      }
      const left = (a[sortKey] || '').toString().toLowerCase()
      const right = (b[sortKey] || '').toString().toLowerCase()
      if (left < right) return -1 * dir
      if (left > right) return 1 * dir
      return 0
    })

    return sorted
  }, [files, searchTerm, filterDecoded, sortKey, sortDir])

  const handleSortChange = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const isDirectPlayable = (file: MediaFile) => {
    const name = file.filename.toLowerCase()
    const format = (file.format || '').toLowerCase()
    return name.endsWith('.wav') || format === 'wav'
  }

  const isLargeFile = (file: MediaFile) => {
    const size = typeof file.fileSize === 'string' ? parseInt(file.fileSize, 10) : (file.fileSize as any)
    return Number.isFinite(size) && size > 200 * 1024 * 1024
  }

  const getDecodedFormat = (file: MediaFile) => {
    const decodedPath = file.decodedPath?.toLowerCase() || ''
    if (decodedPath.endsWith('.mp3')) return 'mp3'
    if (decodedPath.endsWith('.wav')) return 'wav'
    return undefined
  }

  const handleFileSelect = (file: MediaFile) => {
    setSelectedFile(file)
    toast(`Focusing on ${file.filename}`, { icon: '🎯' })
  }

  const handleDecodeAndPlay = async (fileOverride?: MediaFile) => {
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
      const useNativeAudio = wantsLiveTranscode || isLargeFile(targetFile)
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
          bitrate: targetFile.codec === 'g726' ? 32 : undefined
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
        bitrate: targetFile.codec === 'g726' ? 32 : undefined,
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
  }

  const handleDownload = () => {
    if (!selectedFile) return
    toast.success('Initiating secure download...')
    window.open(`http://localhost:3000/api/files/${selectedFile.id}/download`, '_blank')
  }

  const handleNext = () => {
    if (!selectedFile || filteredFiles.length <= 1) return
    const currentIndex = filteredFiles.findIndex(f => f.id === selectedFile.id)
    const nextIndex = (currentIndex + 1) % filteredFiles.length
    handleFileSelect(filteredFiles[nextIndex])
  }

  const handlePrev = () => {
    if (!selectedFile || filteredFiles.length <= 1) return
    const currentIndex = filteredFiles.findIndex(f => f.id === selectedFile.id)
    const prevIndex = (currentIndex - 1 + filteredFiles.length) % filteredFiles.length
    handleFileSelect(filteredFiles[prevIndex])
  }

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate)
      toast(`Time Warp: ${rate}x`, { icon: '⚡' })
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  const handleSeek = (time: number) => {
    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = time
      }
      return
    }
    if (!wavesurferRef.current) return
    const bounded = Math.min(Math.max(time, 0), duration || 0)
    wavesurferRef.current.setTime(bounded)
  }

  const handleSkip = (delta: number) => {
    if (forceNativeAudio) {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(Math.max(audioRef.current.currentTime + delta, 0), audioRef.current.duration || 0)
      }
      return
    }
    if (!wavesurferRef.current) return
    const next = Math.min(Math.max(currentTime + delta, 0), duration || 0)
    wavesurferRef.current.setTime(next)
  }

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume)
    wavesurferRef.current?.setVolume(nextVolume)
    if (audioRef.current) {
      audioRef.current.volume = nextVolume
    }
  }

  const pickDirectory = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast.error('Browser does not support Native File System API')
        return
      }

      const dirHandle = await (window as any).showDirectoryPicker()
      const toastId = toast.loading(`Accessing vault: ${dirHandle.name}...`)

      let fileCount = 0
      const processHandle = async (handle: any) => {
        if (handle.kind === 'file') {
          const file = await handle.getFile()
          const ext = file.name.split('.').pop()?.toLowerCase()

          if (['g711', 'g726', 'g728', 'wav', 'pcm'].includes(ext || '')) {
            await uploadFile(file)
            fileCount++
            toast.loading(`Syncing: ${file.name}`, { id: toastId })
          }
        } else if (handle.kind === 'directory') {
          for await (const entry of handle.values()) {
            await processHandle(entry)
          }
        }
      }

      await processHandle(dirHandle)

      toast.success(`Import complete: ${fileCount} new signals secured.`, { id: toastId })
      await loadFiles(true)

    } catch (error) {
      console.error('Directory access failed:', error)
      if ((error as any).name !== 'AbortError') {
        toast.error('Access denied to local vault.')
      }
    }
  }

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev)
  const toggleTable = () => setIsTableOpen((prev) => !prev)
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next ? 'dark' : 'light')
      }
      return next
    })
  }

  return {
    files,
    filteredFiles,
    selectedFile,
    isDecoding,
    activeSession,
    playbackRate,
    volume,
    outputFormat,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    isTableOpen,
    isSidebarCollapsed,
    isDarkMode,
    waveformRef,
    audioRef,
    nativeTime,
    nativeDuration,
    nativePlaying,
    forceNativeAudio,
    wavesurfer,
    wavesurferRef,
    isWaveformReady,
    isPlaying,
    currentTime,
    duration,
    setSearchTerm,
    setFilterDecoded,
    setOutputFormat,
    handleSortChange,
    handleFileSelect,
    handleDecodeAndPlay,
    handleDownload,
    handleNext,
    handlePrev,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    pickDirectory,
    playPause,
    toggleSidebar,
    toggleTable,
    toggleTheme,
    isDirectPlayable
  }
}
