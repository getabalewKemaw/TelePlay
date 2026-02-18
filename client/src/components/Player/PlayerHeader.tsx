import { useState } from 'react'
import { Gauge, HelpCircle } from 'lucide-react'
import { cn } from '../../utils/utils'

interface PlayerHeaderProps {
  activeSession: any
  isWaveformReady: boolean
  playbackRate: number
  streamProgressPercent?: number
  onRateChange: (rate: number) => void
}

export function PlayerHeader({
  activeSession,
  isWaveformReady,
  playbackRate,
  streamProgressPercent,
  onRateChange
}: PlayerHeaderProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-1">
        <div className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.2em] w-full md:w-auto">Signal Visualization</div>

        <div className="flex items-center gap-2 md:block">
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-coffee-50 hover:bg-coffee-100 text-coffee-600 border text-[10px] font-black transition-colors uppercase tracking-widest shadow-sm"
            >
              <Gauge size={14} />
              <span className="hidden md:inline">Speed: </span>{playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 bottom-15 mb-2 bg-white rounded-xl shadow-2xl p-2 min-w-[80px] z-[80] animate-in fade-in zoom-in-95 duration-200">
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => { onRateChange(s); setShowSpeedMenu(false) }}
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

          <div className="md:hidden relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-8 h-8 rounded-full bg-coffee-50 text-coffee-400 flex items-center justify-center border border-coffee-100 active:scale-95 transition-transform"
            >
              <HelpCircle size={14} />
            </button>
            {showInfo && (
              <div className="absolute mt-2 bg-white/95 backdrop-blur-xl shadow-2xl border border-white/50 min-w-[240px] z-[80] space-y-3 animate-in fade-in zoom-in-95 duration-200">
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

        <div className="hidden md:flex gap-3">
          {activeSession && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border-2 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span>L-STREAM: </span>{activeSession.sessionId.slice(0, 8)}
            </div>
          )}
          {activeSession && typeof streamProgressPercent === 'number' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border text-[9px] font-black uppercase tracking-wider shadow-sm">
              Stream {Math.max(0, Math.min(100, Math.round(streamProgressPercent)))}%
            </div>
          )}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm border',
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
  )
}
