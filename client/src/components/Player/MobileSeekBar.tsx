import React from 'react'
import { formatTime } from '../../utils/utils'

interface MobileSeekBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function MobileSeekBar({
  currentTime,
  duration,
  onSeek
}: MobileSeekBarProps) {
  return (
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
  )
}
