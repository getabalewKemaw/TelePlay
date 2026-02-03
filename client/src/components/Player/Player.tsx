import React, { useState } from 'react'
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Activity,
    Zap,
    FolderOpen,
    Download,
    Music,
    Gauge
} from 'lucide-react'
import type { MediaFile } from '../../api/api'
import { cn, formatTime } from '../../utils/utils'
import { Badge } from '../ui/Badge'
import { ActionCard } from '../ui/ActionCard'

interface PlayerProps {
    selectedFile: MediaFile
    isDecoding: boolean
    activeSession: any
    isPlaying: boolean
    currentTime: number
    duration: number
    playbackRate: number
    wavesurfer: any
    waveformRef: React.RefObject<HTMLDivElement | null>
    onDecodeAndPlay: () => void
    onDownload: () => void
    onPlayPause: () => void
    onNext: () => void
    onPrev: () => void
    onRateChange: (rate: number) => void
}

export function Player({
    selectedFile,
    isDecoding,
    activeSession,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    wavesurfer,
    waveformRef,
    onDecodeAndPlay,
    onDownload,
    onPlayPause,
    onNext,
    onPrev,
    onRateChange
}: PlayerProps) {
    const [showSpeedMenu, setShowSpeedMenu] = useState(false)
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* File Info Card */}
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-coffee-200/40 border border-white flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Music size={120} />
                </div>

                <div className="w-40 h-40 bg-coffee-100/50 rounded-3xl flex items-center justify-center text-coffee-600 relative overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {isPlaying ? (
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="w-1.5 bg-coffee-600 rounded-full animate-music-bar"
                                    style={{
                                        height: '20px',
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <Music size={80} className="relative z-10 text-coffee-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] mb-3">Master Reference</div>
                    <h2 className="text-4xl font-black text-coffee-Dark mb-4 leading-none tracking-tight">{selectedFile.filename}</h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <Badge icon={<Activity size={12} />} label={selectedFile.codec?.toUpperCase() || 'RAW'} />
                        <Badge icon={<Zap size={12} />} label={`${selectedFile.duration?.toFixed(1) || 0}s`} />
                        <Badge icon={<FolderOpen size={12} />} label={selectedFile.format || 'BINARY'} />
                    </div>
                </div>

                <div className="pt-4 md:pt-0 flex items-center gap-4 z-10">
                    <button
                        disabled={isDecoding}
                        onClick={onDecodeAndPlay}
                        className={cn(
                            "px-10 py-5 bg-coffee-Dark text-white rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-coffee-Dark/20 disabled:opacity-50 disabled:scale-100 uppercase text-xs tracking-widest",
                            selectedFile.decodedPath && "bg-coffee-600 shadow-coffee-600/30"
                        )}
                    >
                        {isDecoding ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing
                            </>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" />
                                {selectedFile.decodedPath ? 'Launch Stream' : 'Decode & Launch'}
                            </>
                        )}
                    </button>

                    <button
                        onClick={onDownload}
                        className={cn(
                            "p-5 rounded-2xl font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg",
                            selectedFile.decodedPath
                                ? "bg-coffee-accent text-white shadow-coffee-accent/40"
                                : "bg-white text-coffee-400 border border-coffee-100 hover:bg-coffee-50"
                        )}
                        title={selectedFile.decodedPath ? "Download HQ WAV" : "Download Original"}
                    >
                        <Download size={24} />
                    </button>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl shadow-coffee-200/50 border border-white space-y-8 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.2em]">Signal Visualization</div>
                        {activeSession && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[9px] font-black border border-green-200/50 uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                L-STREAM ACTIVE: {activeSession.sessionId.slice(0, 8)}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-coffee-50 hover:bg-coffee-100 text-coffee-600 rounded-lg text-[10px] font-black transition-colors uppercase tracking-widest border border-coffee-100"
                        >
                            <Gauge size={14} />
                            Speed: {playbackRate}x
                        </button>
                        {showSpeedMenu && (
                            <div className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-2xl border border-coffee-100 p-2 min-w-[80px] z-50 animate-in fade-in zoom-in-95 duration-200">
                                {speeds.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { onRateChange(s); setShowSpeedMenu(false); }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-[10px] font-black rounded-lg transition-colors tracking-widest",
                                            playbackRate === s ? "bg-coffee-600 text-white" : "hover:bg-coffee-50 text-coffee-400"
                                        )}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative group/ws cursor-pointer">
                    <div ref={waveformRef} className="rounded-2xl overflow-hidden py-6" />
                    {/* Progress track line */}
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none border-l-2 border-coffee-Dark/10 z-0"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-coffee-100/50">
                    <div className="text-sm font-black text-coffee-600 tabular-nums bg-coffee-50 px-4 py-2 rounded-full border border-coffee-100 tracking-tighter">
                        {formatTime(currentTime)} <span className="text-coffee-300 mx-1">/</span> {formatTime(duration)}
                    </div>

                    <div className="flex items-center gap-8">
                        <button
                            onClick={onPrev}
                            className="text-coffee-300 hover:text-coffee-600 transition-all hover:scale-110 active:scale-90"
                        >
                            <SkipBack size={28} />
                        </button>
                        <button
                            onClick={onPlayPause}
                            className="w-20 h-20 bg-coffee-Dark hover:bg-coffee-800 text-white rounded-[2rem] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-coffee-Dark/30"
                        >
                            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                        </button>
                        <button
                            onClick={onNext}
                            className="text-coffee-300 hover:text-coffee-600 transition-all hover:scale-110 active:scale-90"
                        >
                            <SkipForward size={28} />
                        </button>
                    </div>

                    <div className="w-32 flex flex-col items-center gap-1.5 opacity-50">
                        <div className="text-[9px] font-black text-coffee-400 uppercase tracking-widest">Master Vol</div>
                        <div className="w-full h-1.5 bg-coffee-100 rounded-full overflow-hidden">
                            <div className="h-full bg-coffee-400 w-3/4 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
                <ActionCard
                    title="Neural Segmentation"
                    desc="Optimized packet loss concealment via chunking."
                    icon={<Activity size={24} />}
                    color="bg-coffee-400"
                />
                <ActionCard
                    title="LPC Compression"
                    desc="Predictive coding for extreme bandwidth efficiency."
                    icon={<Zap size={24} />}
                    color="bg-coffee-accent"
                />
                <ActionCard
                    title="Spectrum Insight"
                    desc="Fourier transform analysis of signal harmonics."
                    icon={<AudioLines size={24} />}
                    color="bg-coffee-Dark"
                />
            </div>
        </div>
    )
}

function AudioLines({ size, className }: { size: number, className?: string }) {
    return (
        <div className={cn("flex items-end gap-1", className)}>
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="bg-current rounded-full"
                    style={{
                        width: size / 8,
                        height: `${20 + Math.random() * 60}%`
                    }}
                />
            ))}
        </div>
    )
}
