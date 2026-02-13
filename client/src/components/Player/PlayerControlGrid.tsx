import { RotateCcw, RotateCw, Volume2 } from 'lucide-react'
import { formatTime } from '../../utils/utils'

interface PlayerControlGridProps {
  currentTime: number
  duration: number
  volume: number
  onSeek: (time: number) => void
  onSkip: (delta: number) => void
  onVolumeChange: (volume: number) => void
}

export function PlayerControlGrid({
  currentTime,
  duration,
  volume,
  onSeek,
  onSkip,
  onVolumeChange
}: PlayerControlGridProps) {
  return (
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
            className="w-12 h-12 bg-coffee-300 hover:bg-coffee-100 transition-colors flex items-center justify-center text-coffee-800 shadow-sm"
            title="Rewind 10s"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => onSkip(10)}
            className="w-12 h-12 bg-coffee-300 hover:bg-coffee-100 transition-colors flex items-center justify-center text-coffee-800 shadow-sm"
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
  )
}
