import { useState, useEffect, useRef, useMemo } from 'react'
import {
  AudioLines,
  FolderOpen,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FileAudio,
  Settings,
  Activity,
  Zap,
  Coffee,
  Download
} from 'lucide-react'
import { fetchFiles, createStreamingSession, decodeFile } from './api/api'
import type { MediaFile } from './api/api'
import { useWaveSurfer } from './hooks/useWaveSurfer'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function App() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [activeSession, setActiveSession] = useState<any>(null)

  const waveformRef = useRef<HTMLDivElement>(null)
  const waveformOptions = useMemo(() => ({
    waveColor: '#A67B5B',
    progressColor: '#6F4E37',
    cursorColor: '#3C2A21',
    barWidth: 2,
    barRadius: 3,
    responsive: true,
    height: 80,
  }), [])

  const { wavesurfer, isPlaying, playPause, currentTime, duration } = useWaveSurfer(waveformRef, waveformOptions)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const data = await fetchFiles()
      const filesArray = Array.isArray(data) ? data : (data?.files || [])
      setFiles(filesArray)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  }

  const handleFileSelect = (file: MediaFile) => {
    setSelectedFile(file)
  }

  const handleDecodeAndPlay = async () => {
    if (!selectedFile) return
    setIsDecoding(true)

    try {
      let finalPath = selectedFile.decodedPath

      if (!finalPath) {
        // 1. Decode the file to WAV if not already done
        const outputDir = 'processed'
        const timestamp = Date.now()
        const outputFilename = `${selectedFile.filename.split('.')[0]}_${timestamp}.wav`

        const decodeResult = await decodeFile({
          fileId: selectedFile.id,
          input: { path: selectedFile.originalPath },
          output: { path: `${outputDir}/${outputFilename}`, format: 'wav' },
          codec: selectedFile.codec || 'g711',
          sampleRate: selectedFile.codec === 'g728' ? 16000 : 8000,
          channels: 1,
          bitrate: selectedFile.codec === 'g726' ? 32 : undefined
        })
        finalPath = decodeResult.outputPath

        // Refresh file list to get the new decodedPath
        loadFiles()
      }

      // 2. Create a streaming session
      const session = await createStreamingSession(finalPath!)
      setActiveSession(session)

      // 3. Load in WaveSurfer
      const audioUrl = `http://localhost:3000/api/streaming/sessions/${session.sessionId}/stream`
      wavesurfer?.load(audioUrl)
      wavesurfer?.once('ready', () => {
        wavesurfer.play()
      })
    } catch (error) {
      console.error('Decode failed:', error)
      alert('Failed to decode file')
    } finally {
      setIsDecoding(false)
    }
  }

  const handleDownload = () => {
    if (!selectedFile) return
    window.open(`http://localhost:3000/api/files/${selectedFile.id}/download`, '_blank')
  }

  const pickDirectory = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('File System Access API not supported in this browser.')
        return
      }

      const directoryHandle = await (window as any).showDirectoryPicker()
      // Note: We can't actually pass the handle to the backend directly easily without a server-side path
      // But we can show we are "requesting access"
      // In a real local app, we'd use this to get paths
      alert(`Access granted to: ${directoryHandle.name}. (Frontend demo: In a real app, this would trigger path discovery on the server for this directory)`)

      // We can trigger a discovery on the server for the default uploads dir for now
      await loadFiles()
    } catch (error) {
      console.error('Directory picker cancelled or failed:', error)
    }
  }

  return (
    <div className="flex h-screen bg-coffee-50 text-coffee-Dark font-sans selection:bg-coffee-200">
      {/* Sidebar - File List */}
      <aside className="w-80 border-r border-coffee-200 bg-white/50 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-coffee-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-coffee-600 rounded-xl flex items-center justify-center shadow-lg shadow-coffee-600/20">
            <Coffee className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">I-Player</h1>
            <p className="text-xs text-coffee-400 font-medium uppercase tracking-widest">Media Lab</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="px-2 mb-4">
            <button
              onClick={pickDirectory}
              className="w-full py-2.5 px-4 bg-coffee-100 hover:bg-coffee-200 text-coffee-600 rounded-lg flex items-center justify-center gap-2 transition-all font-semibold text-sm border border-coffee-200"
            >
              <FolderOpen size={18} />
              Open Folder
            </button>
          </div>

          <div className="text-[10px] font-bold text-coffee-400 px-4 mb-2 uppercase tracking-widest">
            Media Files ({files?.length || 0})
          </div>

          {files?.map((file) => (
            <button
              key={file.id}
              onClick={() => handleFileSelect(file)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden",
                selectedFile?.id === file.id
                  ? "bg-coffee-600 text-white shadow-md shadow-coffee-600/30"
                  : "hover:bg-coffee-100 active:scale-[0.98]"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedFile?.id === file.id ? "bg-white/20" : "bg-coffee-50 text-coffee-400"
                )}>
                  <FileAudio size={20} />
                </div>
                <div className="flex-1 truncate">
                  <div className="font-medium text-sm truncate">{file.filename}</div>
                  <div className={cn(
                    "text-xs truncate opacity-70",
                    selectedFile?.id === file.id ? "text-coffee-50" : "text-coffee-400"
                  )}>
                    {file.codec?.toUpperCase()} • {file.format}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {(!files || files.length === 0) && (
            <div className="text-center py-10 px-4">
              <AudioLines className="w-12 h-12 text-coffee-200 mx-auto mb-3" />
              <p className="text-sm text-coffee-400 font-medium">No files found.<br />Open a folder to begin.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-coffee-100 bg-coffee-100/30">
          <div className="flex items-center gap-3 text-coffee-400 hover:text-coffee-600 transition-colors cursor-pointer">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-coffee-200/20 blur-3xl -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-coffee-accent/10 blur-3xl -z-10 rounded-full -translate-x-1/2 translate-y-1/2" />

        <header className="h-20 flex items-center justify-between px-8 border-b border-coffee-100 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold tracking-tight">System Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-coffee-400 uppercase tracking-tighter">Current User</div>
              <div className="text-sm font-bold text-coffee-600 uppercase">HP-USER</div>
            </div>
            <div className="w-10 h-10 bg-coffee-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center font-bold text-coffee-600 text-xs">
              GK
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12">
          {selectedFile ? (
            <div className="max-w-4xl mx-auto space-y-10">
              {/* File Info Card */}
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-coffee-200/50 border border-coffee-100 flex flex-col md:flex-row gap-8 items-center">
                <div className="w-32 h-32 bg-coffee-50 rounded-2xl flex items-center justify-center text-coffee-300 relative overflow-hidden">
                  <AudioLines size={64} className="relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-coffee-100/50 to-transparent" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="text-xs font-bold text-coffee-400 uppercase tracking-[0.2em] mb-2">Selected Media</div>
                  <h2 className="text-3xl font-black text-coffee-Dark mb-2 leading-tight">{selectedFile.filename}</h2>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge icon={<Activity size={14} />} label={selectedFile.codec?.toUpperCase() || 'PCM'} />
                    <Badge icon={<Zap size={14} />} label={`${selectedFile.duration || 0}s`} />
                    <Badge icon={<FolderOpen size={14} />} label={selectedFile.format || 'Unknown'} />
                  </div>
                </div>
                <div className="pt-4 md:pt-0 flex items-center gap-3">
                  <button
                    disabled={isDecoding}
                    onClick={handleDecodeAndPlay}
                    className={cn(
                      "px-8 py-4 bg-coffee-Dark text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-coffee-Dark/30 disabled:opacity-50 disabled:scale-100",
                    )}
                  >
                    {isDecoding ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Decoding Stream...
                      </>
                    ) : (
                      <>
                        <Play size={20} fill="currentColor" />
                        {selectedFile.decodedPath ? 'Play Processed' : 'Decode & Play'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className={cn(
                      "p-4 rounded-2xl font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg",
                      selectedFile.decodedPath
                        ? "bg-coffee-accent text-white shadow-coffee-accent/30"
                        : "bg-white text-coffee-400 border border-coffee-100 hover:bg-coffee-50"
                    )}
                    title={selectedFile.decodedPath ? "Download Decoded WAV" : "Download Original File"}
                  >
                    <Download size={24} />
                  </button>
                </div>
              </div>

              {/* Player Section */}
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-coffee-200/50 border border-coffee-100 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-coffee-400 uppercase tracking-widest">Live Stream Buffer</div>
                  {activeSession && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold border border-green-100">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      SESSION ACTIVE: {activeSession.sessionId.slice(0, 8)}
                    </div>
                  )}
                </div>
                <div ref={waveformRef} className="rounded-xl overflow-hidden py-4" />

                <div className="flex items-center justify-between pt-4 border-t border-coffee-50">
                  <div className="text-sm font-mono text-coffee-400 tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  <div className="flex items-center gap-6">
                    <button className="text-coffee-400 hover:text-coffee-600 transition-colors">
                      <SkipBack size={24} />
                    </button>
                    <button
                      onClick={playPause}
                      className="w-16 h-16 bg-coffee-500 hover:bg-coffee-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg shadow-coffee-500/20"
                    >
                      {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button className="text-coffee-400 hover:text-coffee-600 transition-colors">
                      <SkipForward size={24} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-coffee-100 rounded-full overflow-hidden">
                      <div className="h-full bg-coffee-400 w-2/3 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActionCard
                  title="Segmentation"
                  desc="Optimize for network chunks"
                  icon={<AudioLines size={24} />}
                  color="bg-coffee-400"
                />
                <ActionCard
                  title="Compression"
                  desc="Lossless package resize"
                  icon={<Zap size={24} />}
                  color="bg-coffee-accent"
                />
                <ActionCard
                  title="Analysis"
                  desc="Frequency spectrum report"
                  icon={<Activity size={24} />}
                  color="bg-coffee-Dark"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
              <div className="w-24 h-24 bg-coffee-100 rounded-[2.5rem] rotate-12 flex items-center justify-center text-coffee-300">
                <FileAudio size={48} className="-rotate-12" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-coffee-Dark mb-2">Ready for Discovery</h3>
                <p className="text-coffee-400 font-medium">Select a G.7xx file from the library to begin high-fidelity decoding and streaming.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Badge({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-coffee-50 text-coffee-600 rounded-full text-xs font-bold border border-coffee-100">
      {icon}
      <span>{label}</span>
    </div>
  )
}

function ActionCard({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg shadow-coffee-100/50 border border-coffee-50 hover:border-coffee-200 transition-all group hover:-translate-y-1 cursor-pointer">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 transition-transform group-hover:scale-110", color)}>
        {icon}
      </div>
      <h4 className="font-bold text-coffee-Dark mb-1">{title}</h4>
      <p className="text-xs text-coffee-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}
