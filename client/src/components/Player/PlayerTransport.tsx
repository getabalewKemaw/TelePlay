import { useState } from 'react'
import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { cn, formatTime } from '../../utils/utils'
import type { PlayerTransportProps } from '../../types/uiTypes'
export function PlayerTransport({
  currentTime,
  duration,
  isPlaying,
  volume,
  onPlayPause,
  onNext,
  onPrev,
  onSkip,
  onVolumeChange
}: PlayerTransportProps) {
  const [showVolume, setShowVolume] = useState(false)

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 pt-4 md:pt-6">
      <div className="hidden md:block text-xs md:text-sm font-black text-coffee-600 tabular-nums bg-coffee-50 px-4 py-2 rounded-full border tracking-tighter shadow-sm w-full md:w-auto text-center order-2 md:order-1">
        {formatTime(currentTime)} <span className="text-coffee-300 mx-1">/</span> {formatTime(duration)}
      </div>

      <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 order-1 md:order-2">
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

        <button
          onClick={() => onSkip(10)}
          className="md:hidden text-coffee-400 hover:text-coffee-600 active:scale-90 transition-transform relative flex items-center justify-center w-10 h-10"
        >
          <RotateCw size={35} strokeWidth={1.5} />
          <span className="absolute text-[8px] font-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-1">10</span>
        </button>

        <div className="md:hidden w-10" />
      </div>

      <div className="w-full md:w-32 flex flex-col items-center gap-1.5 opacity-50 order-3 md:order-3 hidden md:flex">
        <div className="flex flex-col items-center gap-1.5 w-full">
          <div className="text-[9px] font-black text-coffee-400 uppercase tracking-widest">Master Vol</div>
          <div className="w-full h-1.5 bg-coffee-100 rounded-full overflow-hidden">
            <div className="h-full bg-coffee-400 rounded-full" style={{ width: `${Math.round(volume * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
