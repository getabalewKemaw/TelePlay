import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { fetchFiles, uploadFile } from '../api/api'
import type { MediaFile } from '../api/api'
import type { SortKey } from '../components/FileTable/FileTable'
import { useFileStore } from '../stores/useFileStore'
import { useShallow } from 'zustand/shallow'
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
      if (!quiet) toast.success(`Inventory synchronized: ${total} files detected.`)
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast.error('Inventory synchronization failed.')
    } finally {
      isLoading = false
    }
  }, [debouncedSearchTerm, filterDecoded, limit, page, setFiles, setTotal, sortDir, sortKey])

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
          const ext = file.name.split('.').pop()?.toLowerCase()
          if (['g711', 'g726', 'g728', 'wav', 'pcm'].includes(ext || '')) {
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

  return {
    selectedFile,
    loadFiles,
    handleFileSelect,
    handleSortChange,
    handleNext,
    handlePrev,
    pickDirectory
  }
}
