import { useEffect, useMemo, useRef } from 'react'
import { useFileStore } from '../stores/useFileStore'
import { useShallow } from 'zustand/shallow'
import { filterAndSortFiles } from '../utils/appControllerFilters'


export function useFileDerivedSync() {
  const {
    files,
    searchTerm,
    debouncedSearchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    setDebouncedSearchTerm,
    setFilteredFiles
  } = useFileStore(useShallow((state) => ({
    files: state.files,
    searchTerm: state.searchTerm,
    debouncedSearchTerm: state.debouncedSearchTerm,
    filterDecoded: state.filterDecoded,
    sortKey: state.sortKey,
    sortDir: state.sortDir,
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

  const filtered = useMemo(() => {
    return filterAndSortFiles(files, {
      searchTerm: debouncedSearchTerm,
      filterDecoded,
      sortKey,
      sortDir
    })
  }, [debouncedSearchTerm, files, filterDecoded, sortDir, sortKey])

  useEffect(() => {
    setFilteredFiles(filtered)
  }, [filtered, setFilteredFiles])
}
