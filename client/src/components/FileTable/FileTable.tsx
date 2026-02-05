import { ArrowUpDown, CheckCircle2, FileAudio, Timer, Waves } from 'lucide-react'
import type { MediaFile } from '../../api/api'
import { cn, formatTime } from '../../utils/utils'

export type SortKey = 'filename' | 'codec' | 'format' | 'duration' | 'status'
export type SortDir = 'asc' | 'desc'

interface FileTableProps {
  files: MediaFile[]
  selectedId?: string | null
  sortKey: SortKey
  sortDir: SortDir
  onSortChange: (key: SortKey) => void
  onSelect: (file: MediaFile) => void
}

const headers: Array<{ key: SortKey; label: string; align?: 'left' | 'right' }> = [
  { key: 'filename', label: 'Signal' },
  { key: 'codec', label: 'Codec' },
  { key: 'format', label: 'Format' },
  { key: 'duration', label: 'Duration', align: 'right' },
  { key: 'status', label: 'Status' }
]

export function FileTable({
  files,
  selectedId,
  sortKey,
  sortDir,
  onSortChange,
  onSelect
}: FileTableProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-coffee-200/40 border border-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-coffee-Dark text-white flex items-center justify-center shadow-lg">
            <Waves size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.25em]">Signal Table</div>
            <div className="text-sm font-black text-coffee-Dark">{files.length} assets indexed</div>
          </div>
        </div>
        <div className="text-[10px] uppercase font-bold text-coffee-400 tracking-widest">Click a header to sort</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left">
          <thead className="bg-gradient-to-r from-coffee-50 to-white">
            <tr className="text-[10px] uppercase tracking-[0.2em] text-coffee-400">
              {headers.map(h => (
                <th
                  key={h.key}
                  className={cn(
                    'px-6 py-3 font-black cursor-pointer select-none',
                    h.align === 'right' && 'text-right'
                  )}
                  onClick={() => onSortChange(h.key)}
                >
                  <div className={cn('flex items-center gap-2', h.align === 'right' && 'justify-end')}>
                    {h.label}
                    {sortKey === h.key && (
                      <ArrowUpDown size={12} className={cn(sortDir === 'desc' && 'rotate-180')} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100/60">
            {files.map(file => {
              const isSelected = file.id === selectedId
              return (
                <tr
                  key={file.id}
                  onClick={() => onSelect(file)}
                  className={cn(
                    'text-sm hover:bg-coffee-50/70 transition-colors cursor-pointer',
                    isSelected && 'bg-coffee-600 text-white'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center',
                        isSelected ? 'bg-white/20' : 'bg-coffee-100 text-coffee-600'
                      )}>
                        <FileAudio size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{file.filename}</div>
                        <div className={cn(
                          'text-[10px] uppercase tracking-widest',
                          isSelected ? 'text-white/70' : 'text-coffee-400'
                        )}>
                          {file.originalPath.split(/[\\/]/).pop()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{(file.codec || 'raw').toUpperCase()}</td>
                  <td className="px-6 py-4 font-semibold">{(file.format || 'binary').toUpperCase()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2 font-bold">
                      <Timer size={14} />
                      {formatTime(file.duration || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
                      file.decodedPath
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        : 'bg-amber-50 text-amber-700 border-amber-200/50'
                    )}>
                      <CheckCircle2 size={12} />
                      {file.decodedPath ? 'Processed' : file.status || 'Pending'}
                    </div>
                  </td>
                </tr>
              )
            })}
            {files.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-coffee-400 font-bold">
                  No files match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
