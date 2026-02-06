import { Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react'

interface AppHeaderProps {
  fileCount: number
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  isDarkMode: boolean
  onToggleTheme: () => void
}

export function AppHeader({
  fileCount,
  isSidebarCollapsed,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme
}: AppHeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-10 bg-white/30 backdrop-blur-xl z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl bg-white/70 hover:bg-white transition-colors flex items-center justify-center text-coffee-500 shadow-sm"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coffee-400">Indexed</div>
          <div className="text-sm font-bold text-coffee-Dark">{fileCount} files</div>
        </div>
      </div>
      <button
        onClick={onToggleTheme}
        className="w-10 h-10 rounded-xl bg-white/70 hover:bg-white transition-colors flex items-center justify-center text-coffee-600 shadow-sm"
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}
