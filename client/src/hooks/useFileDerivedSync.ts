import { useEffect, useRef } from 'react'
import { useFileStore } from '../stores/useFileStore'
import { useShallow } from 'zustand/shallow'
export function useFileDerivedSync() {
  const {
    files,
    searchTerm,
    setDebouncedSearchTerm,
    setFilteredFiles
  } = useFileStore(useShallow((state) => ({
    files: state.files,
    searchTerm: state.searchTerm,
    setDebouncedSearchTerm: state.setDebouncedSearchTerm,
    setFilteredFiles: state.setFilteredFiles
  })))

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, setDebouncedSearchTerm])

  useEffect(() => {
    setFilteredFiles(files)
  }, [files, setFilteredFiles])
}
