import type { MediaFile } from '../api/api'
import type { SortDir, SortKey } from '../components/FileTable/FileTable'

interface FilterOptions {
  searchTerm: string
  filterDecoded: boolean
  sortKey: SortKey
  sortDir: SortDir
}

export function filterAndSortFiles(files: MediaFile[], options: FilterOptions) {
  const term = options.searchTerm.trim().toLowerCase()
  const base = files.filter(file => {
    const matchesSearch = term.length === 0 || file.filename.toLowerCase().includes(term)
    const matchesType = options.filterDecoded ? !!file.decodedPath : true
    return matchesSearch && matchesType
  });

  const sorted = [...base].sort((a, b) => {
    const dir = options.sortDir === 'asc' ? 1 : -1
    if (options.sortKey === 'duration') {
      return ((a.duration || 0) - (b.duration || 0)) * dir
    }
    const left = (a[options.sortKey] || '').toString().toLowerCase()
    const right = (b[options.sortKey] || '').toString().toLowerCase()
    if (left < right) return -1 * dir
    if (left > right) return 1 * dir
    return 0
  })

  return sorted
}
