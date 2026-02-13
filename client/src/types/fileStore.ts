import type { MediaFile } from '../api/api'
import type { SortDir, SortKey } from '../components/FileTable/FileTable'
export interface FileState {
  files: MediaFile[]
  filteredFiles: MediaFile[]
  selectedFile: MediaFile | null
  searchTerm: string
  debouncedSearchTerm: string
  filterDecoded: boolean
  sortKey: SortKey
  sortDir: SortDir
  setFiles: (files: MediaFile[]) => void
  setFilteredFiles: (files: MediaFile[]) => void
  setSelectedFile: (file: MediaFile | null) => void
  setSearchTerm: (term: string) => void
  setDebouncedSearchTerm: (term: string) => void
  setFilterDecoded: (value: boolean) => void
  setSortKey: (key: SortKey) => void
  setSortDir: (dir: SortDir) => void
}
