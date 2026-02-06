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
    Gauge,
    Rewind,
    FastForward,
    Volume2
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
    volume: number
    outputFormat: 'wav' | 'mp3'
    wavesurfer: any
    waveformRef: React.RefObject<HTMLDivElement | null>
    audioRef?: React.RefObject<HTMLAudioElement | null>
    useNativeAudio?: boolean
    canDirectPlay: boolean
    isWaveformReady: boolean
    onDecodeAndPlay: () => void
    onDownload: () => void
    onPlayPause: () => void
    onNext: () => void
    onPrev: () => void
    onRateChange: (rate: number) => void
    onSeek: (time: number) => void
    onSkip: (delta: number) => void
    onVolumeChange: (volume: number) => void
    onOutputFormatChange: (format: 'wav' | 'mp3') => void
}

export function Player({
    selectedFile,
    isDecoding,
    activeSession,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    outputFormat,
    wavesurfer,
    waveformRef,
    audioRef,
    useNativeAudio,
    canDirectPlay,
    isWaveformReady,
    onDecodeAndPlay,
    onDownload,
    onPlayPause,
    onNext,
    onPrev,
    onRateChange,
    onSeek,
    onSkip,
    onVolumeChange,
    onOutputFormatChange
}: PlayerProps) {
    const [showSpeedMenu, setShowSpeedMenu] = useState(false)
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

    return (
        <div className="max-w-9xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* File Info Card */}
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-coffee-200/40 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 ">
                    <Music size={120} className='border-4'  />
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
                        <Music size={80} className="relative z-10 text-coffee-400" />
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

                <div className="pt-4 md:pt-0 flex flex-col md:flex-row items-center gap-4 z-10 w-full md:w-auto ">
                    <div className="flex md:hidden w-full items-center justify-between bg-white/60 rounded-2xl px-4 py-3 shadow-sm ">
                        <div className="text-[9px] font-black text-coffee-400 uppercase tracking-[0.2em] ">Output</div>
                        <div className="flex items-center gap-2">
                            {(['wav', 'mp3'] as const).map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => onOutputFormatChange(fmt)}
                                    className={cn(
                                        'px-3 py-1  text-[10px] font-black uppercase tracking-widest transition-colors ',
                                        outputFormat === fmt
                                            ? 'bg-coffee-Dark text-white'
                                            : 'bg-white text-coffee-400  hover:text-coffee-600'
                                    )}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-2 ">
                        <div className="text-[9px] font-black text-coffee-400 uppercase pt-10">Output Format</div>
                        <div className="flex items-center gap-2 bg-white/60  px-3 py-2 shadow-sm border">
                            {(['wav', 'mp3'] as const).map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => onOutputFormatChange(fmt)}
                                    className={cn(
                                        'px-3 py-1  text-[10px] font-black uppercase tracking-widest transition-colors',
                                        outputFormat === fmt
                                            ? 'bg-coffee-Dark text-white'
                                            : 'bg-white text-coffee-400 hover:text-coffee-600'
                                    )}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        disabled={isDecoding}
                        onClick={onDecodeAndPlay}
                        className={cn(
                            "px-10 py-5  bg-coffee-Dark text-white  font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-coffee-Dark/20 disabled:opacity-50 disabled:scale-100 uppercase text-xs tracking-widest ",
                            (selectedFile.decodedPath || canDirectPlay) && "bg-coffee-600 shadow-coffee-600/30"
                        )}
                    >
                        {isDecoding ? (
                            <>
                                <div className="w-5 h-5  bg-white/40 animate-pulse" />
                                Processing
                            </>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" 
                         />
                                {((selectedFile.decodedPath || '').toLowerCase().endsWith(`.${outputFormat}`) || canDirectPlay)
                                    ? 'Play'
                                    : `Decode & Play (${outputFormat.toUpperCase()})`}
                            </>
                        )}
                    </button>

                    <button
                        onClick={onDownload}
                        className={cn(
                            "p-5  font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg border",
                            selectedFile.decodedPath
                                ? "bg-coffee-accent text-white shadow-coffee-accent/40"
                                : "bg-white text-coffee-400 hover:bg-coffee-50 shadow-sm"
                        )}
                        title={selectedFile.decodedPath ? "Download HQ WAV" : "Download Original"}
                    >
                        <Download size={24} />
                    </button>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl shadow-coffee-200/50 space-y-10 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.2em]">Signal Visualization</div>
                        {activeSession && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700  border-2 text-[9px] font-black uppercase tracking-wider shadow-sm">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                L-STREAM ACTIVE: {activeSession.sessionId.slice(0, 8)}
                            </div>
                        )}
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-1  text-[9px] font-black uppercase tracking-wider shadow-sm border',
                            isWaveformReady
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                        )}>
                            <div className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isWaveformReady ? 'bg-emerald-500' : 'bg-amber-500'
                            )} />
                            Waveform {isWaveformReady ? 'Ready' : 'Loading'}
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-coffee-50 hover:bg-coffee-100 text-coffee-600 border text-[10px] font-black transition-colors uppercase tracking-widest shadow-sm"
                        >
                            <Gauge size={14} />
                            Speed: {playbackRate}x
                        </button>
                        {showSpeedMenu && (
                            <div className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-2xl p-2 min-w-[80px] z-50 animate-in fade-in zoom-in-95 duration-200">
                                {speeds.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { onRateChange(s); setShowSpeedMenu(false); }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-[10px] font-black  transition-colors tracking-widest",
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
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-coffee-50 via-white to-coffee-50 shadow-inner" />
                    <div className="absolute inset-0 rounded-2xl opacity-20 bg-[linear-gradient(90deg,rgba(12,74,110,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(12,74,110,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    {useNativeAudio ? (
                        <div className="relative z-10 p-6">
                            <audio ref={audioRef} className="w-full" controls />
                        </div>
                    ) : (
                        <div ref={waveformRef} className=" overflow-hidden py-6 relative z-10" />
                    )}
                    {!useNativeAudio && (
                        <div
                            className="absolute top-0 bottom-0 pointer-events-none w-px bg-coffee-Dark/10 z-0"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white/70 border p-6 shadow-sm">
                        <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.2em] mb-3">Timeline Control</div>
                        <input
                            type="range"
                            min={0}
                            max={Math.max(duration, 0.01)}
                            step={0.01}
                            value={Math.min(currentTime, duration || 0)}
                            onChange={(e) => onSeek(parseFloat(e.target.value))}
                            className="w-full accent-coffee-Dark"
                        />
                        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-coffee-400 uppercase tracking-widest">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="bg-white/70 border p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.2em] mb-1">Seek Assist</div>
                            <div className="text-xs font-bold text-coffee-600">Jump control</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onSkip(-10)}
                                className="w-12 h-12  bg-coffee-300 hover:bg-coffee-100 transition-colors flex items-center justify-center text-coffee-800 shadow-sm"
                                title="Rewind 10s"
                            >
                                <Rewind size={18}  />
                            </button>
                            <button
                                onClick={() => onSkip(10)}
                                className="w-12 h-12  bg-coffee-300 hover:bg-coffee-100 transition-colors flex items-center justify-center text-coffee-800 shadow-sm"
                                title="Forward 10s"
                            >
                                <FastForward size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/70 border p-6 shadow-sm">
                        <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.2em] mb-3">Master Volume</div>
                        <div className="flex items-center gap-3">
                            <Volume2 size={18} className="text-coffee-600" />
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                className="w-full accent-coffee-Dark"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                    <div className="text-sm font-black text-coffee-600 tabular-nums bg-coffee-50 px-4 py-2 rounded-full border tracking-tighter shadow-sm">
                        {formatTime(currentTime)} <span className="text-coffee-300 mx-1">/</span> {formatTime(duration)}
                    </div>

                    <div className="flex items-center gap-8">
                        <button
                            onClick={onPrev}
                            className="text-coffee-800 hover:text-coffee-600 transition-all hover:scale-110 active:scale-90"
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
                            className="text-coffee-800 hover:text-coffee-600 transition-all hover:scale-110 active:scale-90"
                        >
                            <SkipForward size={28} />
                        </button>
                    </div>

                    <div className="w-32 flex flex-col items-center gap-1.5 opacity-50">
                        <div className="text-[9px] font-black text-coffee-400 uppercase tracking-widest">Master Vol</div>
                        <div className="w-full h-1.5 bg-coffee-100 rounded-full overflow-hidden">
                            <div className="h-full bg-coffee-400 rounded-full" style={{ width: `${Math.round(volume * 100)}%` }} />
                        </div>
                    </div>
                </div>
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
