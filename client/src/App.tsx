import { useState, useEffect, useRef, useMemo } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { fetchFiles, createStreamingSession, decodeFile, discoverFiles, uploadFile } from './api/api'
import type { MediaFile } from './api/api'
import { useWaveSurfer } from './hooks/useWaveSurfer'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Player } from './components/Player/Player'
import { Music } from 'lucide-react'
export default function App() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [playbackRate, setPlaybackRate] = useState(1)

  const waveformRef = useRef<HTMLDivElement>(null)

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
  }), [])

  const { wavesurfer, isPlaying, playPause, currentTime, duration } = useWaveSurfer(waveformRef, waveformOptions)

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

  const isDirectPlayable = (file: MediaFile) => {
    const name = file.filename.toLowerCase()
    const format = (file.format || '').toLowerCase()
    return name.endsWith('.wav') || format === 'wav'
  }

  const handleFileSelect = (file: MediaFile) => {
    setSelectedFile(file)
    toast(`Focusing on ${file.filename}`, { icon: '🎯' })

  }

  const handleDecodeAndPlay = async (fileOverride?: MediaFile) => {
    const targetFile = fileOverride || selectedFile
    if (!targetFile) return

    const directPlayable = isDirectPlayable(targetFile)
    setIsDecoding(true)
    const toastId = toast.loading(
      targetFile.decodedPath || directPlayable ? 'Starting playback...' : 'Decoding high-fidelity signal...'
    )

    try {
      let finalPath = targetFile.decodedPath || (directPlayable ? targetFile.originalPath : undefined)
      if (!finalPath) {
        const outputDir = 'processed'
        const baseName = targetFile.filename.replace(/\.[^/.]+$/, '')
        const outputFilename = `${baseName}_decoded.wav`

        const decodeResult = await decodeFile({
          fileId: targetFile.id,
          input: { path: targetFile.originalPath },
          output: { path: `${outputDir}/${outputFilename}`, format: 'wav' },
          codec: targetFile.codec || 'g711',
          sampleRate: targetFile.codec === 'g728' ? 16000 : 8000,
          channels: 1,
          bitrate: targetFile.codec === 'g726' ? 32 : undefined
        })
        finalPath = decodeResult.outputPath
        // Important: Update the selected file locally so the UI reflects the change immediately
        const updatedFile = { ...targetFile, decodedPath: finalPath }
        setSelectedFile(updatedFile)

        await loadFiles(true)
      }

      const session = await createStreamingSession(finalPath!)
      setActiveSession(session)

      const audioUrl = `http://localhost:3000/api/streaming/sessions/${session.sessionId}/stream`

      if (!wavesurfer) {
        throw new Error("Waveform engine not initialized")
      }

      wavesurfer.load(audioUrl)

      const onReady = () => {
        wavesurfer.play()
        toast.success('Playback ready', { id: toastId })
        wavesurfer.un('ready', onReady)
      }

      const onError = (err: any) => {
        console.error("WaveSurfer error:", err)
        toast.error('Stream signal lost', { id: toastId })
        wavesurfer.un('error', onError)
      }

      wavesurfer.once('ready', onReady)
      wavesurfer.once('error', onError)

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
    if (!selectedFile || files.length <= 1) return
    const currentIndex = files.findIndex(f => f.id === selectedFile.id)
    const nextIndex = (currentIndex + 1) % files.length
    handleFileSelect(files[nextIndex])
  }

  const handlePrev = () => {
    if (!selectedFile || files.length <= 1) return
    const currentIndex = files.findIndex(f => f.id === selectedFile.id)
    const prevIndex = (currentIndex - 1 + files.length) % files.length
    handleFileSelect(files[prevIndex])
  }

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate)
      toast(`Time Warp: ${rate}x`, { icon: '⚡' })
    }
  }

  const pickDirectory = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast.error('Browser does not support Native File System API')
        return
      }

      // 1. "Think like expo camera": Ask permission via native dialog
      const dirHandle = await (window as any).showDirectoryPicker()
      const toastId = toast.loading(`Accessing vault: ${dirHandle.name}...`)

      // 2. Recursive scanner
      let fileCount = 0
      const processHandle = async (handle: any) => {
        if (handle.kind === 'file') {
          const file = await handle.getFile()
          const ext = file.name.split('.').pop()?.toLowerCase()

          // Only process relevant audio extensions
          if (['g711', 'g726', 'g728', 'wav', 'pcm'].includes(ext || '')) {
            // 3. Upload to "Sync" with server
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
      // Only show error if it wasn't a user cancellation
      if ((error as any).name !== 'AbortError') {
        toast.error('Access denied to local vault.')
      }
    }
  }

  return (
    <div className="flex h-screen bg-coffee-50 text-coffee-Dark font-sans selection:bg-coffee-200 overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#3C2A21',
          color: '#FFF',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }
      }} />

      <Sidebar
        files={files}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onPickDirectory={pickDirectory}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-coffee-300/10 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-coffee-accent/5 blur-[100px] -z-10 rounded-full -translate-x-1/2 translate-y-1/2" />

        <header className="h-20 flex items-center justify-between px-10 border-b border-coffee-100/50 bg-white/30 backdrop-blur-xl z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-coffee-400">Node Cluster: v1.0.4</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-[9px] font-black text-coffee-400 uppercase tracking-[0.15em]">Authenticated Operator</div>
              <div className="text-xs font-black text-coffee-600 uppercase tracking-tighter">G. Kemaw [I-PLAYER-ADMIN]</div>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden border-2 border-coffee-100 shadow-xl flex items-center justify-center font-black text-coffee-Dark text-sm">
              GK
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 thin-scrollbar">
          {selectedFile ? (
            <Player
              selectedFile={selectedFile}
              isDecoding={isDecoding}
              activeSession={activeSession}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackRate={playbackRate}
              wavesurfer={wavesurfer}
              waveformRef={waveformRef}
              canDirectPlay={isDirectPlayable(selectedFile)}
              onDecodeAndPlay={() => handleDecodeAndPlay()}
              onDownload={handleDownload}
              onPlayPause={playPause}
              onNext={handleNext}
              onPrev={handlePrev}
              onRateChange={handleRateChange}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-32 h-32 bg-white/50 backdrop-blur-xl rounded-[2.5rem] rotate-12 flex items-center justify-center text-coffee-200 shadow-2xl border border-white">
                <Music size={64} className="-rotate-12 animate-pulse" />
              </div>
              <div className="space-y-3 max-w-sm">
                <h3 className="text-3xl font-black text-coffee-Dark tracking-tighter">Signal Deadlock</h3>
                <p className="text-sm text-coffee-400 font-bold uppercase tracking-wider leading-relaxed">Select a terminal source from the left inventory to initiate primary decode sequence.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
