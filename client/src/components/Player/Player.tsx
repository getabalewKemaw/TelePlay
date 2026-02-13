import { cn } from '../../utils/utils'
import { PlayerFileCard } from './PlayerFileCard'
import { PlayerHeader } from './PlayerHeader'
import { WaveformPanel } from './WaveformPanel'
import { PlayerControlGrid } from './PlayerControlGrid'
import { MobileSeekBar } from './MobileSeekBar'
import { PlayerTransport } from './PlayerTransport'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { useFileStore } from '../../stores/useFileStore'
import { useFileActions } from '../../hooks/useFileActions'
import { useShallow } from 'zustand/shallow'
import { usePlayerEngine } from '../../hooks/usePlayerEngine'
import { isDirectPlayable } from '../../utils/appControllerUtils'

export function Player() {
  const {
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    handleDecodeAndPlay,
    handleDownload,
    handleConvertAndDownload,
    handlePlayPause
  } = usePlayerEngine()

  const selectedFile = useFileStore((state) => state.selectedFile)
  const { handleNext, handlePrev } = useFileActions()

  const {
    isDecoding,
    activeSession,
    playbackRate,
    volume,
    outputFormat,
    convertFormat,
    isConverting,
    waveformRef,
    audioRef,
    forceNativeAudio,
    isWaveformReady,
    isPlaying,
    currentTime,
    duration,
    streamingPeaks,
    streamingDuration,
    isChunkedStreaming,
    nativePlaying,
    nativeTime,
    nativeDuration,
    setOutputFormat,
    setConvertFormat
  } = usePlayerStore(useShallow((state) => ({
    isDecoding: state.isDecoding,
    activeSession: state.activeSession,
    playbackRate: state.playbackRate,
    volume: state.volume,
    outputFormat: state.outputFormat,
    convertFormat: state.convertFormat,
    isConverting: state.isConverting,
    waveformRef: state.waveformRef,
    audioRef: state.audioRef,
    forceNativeAudio: state.forceNativeAudio,
    isWaveformReady: state.isWaveformReady,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    streamingPeaks: state.streamingPeaks,
    streamingDuration: state.streamingDuration,
    isChunkedStreaming: state.isChunkedStreaming,
    nativePlaying: state.nativePlaying,
    nativeTime: state.nativeTime,
    nativeDuration: state.nativeDuration,
    setOutputFormat: state.setOutputFormat,
    setConvertFormat: state.setConvertFormat
  })))

  if (!selectedFile) return null

  const effectiveIsPlaying = (isChunkedStreaming || forceNativeAudio) ? nativePlaying : isPlaying
  const effectiveCurrentTime = (isChunkedStreaming || forceNativeAudio) ? nativeTime : currentTime
  const effectiveDuration = isChunkedStreaming
    ? (streamingDuration || nativeDuration)
    : (forceNativeAudio ? nativeDuration : duration)

  return (
    <div className="max-w-9xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PlayerFileCard
        selectedFile={selectedFile}
        isPlaying={effectiveIsPlaying}
        isDecoding={isDecoding}
        outputFormat={outputFormat}
        convertFormat={convertFormat}
        canDirectPlay={isDirectPlayable(selectedFile)}
        isConverting={isConverting}
        onDecodeAndPlay={() => handleDecodeAndPlay()}
        onDownload={handleDownload}
        onConvertAndDownload={handleConvertAndDownload}
        onOutputFormatChange={setOutputFormat}
        onConvertFormatChange={setConvertFormat}
      />

      <div className={cn(
        'bg-white/80 backdrop-blur-2xl p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-coffee-200/50 space-y-8 md:space-y-10 relative',
        'z-10'
      )}>
        <PlayerHeader
          activeSession={activeSession}
          isWaveformReady={isWaveformReady}
          playbackRate={playbackRate}
          onRateChange={handleRateChange}
        />

        <WaveformPanel
          useNativeAudio={forceNativeAudio}
          audioRef={audioRef}
          waveformRef={waveformRef}
          currentTime={effectiveCurrentTime}
          duration={effectiveDuration}
          attachHiddenAudio={!forceNativeAudio}
          streamingPeaks={streamingPeaks || undefined}
          streamingDuration={streamingDuration ?? undefined}
          showStreamingWaveform={!!isChunkedStreaming}
        />

        <PlayerControlGrid
          currentTime={effectiveCurrentTime}
          duration={effectiveDuration}
          volume={volume}
          onSeek={handleSeek}
          onSkip={handleSkip}
          onVolumeChange={handleVolumeChange}
        />

        <MobileSeekBar
          currentTime={effectiveCurrentTime}
          duration={effectiveDuration}
          onSeek={handleSeek}
        />

        <PlayerTransport
          currentTime={effectiveCurrentTime}
          duration={effectiveDuration}
          isPlaying={effectiveIsPlaying}
          volume={volume}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onVolumeChange={handleVolumeChange}
        />
      </div>
    </div>
  )
}
