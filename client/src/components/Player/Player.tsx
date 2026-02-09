import React from 'react'
import type { PlayerProps } from '../../types/player'
import { cn } from '../../utils/utils'
import { PlayerFileCard } from './PlayerFileCard'
import { PlayerHeader } from './PlayerHeader'
import { WaveformPanel } from './WaveformPanel'
import { PlayerControlGrid } from './PlayerControlGrid'
import { MobileSeekBar } from './MobileSeekBar'
import { PlayerTransport } from './PlayerTransport'

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
  convertFormat,
  waveformRef,
  audioRef,
  useNativeAudio,
  canDirectPlay,
  isWaveformReady,
  isConverting,
  onDecodeAndPlay,
  onDownload,
  onConvertAndDownload,
  onPlayPause,
  onNext,
  onPrev,
  onRateChange,
  onSeek,
  onSkip,
  onVolumeChange,
  onOutputFormatChange,
  onConvertFormatChange
}: PlayerProps) {
  return (
    <div className="max-w-9xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PlayerFileCard
        selectedFile={selectedFile}
        isPlaying={isPlaying}
        isDecoding={isDecoding}
        outputFormat={outputFormat}
        convertFormat={convertFormat}
        canDirectPlay={canDirectPlay}
        isConverting={isConverting}
        onDecodeAndPlay={onDecodeAndPlay}
        onDownload={onDownload}
        onConvertAndDownload={onConvertAndDownload}
        onOutputFormatChange={onOutputFormatChange}
        onConvertFormatChange={onConvertFormatChange}
      />

      <div className={cn(
        "bg-white/80 backdrop-blur-2xl p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-coffee-200/50 space-y-8 md:space-y-10 relative",
        "z-10"
      )}>
        <PlayerHeader
          activeSession={activeSession}
          isWaveformReady={isWaveformReady}
          playbackRate={playbackRate}
          onRateChange={onRateChange}
        />

        <WaveformPanel
          useNativeAudio={useNativeAudio}
          audioRef={audioRef}
          waveformRef={waveformRef}
          currentTime={currentTime}
          duration={duration}
        />

        <PlayerControlGrid
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onSeek={onSeek}
          onSkip={onSkip}
          onVolumeChange={onVolumeChange}
        />

        <MobileSeekBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />

        <PlayerTransport
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          volume={volume}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onVolumeChange={onVolumeChange}
        />
      </div>
    </div>
  )
}
