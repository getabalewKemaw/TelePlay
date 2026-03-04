import type { MediaFile } from "./fileTypes"
import type { SortKey,SortDir } from "../components/FileTable/FileTable"
export interface FileTableProps {
  files: MediaFile[]
  selectedId?: string | null
  sortKey: SortKey
  sortDir: SortDir
  onSortChange: (key: SortKey) => void
  onSelect: (file: MediaFile) => void
}




export interface PlayerFileCardProps {
  selectedFile: MediaFile
  isPlaying: boolean
  isDecoding: boolean
  outputFormat: 'wav' | 'mp3'
  convertFormat: 'aac' | 'ogg' | 'mp3' | 'wav'
  canDirectPlay: boolean
  isConverting: boolean
  onDecodeAndPlay: () => void
  onDownload: () => void
  onConvertAndDownload: () => void
  onOutputFormatChange: (format: 'wav' | 'mp3') => void
  onConvertFormatChange: (format: 'aac' | 'ogg' | 'mp3' | 'wav') => void
}

export interface PlayerTransportProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  onPlayPause: () => void
  onNext: () => void
  onPrev: () => void
  onSkip: (delta: number) => void
  onVolumeChange: (volume: number) => void
}


export interface StreamingWaveformProps {
  peaks: number[]
  duration: number
  currentTime: number
  baseColor?: string
  progressColor?: string
  backgroundColor?: string
}

export interface  WaveformPanelProps {
  useNativeAudio?: boolean
  audioRef?: React.RefObject<HTMLAudioElement | null>
  waveformRef: React.RefObject<HTMLDivElement | null>
  currentTime: number
  duration: number
  attachHiddenAudio?: boolean
  streamingPeaks?: number[]
  streamingDuration?: number
  showStreamingWaveform?: boolean
}