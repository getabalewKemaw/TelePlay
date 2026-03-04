import type { MediaFile } from './fileTypes' 
import type { SortDir, SortKey } from '../components/FileTable/FileTable'
export interface FileState {
  files: MediaFile[]
  filteredFiles: MediaFile[]
  total: number
  page: number
  limit: number
  selectedFile: MediaFile | null
  searchTerm: string
  debouncedSearchTerm: string
  filterDecoded: boolean
  sortKey: SortKey
  sortDir: SortDir
  setFiles: (files: MediaFile[]) => void
  setFilteredFiles: (files: MediaFile[]) => void
  setTotal: (total: number) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSelectedFile: (file: MediaFile | null) => void
  setSearchTerm: (term: string) => void
  setDebouncedSearchTerm: (term: string) => void
  setFilterDecoded: (value: boolean) => void
  setSortKey: (key: SortKey) => void
  setSortDir: (dir: SortDir) => void
}
