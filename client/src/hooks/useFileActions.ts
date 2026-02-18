import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { fetchFiles, uploadFile } from '../api/api'
import type { MediaFile } from '../api/api'
import type { SortKey } from '../components/FileTable/FileTable'
import { useFileStore } from '../stores/useFileStore'
import { useShallow } from 'zustand/shallow'
import { isSupportedAudioFile,pickFileWithInput } from '../utils/fileUtils'
let isLoading = false
export function useFileActions() {
  const {
    filteredFiles,
    selectedFile,
    sortKey,
    sortDir,
    page,
    limit,
    debouncedSearchTerm,
    filterDecoded,
    setFiles,
    setTotal,
    setSelectedFile,
    setSortKey,
    setSortDir
  } = useFileStore(useShallow((state) => ({
    filteredFiles: state.filteredFiles,
    selectedFile: state.selectedFile,
    sortKey: state.sortKey,
    sortDir: state.sortDir,
    page: state.page,
    limit: state.limit,
    debouncedSearchTerm: state.debouncedSearchTerm,
    filterDecoded: state.filterDecoded,
    setFiles: state.setFiles,
    setTotal: state.setTotal,
    setSelectedFile: state.setSelectedFile,
    setSortKey: state.setSortKey,
    setSortDir: state.setSortDir
  })))

  const loadFiles = useCallback(async (quiet = false) => {
    if (isLoading) return
    isLoading = true
    try {
      const result = await fetchFiles({
        page,
        limit,
        query: debouncedSearchTerm || undefined,
        sort: sortKey,
        order: sortDir,
        decodedOnly: filterDecoded || undefined
      })
      const filesArray = Array.isArray(result.files) ? result.files : []
      setFiles(filesArray)
      const total = result.meta?.total ?? filesArray.length
      setTotal(total)
      if (selectedFile) {
        const refreshedSelection = filesArray.find((f) => f.id === selectedFile.id)
        if (refreshedSelection) {
          setSelectedFile(refreshedSelection)
        }
      }
      if (!quiet) toast.success(`Inventory synchronized: ${total} files detected.`)
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast.error('Inventory synchronization failed.')
    } finally {
      isLoading = false
    }
  }, [debouncedSearchTerm, filterDecoded, limit, page, selectedFile, setFiles, setSelectedFile, setTotal, sortDir, sortKey])

  const handleFileSelect = useCallback((file: MediaFile) => {
    setSelectedFile(file)
    toast(`Focusing on ${file.filename}`, { icon: '♪' })
  }, [setSelectedFile])

  const handleSortChange = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }, [setSortDir, setSortKey, sortDir, sortKey])

  const handleNext = useCallback(() => {
    if (!selectedFile || filteredFiles.length <= 1) return
    const currentIndex = filteredFiles.findIndex((f) => f.id === selectedFile.id)
    const nextIndex = (currentIndex + 1) % filteredFiles.length
    const nextFile = filteredFiles[nextIndex]
    if (nextFile) handleFileSelect(nextFile)
  }, [filteredFiles, handleFileSelect, selectedFile])

  const handlePrev = useCallback(() => {
    if (!selectedFile || filteredFiles.length <= 1) return
    const currentIndex = filteredFiles.findIndex((f) => f.id === selectedFile.id)
    const prevIndex = (currentIndex - 1 + filteredFiles.length) % filteredFiles.length
    const prevFile = filteredFiles[prevIndex]
    if (prevFile) handleFileSelect(prevFile)
  }, [filteredFiles, handleFileSelect, selectedFile])

  const pickDirectory = useCallback(async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast.error('Browser does not support Native File System API')
        return
      }

      const dirHandle = await (window as any).showDirectoryPicker()
      const toastId = toast.loading(`Accessing vault: ${dirHandle.name}...`)
      let fileCount = 0

      const processHandle = async (handle: any) => {
        if (handle.kind === 'file') {
          const file = await handle.getFile()
          if (isSupportedAudioFile(file.name)) {
            await uploadFile(file)
            fileCount++
            toast.loading(`Syncing: ${file.name}`, { id: toastId })
          }
        } else if (handle.kind === 'directory') {
          for await (const entry of handle.values()) {
            await processHandle(entry)
          }
        }
      }

      await processHandle(dirHandle)
      toast.success(`Import complete: ${fileCount} new signals secured.`, { id: toastId })
      await loadFiles(true)
    } catch (error) {
      console.error('Directory access failed:', error)
      if ((error as any).name !== 'AbortError') {
        toast.error('Access denied to local vault.')
      }
    }
  }, [loadFiles])

  const pickSingleFile = useCallback(async () => {
    try {
      let file: File | null = null

      if ('showOpenFilePicker' in window) {
        const [handle] = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'Audio Files',
            accept: { 'audio/*': ['.g711', '.g711u', '.g711a', '.g726', '.g728', '.pcm', '.wav', '.mp3', '.aac', '.ogg'] }
          }]
        })
        file = handle ? await handle.getFile() : null
      } else {
        file = await pickFileWithInput()
      }

      if (!file) return
      if (!isSupportedAudioFile(file.name)) {
        toast.error('Unsupported file type for upload.')
        return
      }

      const toastId = toast.loading(`Uploading: ${file.name}`)
      await uploadFile(file)
      toast.success(`Uploaded: ${file.name}`, { id: toastId })
      await loadFiles(true)
    } catch (error) {
      console.error('Single file upload failed:', error)
      if ((error as any).name !== 'AbortError') {
        toast.error('Single file upload failed.')
      }
    }
  }, [loadFiles])

  return {
    selectedFile,
    loadFiles,
    handleFileSelect,
    handleSortChange,
    handleNext,
    handlePrev,
    pickDirectory,
    pickSingleFile
  }
}
