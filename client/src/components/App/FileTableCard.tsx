import { Music } from 'lucide-react'
import type { ReactNode } from 'react'

interface FileTableCardProps {
  fileCount: number
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

export function FileTableCard({ fileCount, isOpen, onToggle, children }: FileTableCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-coffee-200/40 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-coffee-Dark text-white flex items-center justify-center shadow-lg">
            <Music size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.25em]">Signal Table</div>
            <div className="text-sm font-black text-coffee-Dark">{fileCount} assets indexed</div>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-[10px] uppercase font-black tracking-widest px-3 py-2 rounded-xl bg-white/60 hover:bg-white transition-colors text-coffee-500 shadow-sm"
        >
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {isOpen ? children : null}
    </div>
  )
}
