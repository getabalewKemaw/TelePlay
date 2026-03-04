import { useState } from 'react'
import {
  Activity,
  ChevronDown,
  Download,
  MoreVertical,
  Music,
  Play,
  Zap 
} from 'lucide-react'
import type { PlayerFileCardProps } from '../../types/uiTypes'
import { cn, formatTime, getDisplayFilename } from '../../utils/utils'
import { Badge } from '../ui/Badge'
export function PlayerFileCard({
  selectedFile,
  isPlaying,
  isDecoding,
  outputFormat,
  convertFormat,
  canDirectPlay,
  isConverting,
  onDecodeAndPlay,
  onDownload,
  onConvertAndDownload,
  onOutputFormatChange,
  onConvertFormatChange
}: PlayerFileCardProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const convertedDuartions = formatTime(selectedFile.duration)
  const isDecodedReady = !!selectedFile.decodedPath && selectedFile.status !== 'processing' && selectedFile.status !== 'error'
  const canPlaySelectedFormat = ((selectedFile.decodedPath || '').toLowerCase().endsWith(`.${outputFormat}`) || canDirectPlay) && (isDecodedReady || canDirectPlay)
  const decodeProgress = typeof selectedFile.decodeProgress === 'number'
    ? Math.max(0, Math.min(100, Math.round(selectedFile.decodeProgress)))
    : undefined

  return (
    <div className={cn(
      "bg-transparent md:bg-white/70 backdrop-blur-xl p-0 md:p-8 rounded-[2.5rem] md:shadow-2xl md:shadow-coffee-200/40 flex flex-col md:flex-row gap-6 md:gap-8 items-center relative overflow-visible md:overflow-hidden group transition-all",
      showMobileMenu ? "z-60" : "z-10"
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
        <h2 className="text-2xl md:text-4xl font-black text-coffee-Dark mb-3 md:mb-4 leading-none tracking-tight break-all">
          {getDisplayFilename(selectedFile.filename, selectedFile.decodedPath)}
        </h2>
        <div className="hidden md:flex flex-wrap gap-2 justify-center md:justify-start">
          <Badge icon={<Activity size={12} />} label={selectedFile.codec?.toUpperCase() || 'RAW'} />
          <Badge icon={<Zap size={12} />} label={`${convertedDuartions || 0}`} />
          {/* <Badge icon={<FolderOpen size={12} />} label={selectedFile.format || 'BINARY'} /> */}
        </div>
      </div>

      <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:items-end gap-2 relative z-50">
        <div className="md:hidden" />

        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-coffee-600 shadow-lg active:scale-95 transition-transform"
        >
          <MoreVertical size={20} />
        </button>

        {showMobileMenu && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 flex flex-col gap-1 md:hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[80]">
            <div className="px-3 py-2 text-[10px] font-black text-coffee-400 uppercase tracking-widest border-b border-coffee-100/50 mb-1">
              File Details
            </div>
            <div className="flex flex-wrap gap-2 px-2 pb-2">
              <Badge icon={<Activity size={12} />} label={selectedFile.codec?.toUpperCase() || 'RAW'} />
              <Badge icon={<Zap size={12} />} label={`${convertedDuartions || 0}`} />
              {/* <Badge icon={<FolderOpen size={12} />} label={selectedFile.format || 'BINARY'} /> */}
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
              ) : selectedFile.status === 'processing' ? (
                <>
                  <div className="w-4 h-4 bg-blue-400 animate-pulse rounded-full" />
                  <span className="text-xs font-bold">
                    {typeof decodeProgress === 'number' ? `Decoding ${decodeProgress}%` : 'Decoding...'}
                  </span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span className="text-xs font-bold">
                    {canPlaySelectedFormat
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
                    outputFormat === fmt ? "bg-white text-coffee-800 shadow-sm border" : "text-coffee-400"
                  )}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <div className="my-1 border-t border-coffee-100/50" />
            <div className="px-3 py-2 text-[10px] font-black text-coffee-400 uppercase tracking-widest">
              Convert Format
            </div>
            <div className="flex p-1 bg-coffee-50 rounded-xl">
              {(['aac', 'ogg', 'mp3', 'wav'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => onConvertFormatChange(fmt)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    convertFormat === fmt ? "bg-white text-coffee-800 shadow-sm border" : "text-coffee-400"
                  )}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                onConvertAndDownload()
                setShowMobileMenu(false)
              }}
              disabled={isConverting}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl hover:bg-coffee-50 text-coffee-700 flex items-center gap-3 transition-colors",
                isConverting && "opacity-60"
              )}
            >
              {isConverting ? (
                <>
                  <div className="w-4 h-4 bg-coffee-400 animate-pulse rounded-full" />
                  <span className="text-xs font-bold">Converting...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span className="text-xs font-bold">Convert & Download</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="hidden md:flex flex-col items-end gap-4">
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-start gap-2">
              <div className="text-[9px] font-black text-coffee-400 uppercase">Output Format</div>
              <div className="relative">
                <select
                  value={outputFormat}
                  onChange={(e) => onOutputFormatChange(e.target.value as 'wav' | 'mp3')}
                  className="bg-white/60 border border-coffee-200 shadow-sm pl-3 pr-8 py-2 text-[10px] font-black uppercase tracking-widest text-coffee-700 focus:outline-none focus:ring-0 focus:border-coffee-400 focus-visible:outline-none focus-visible:ring-0 hover:border-coffee-300 appearance-none"
                >
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-coffee-400" />
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <div className="text-[9px] font-black text-coffee-400 uppercase">Convert Format</div>
              <div className="relative">
                <select
                  value={convertFormat}
                  onChange={(e) => onConvertFormatChange(e.target.value as 'aac' | 'ogg' | 'mp3' | 'wav')}
                  className="bg-white/60 border border-coffee-200 shadow-sm pl-3 pr-8 py-2 text-[10px] font-black uppercase tracking-widest text-coffee-700 focus:outline-none focus:ring-0 focus:border-coffee-400 focus-visible:outline-none focus-visible:ring-0 hover:border-coffee-300 appearance-none"
                >
                  <option value="aac">AAC</option>
                  <option value="ogg">OGG</option>
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-coffee-400" />
              </div>
            </div>
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
              ) : selectedFile.status === 'processing' ? (
                <>
                  <div className="w-5 h-5 bg-white/40 animate-pulse" />
                  {typeof decodeProgress === 'number' ? `Decoding ${decodeProgress}%` : 'Decoding...'}
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  {canPlaySelectedFormat
                    ? 'Play'
                    : `Decode & Play (${outputFormat.toUpperCase()})`}
                </>
              )}
            </button>

            <button
              onClick={onDownload}
              aria-disabled={selectedFile.status !== 'ready' || !selectedFile.decodedPath}
              className={cn(
                "p-5 font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg border",
                (selectedFile.status === 'ready' && selectedFile.decodedPath)
                  ? "bg-coffee-accent text-white shadow-coffee-accent/40"
                  : "bg-white text-coffee-400 hover:bg-coffee-50 shadow-sm opacity-60 cursor-not-allowed"
              )}
              title={selectedFile.status === 'ready' && selectedFile.decodedPath ? "Download HQ WAV" : "Decode first to download"}
            >
              <Download size={24} />
            </button>
            <button
              onClick={onConvertAndDownload}
              disabled={isConverting}
              className={cn(
                "px-6 py-5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg border",
                isConverting
                  ? "bg-coffee-100 text-coffee-400"
                  : "bg-white text-coffee-600 hover:bg-coffee-50"
              )}
              title="Convert and download"
            >
              {isConverting ? 'Converting...' : 'Convert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
