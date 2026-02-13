import { create } from 'zustand'
import type { FileState } from '../types/fileStore'

export const useFileStore = create<FileState>((set) => ({
  files: [],
  filteredFiles: [],
  selectedFile: null,
  searchTerm: '',
  debouncedSearchTerm: '',
  filterDecoded: false,
  sortKey: 'filename',
  sortDir: 'asc',
  setFiles: (files) => set({ files }),
  setFilteredFiles: (files) => set({ filteredFiles: files }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setDebouncedSearchTerm: (term) => set({ debouncedSearchTerm: term }),
  setFilterDecoded: (value) => set({ filterDecoded: value }),
  setSortKey: (key) => set({ sortKey: key }),
  setSortDir: (dir) => set({ sortDir: dir })
}))
