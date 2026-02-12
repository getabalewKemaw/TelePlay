import { useCallback, useEffect, useMemo, useState ,useRef} from 'react'
import { toast } from 'react-hot-toast'
import { fetchFiles, uploadFile } from '../api/api'
import type { MediaFile } from '../api/api'
import type { SortDir, SortKey } from '../components/FileTable/FileTable'
import { filterAndSortFiles } from '../utils/appControllerFilters'
export function useFileState() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDecoded, setFilterDecoded] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('filename')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [isTableOpen, setIsTableOpen] = useState(true)
  // guard to prevent network request stacking
  const isLoadingRef=useRef(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
    if (stored === 'dark') return true
    if (stored === 'light') return false
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const loadFiles = useCallback(async (quiet = false) => {
    // opt(do not start a new request if the one is aleady in progress)
    if(isLoadingRef.current)return;
    isLoadingRef.current=true;
    try {
      const data = await fetchFiles()
      const filesArray = Array.isArray(data) ? data : (data?.files || [])
      setFiles(filesArray)
      if (!quiet) toast.success(`Inventory synchronized: ${filesArray.length} files detected.`)
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast.error('Inventory synchronization failed.')
    }
  }, [])

  useEffect(() => {
    loadFiles(true)
    const interval = setInterval(() => {
      loadFiles(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [loadFiles])

  const filteredFiles = useMemo(() => {
    return filterAndSortFiles(files, { searchTerm, filterDecoded, sortKey, sortDir })
  }, [files, searchTerm, filterDecoded, sortKey, sortDir])

  const handleSortChange = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }, [sortDir, sortKey])

  const handleFileSelect = useCallback((file: MediaFile) => {
    setSelectedFile(file)
    toast(`Focusing on ${file.filename}`, { icon: '🫡' })
  }, [])

  const handleNext = useCallback(() => {
    if (!selectedFile || filteredFiles.length <= 1) return
    const currentIndex = filteredFiles.findIndex(f => f.id === selectedFile.id)
    const nextIndex = (currentIndex + 1) % filteredFiles.length
    handleFileSelect(filteredFiles[nextIndex])
  }, [filteredFiles, handleFileSelect, selectedFile])

  const handlePrev = useCallback(() => {
    if (!selectedFile || filteredFiles.length <= 1) return
    const currentIndex = filteredFiles.findIndex(f => f.id === selectedFile.id)
    const prevIndex = (currentIndex - 1 + filteredFiles.length) % filteredFiles.length
    handleFileSelect(filteredFiles[prevIndex])
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

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((prev) => !prev), [])
  const toggleTable = useCallback(() => setIsTableOpen((prev) => !prev), [])
  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next ? 'dark' : 'light')
      }
      return next
    })
  }, [])

  return {
    files,
    selectedFile,
    setSelectedFile,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    isTableOpen,
    isSidebarCollapsed,
    isDarkMode,
    loadFiles,
    filteredFiles,
    setSearchTerm,
    setFilterDecoded,
    handleSortChange,
    handleFileSelect,
    handleNext,
    handlePrev,
    pickDirectory,
    toggleSidebar,
    toggleTable,
    toggleTheme
  }
}
