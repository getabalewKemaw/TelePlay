import type { SortKey } from "../components/FileTable/FileTable";

export const headers: Array<{ key: SortKey; label: string; align?: 'left' | 'right' }> = [
  { key: 'filename', label: 'Signal' },
  { key: 'codec', label: 'Codec' },
  { key: 'format', label: 'Format' },
  { key: 'duration', label: 'Duration', align: 'right' },
  { key: 'status', label: 'Status' }
]