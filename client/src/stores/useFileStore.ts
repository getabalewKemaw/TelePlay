import { create } from 'zustand'
import type { FileState } from '../types/fileStore'
export const useFileStore = create<FileState>((set) => ({
  files: [],
  filteredFiles: [],
  total: 0,
  page: 1,
  limit: 10,
  selectedFile: null,
  searchTerm: '',
  debouncedSearchTerm: '',
  filterDecoded: false,
  sortKey: 'filename',
  sortDir: 'asc',
  setFiles: (files) => set({ files }),
  setFilteredFiles: (files) => set({ filteredFiles: files }),
  setTotal: (total) => set({ total }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setDebouncedSearchTerm: (term) => set({ debouncedSearchTerm: term }),
  setFilterDecoded: (value) => set({ filterDecoded: value }),
  setSortKey: (key) => set({ sortKey: key }),
  setSortDir: (dir) => set({ sortDir: dir })
}))
