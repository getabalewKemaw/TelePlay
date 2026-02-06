import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface AppHeaderProps {
  fileCount: number
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function AppHeader({ fileCount, isSidebarCollapsed, onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-10 border-b border-coffee-100/50 bg-white/30 backdrop-blur-xl z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl border border-coffee-100 bg-white/70 hover:bg-white transition-colors flex items-center justify-center text-coffee-500"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coffee-400">Indexed</div>
          <div className="text-sm font-bold text-coffee-Dark">{fileCount} files</div>
        </div>
      </div>
    </header>
  )
}
