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
    Volume2,
    MoreVertical,
    HelpCircle,
    VolumeX,
    RotateCcw,
    RotateCw
} from 'lucide-react'
import type { MediaFile } from '../../api/api'
import { cn } from '../../utils/utils'
import { Badge } from '../ui/Badge'
import { formatTime } from '../../utils/utils'

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
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showVolume, setShowVolume] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const convertedDuartions = formatTime(selectedFile.duration);

    return (
        <div className="max-w-9xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* File Info Card */}
            <div className={cn(
                "bg-transparent md:bg-white/70 backdrop-blur-xl p-0 md:p-8 rounded-[2.5rem] md:shadow-2xl md:shadow-coffee-200/40 flex flex-col md:flex-row gap-6 md:gap-8 items-center relative overflow-visible md:overflow-hidden group transition-all",
                showMobileMenu ? "z-40" : "z-30"
            )}>
                <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block">

                    <Music size={120} className='border-4' />
                </div>

                <div className="w-28 h-28 md:w-40 md:h-40 bg-coffee-100/50 rounded-3xl flex items-center justify-center text-coffee-600 relative overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500">

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
                    <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] mb-2 md:mb-3">Master Reference</div>
                    <h2 className="text-2xl md:text-4xl font-black text-coffee-Dark mb-3 md:mb-4 leading-none tracking-tight break-all">{selectedFile.filename}</h2>
                    <div className="hidden md:flex flex-wrap gap-2 justify-center md:justify-start">
                        <Badge icon={<Activity size={12} />} label={selectedFile.codec?.toUpperCase() || 'RAW'} />
                        <Badge icon={<Zap size={12} />} label={`${convertedDuartions || 0}`} />
                        <Badge icon={<FolderOpen size={12} />} label={selectedFile.format || 'BINARY'} />
                    </div>
                </div>

                <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:items-end gap-2 relative z-50">
                    <div className="md:hidden">
                        {/* Spacer for alignment */}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="md:hidden w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-coffee-600 shadow-lg active:scale-95 transition-transform"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {/* Mobile Menu Dropdown */}
                    {showMobileMenu && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 flex flex-col gap-1 md:hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                            <div className="px-3 py-2 text-[10px] font-black text-coffee-400 uppercase tracking-widest border-b border-coffee-100/50 mb-1">
                                File Details
                            </div>
                            <div className="flex flex-wrap gap-2 px-2 pb-2">
                                <Badge icon={<Activity size={12} />} label={selectedFile.codec?.toUpperCase() || 'RAW'} />
                                <Badge icon={<Zap size={12} />} label={`${convertedDuartions || 0}`} />
                                <Badge icon={<FolderOpen size={12} />} label={selectedFile.format || 'BINARY'} />
                            </div>
                            <div className="px-3 py-2 text-[10px] font-black text-coffee-400 uppercase tracking-widest border-b border-coffee-100/50 mb-1">
                                Actions
                            </div>
                            <button
                                onClick={() => {
                                    onDecodeAndPlay()
                                    setShowMobileMenu(false)
                                }}
                                disabled={isDecoding}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-xl hover:bg-coffee-50 text-coffee-700 flex items-center gap-3 transition-colors",
                                    (selectedFile.decodedPath || canDirectPlay) && "bg-coffee-50 text-coffee-900"
                                )}
                            >
                                {isDecoding ? (
                                    <>
                                        <div className="w-4 h-4 bg-coffee-400 animate-pulse rounded-full" />
                                        <span className="text-xs font-bold">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} fill="currentColor" />
                                        <span className="text-xs font-bold">
                                            {((selectedFile.decodedPath || '').toLowerCase().endsWith(`.${outputFormat}`) || canDirectPlay)
                                                ? 'Play'
                                                : `Decode (${outputFormat.toUpperCase()})`}
                                        </span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    onDownload()
                                    setShowMobileMenu(false)
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-coffee-50 text-coffee-700 flex items-center gap-3 transition-colors"
                            >
                                <Download size={16} />
                                <span className="text-xs font-bold">Download File</span>
                            </button>
                            <div className="my-1 border-t border-coffee-100/50" />
                            <div className="px-3 py-2 text-[10px] font-black text-coffee-400 uppercase tracking-widest">
                                Output Format
                            </div>
                            <div className="flex p-1 bg-coffee-50 rounded-xl">
                                {(['wav', 'mp3'] as const).map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => onOutputFormatChange(fmt)}
                                        className={cn(
                                            "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                                            outputFormat === fmt ? "bg-white text-coffee-800 shadow-sm" : "text-coffee-400"
                                        )}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Desktop Actions (Hidden on Mobile) */}
                    <div className="hidden md:flex flex-col items-end gap-2">
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
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                disabled={isDecoding}
                                onClick={onDecodeAndPlay}
                                className={cn(
                                    "px-10 py-5 bg-coffee-Dark text-white font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-coffee-Dark/20 disabled:opacity-50 disabled:scale-100 uppercase text-xs tracking-widest",
                                    (selectedFile.decodedPath || canDirectPlay) && "bg-coffee-600 shadow-coffee-600/30"
                                )}
                            >
                                {isDecoding ? (
                                    <>
                                        <div className="w-5 h-5 bg-white/40 animate-pulse" />
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} fill="currentColor" />
                                        {((selectedFile.decodedPath || '').toLowerCase().endsWith(`.${outputFormat}`) || canDirectPlay)
                                            ? 'Play'
                                            : `Decode & Play (${outputFormat.toUpperCase()})`}
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onDownload}
                                className={cn(
                                    "p-5 font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg border",
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
                </div>
            </div>

            {/* Main Player Area */}
            <div className={cn(
                "bg-white/80 backdrop-blur-2xl p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-coffee-200/50 space-y-8 md:space-y-10 relative",
                (showSpeedMenu || showInfo || showVolume) ? "z-40" : "z-20"
            )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-1">
                        <div className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.2em] w-full md:w-auto">Signal Visualization</div>

                        <div className="flex items-center gap-2 md:block">
                            {/* Speed Control */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-coffee-50 hover:bg-coffee-100 text-coffee-600 border text-[10px] font-black transition-colors uppercase tracking-widest shadow-sm"
                                >
                                    <Gauge size={14} />
                                    <span className="hidden md:inline">Speed: </span>{playbackRate}x
                                </button>
                                {showSpeedMenu && (
                                    <div className="absolute right-0 bottom-15 mb-2 bg-white rounded-xl shadow-2xl p-2 min-w-[80px] z-[10] animate-in fade-in zoom-in-95 duration-200">
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

                            {/* Mobile Info Toggle */}
                            <div className="md:hidden relative " >
                                <button
                                    onClick={() => setShowInfo(!showInfo)}
                                    className="w-8 h-8 rounded-full bg-coffee-50 text-coffee-400 flex items-center justify-center border border-coffee-100 active:scale-95 transition-transform"
                                >
                                    <HelpCircle size={14} />
                                </button>
                                {showInfo && (
                                    <div className="absolute  mt-2 bg-white/95 backdrop-blur-xl  shadow-2xl border border-white/50 min-w-[240px] z-[80] space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="text-[10px] font-black text-coffee-400 uppercase tracking-widest border-b border-coffee-100 pb-2">Debug Info</div>
                                        {activeSession && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border-2 text-[9px] font-black uppercase tracking-wider shadow-sm">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                <span>L-STREAM: {activeSession.sessionId.slice(0, 8)}</span>
                                            </div>
                                        )}
                                        <div className={cn(
                                            'flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm border',
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
                                )}
                            </div>
                        </div>

                        {/* Desktop Badges (Always Visible) */}
                        <div className="hidden md:flex gap-3">
                            {activeSession && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700  border-2 text-[9px] font-black uppercase tracking-wider shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span>L-STREAM: </span>{activeSession.sessionId.slice(0, 8)}
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

                <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={() => onSkip(10)}
                                className="w-12 h-12  bg-coffee-300 hover:bg-coffee-100 transition-colors flex items-center justify-center text-coffee-800 shadow-sm"
                                title="Forward 10s"
                            >
                                <RotateCw size={18} />
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

                {/* Mobile Seek Slider (With Timestamps) */}
                <div className="md:hidden w-full px-2 flex items-center gap-3">
                    <span className="text-[10px] font-black text-coffee-400 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min={0}
                        max={Math.max(duration, 0.01)}
                        step={0.01}
                        value={Math.min(currentTime, duration || 0)}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="flex-1 accent-coffee-Dark h-1 bg-coffee-300 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-coffee-600 [&::-webkit-slider-thumb]:rounded-full"
                    />
                    <span className="text-[10px] font-black text-coffee-400 tabular-nums w-10">{formatTime(duration)}</span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 pt-4 md:pt-6">
                    <div className="hidden md:block text-xs md:text-sm font-black text-coffee-600 tabular-nums bg-coffee-50 px-4 py-2 rounded-full border tracking-tighter shadow-sm w-full md:w-auto text-center order-2 md:order-1">
                        {formatTime(currentTime)} <span className="text-coffee-300 mx-1">/</span> {formatTime(duration)}
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 order-1 md:order-2">
                        {/* Mobile Volume (Left) */}
                        <div className="md:hidden relative">
                            <button
                                onClick={() => setShowVolume(!showVolume)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95",
                                    showVolume ? "bg-coffee-600 text-white shadow-md" : "text-coffee-400 hover:bg-coffee-50"
                                )}
                            >
                                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            {showVolume && (
                                <div className="absolute bottom-full left-0 mb-4 bg-white/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/50 animate-in fade-in slide-in-from-bottom-2 z-50">
                                    <div className="h-32 w-8 relative flex justify-center">
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={volume}
                                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                            className="absolute top-0 left-0 h-full w-full -rotate-180 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-coffee-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-runnable-track]:w-2 [&::-webkit-slider-runnable-track]:bg-coffee-100 [&::-webkit-slider-runnable-track]:rounded-full"
                                            style={{
                                                writingMode: 'bt-lr',
                                                WebkitAppearance: 'slider-vertical'
                                            } as any}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Rewind */}
                        <button
                            onClick={() => onSkip(-10)}
                            className="md:hidden text-coffee-400 hover:text-coffee-600 active:scale-90 transition-transform relative flex items-center justify-center w-10 h-10"
                        >
                            <RotateCcw size={35} strokeWidth={1.5} />
                            <span className="absolute text-[8px] font-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-1">10</span>
                        </button>

                        <button
                            onClick={onPrev}
                            className="text-coffee-800 hover:text-coffee-600 transition-all hover:scale-110 active:scale-90"
                        >
                            <SkipBack size={24} className="md:w-7 md:h-7" />
                        </button>

                        <button
                            onClick={onPlayPause}
                            className="w-16 h-16 md:w-20 md:h-20 bg-coffee-Dark hover:bg-coffee-800 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-coffee-Dark/30"
                        >
                            {isPlaying ? <Pause size={28} className="md:w-9 md:h-9" fill="currentColor" /> : <Play size={28} className="md:w-9 md:h-9 ml-1" fill="currentColor" />}
                        </button>

                        <button
                            onClick={onNext}
                            className="text-coffee-800 hover:text-coffee-600 transition-all hover:scale-110 active:scale-90"
                        >
                            <SkipForward size={24} className="md:w-7 md:h-7" />
                        </button>

                        {/* Mobile Forward */}
                        <button
                            onClick={() => onSkip(10)}
                            className="md:hidden text-coffee-400 hover:text-coffee-600 active:scale-90 transition-transform relative flex items-center justify-center w-10 h-10"
                        >
                            <RotateCw size={35} strokeWidth={1.5} />
                            <span className="absolute text-[8px] font-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-1">10</span>
                        </button>

                        {/* Mobile Spacer (Right) */}
                        <div className="md:hidden w-10"></div>
                    </div>

                    <div className="w-full md:w-32 flex flex-col items-center gap-1.5 opacity-50 order-3 md:order-3 hidden md:flex">
                        {/* Desktop Volume Control */}
                        <div className="flex flex-col items-center gap-1.5 w-full">
                            <div className="text-[9px] font-black text-coffee-400 uppercase tracking-widest">Master Vol</div>
                            <div className="w-full h-1.5 bg-coffee-100 rounded-full overflow-hidden">
                                <div className="h-full bg-coffee-400 rounded-full" style={{ width: `${Math.round(volume * 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    )
}