// extracted thing for a single file upload things

export const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'g711',
  'g711u',
  'g711a',
  'g726',
  'g728',
  'pcm',
  'wav',
  'mp3',
  'aac',
  'ogg'
])

export function isSupportedAudioFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return !!ext && SUPPORTED_AUDIO_EXTENSIONS.has(ext)
}

export function pickFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.g711,.g711u,.g711a,.g726,.g728,.pcm,.wav,.mp3,.aac,.ogg'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}
