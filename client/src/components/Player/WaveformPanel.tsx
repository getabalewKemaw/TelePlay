
import { StreamingWaveform } from './StreamingWaveform'
import type { WaveformPanelProps } from '../../types/uiTypes'

export function WaveformPanel({
  useNativeAudio,
  audioRef,
  waveformRef,
  currentTime,
  duration,
  attachHiddenAudio,
  streamingPeaks,
  streamingDuration,
  showStreamingWaveform
}: WaveformPanelProps) {
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative group/ws cursor-pointer">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-coffee-50 via-white to-coffee-50 shadow-inner" />
      <div className="absolute inset-0 rounded-2xl opacity-20 bg-[linear-gradient(90deg,rgba(12,74,110,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(12,74,110,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
      {useNativeAudio ? (
        <div className="relative z-10 p-6">
          <audio ref={audioRef} className="w-full" controls />
        </div>
      ) : (
        <>
          {showStreamingWaveform && streamingPeaks && streamingDuration !== undefined ? (
            <div className="py-6 relative z-10">
              <StreamingWaveform
                peaks={streamingPeaks}
                duration={streamingDuration}
                currentTime={currentTime}
                baseColor="#989f9eff"
                progressColor="#0f172a"
                backgroundColor="#f8fafc"
              />
            </div>
          ) : (
            <div ref={waveformRef} className=" overflow-hidden py-6 relative z-10" />
          )}
          {attachHiddenAudio && <audio ref={audioRef} className="hidden" />}
        </>
      )}
      {!useNativeAudio && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none w-px bg-coffee-Dark/10 z-0"
          style={{ left: `${progressPct}%` }}
        />
      )}
    </div>
  )
}
