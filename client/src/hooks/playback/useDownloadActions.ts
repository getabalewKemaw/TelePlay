import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { transcodeFileDownload } from '../../api/api'
import type { MediaFile } from '../../api/api'
import { getDecodedFormat, inferBaseChannels, inferBaseSampleRate } from '../../utils/appControllerUtils'

interface DownloadDeps {
  selectedFile: MediaFile | null
  convertFormat: 'aac' | 'ogg' | 'mp3' | 'wav'
  setIsConverting: (next: boolean) => void
}

export function useDownloadActions({
  selectedFile,
  convertFormat,
  setIsConverting
}: DownloadDeps) {
  const handleDownload = useCallback(() => {
    if (!selectedFile) return
    if (!selectedFile.decodedPath) {
      toast.error('Decode to WAV or MP3 first.')
      return
    }
    toast.success('Initiating secure download...')
    window.open(`http://localhost:3000/api/files/${selectedFile.id}/download`, '_blank')
  }, [selectedFile])

  const handleConvertAndDownload = useCallback(async () => {
    if (!selectedFile) return
    if (!selectedFile.decodedPath) {
      toast.error('Decode to WAV or MP3 first.')
      return
    }

    const toastId = toast.loading(`Converting to ${convertFormat.toUpperCase()}...`)
    setIsConverting(true)

    try {
      const inputPath = selectedFile.decodedPath
      const baseName = selectedFile.filename.replace(/\.[^/.]+$/, '')
      const targetExt = convertFormat
      const outputDir = 'processed'
      const outputFilename = `${baseName}_converted.${targetExt}`
      const outputPath = `${outputDir}/${outputFilename}`

      const decodedFormat = getDecodedFormat(selectedFile)
      const baseSampleRate = inferBaseSampleRate(selectedFile)
      const baseChannels = inferBaseChannels(selectedFile)

      const sourceEncoding = {
        codec: decodedFormat === 'mp3' ? 'mp3' : decodedFormat === 'aac' ? 'aac' : decodedFormat === 'ogg' ? 'opus' : 'pcm_s16le',
        sampleRate: baseSampleRate,
        channels: baseChannels
      }

      const targetConfig = (() => {
        if (convertFormat === 'wav') {
          return { codec: 'pcm_s16le', format: 'wav' }
        }
        if (convertFormat === 'mp3') {
          return { codec: 'mp3', format: 'mp3' }
        }
        if (convertFormat === 'ogg') {
          return { codec: 'opus', format: 'ogg' }
        }
        return { codec: 'aac', format: 'adts' }
      })()

      const targetEncoding = {
        codec: targetConfig.codec,
        sampleRate: baseSampleRate,
        channels: baseChannels
      }

      const response = await transcodeFileDownload({
        input: { path: inputPath },
        output: { path: outputPath, format: targetConfig.format },
        sourceEncoding,
        targetEncoding
      })
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = outputFilename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Conversion ready. Downloading...', { id: toastId })
    } catch (error) {
      console.error('Convert failed:', error)
      toast.error('Conversion failed.', { id: toastId })
    } finally {
      setIsConverting(false)
    }
  }, [convertFormat, selectedFile, setIsConverting])

  return {
    handleDownload,
    handleConvertAndDownload
  }
}
