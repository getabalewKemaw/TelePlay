import { Coffee, FolderOpen, AudioLines, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { MediaFile } from '../../api/api'
import { FileItem } from './FileItem'
import { cn } from '../../utils/utils'


interface SidebarProps {
    files: MediaFile[]
    selectedFile: MediaFile | null
    onFileSelect: (file: MediaFile) => void
    onPickDirectory: () => void
    searchTerm: string
    onSearchChange: (value: string) => void
    filterDecoded: boolean
    onFilterDecodedChange: (value: boolean) => void
    collapsed: boolean
    onToggleCollapsed: () => void
}

export function Sidebar({
    files,
    selectedFile,
    onFileSelect,
    onPickDirectory,
    searchTerm,
    onSearchChange,
    filterDecoded,
    onFilterDecodedChange,
    collapsed,
    onToggleCollapsed
}: SidebarProps) {
    const filteredFiles = files || []

    return (
        <aside className={cn(
            "bg-white/50 backdrop-blur-md flex flex-col z-20 transition-all duration-300 shadow-xl shadow-coffee-200/30",
            collapsed ? "w-20" : "w-80"
        )}>
            <div className={cn(
                "flex items-center justify-between",
                collapsed ? "p-4" : "p-6"
            )}>
                <div className="w-10 h-10 bg-coffee-600 rounded-xl flex items-center justify-center shadow-lg shadow-coffee-600/20">
                    <Coffee className="text-white w-6 h-6" />
                </div>
                <button
                    onClick={onToggleCollapsed}
                    className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white transition-colors flex items-center justify-center text-coffee-500 shadow-sm"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 thin-scrollbar">
                <div className="px-2 mb-4 space-y-3">
                    <button
                        onClick={onPickDirectory}
                        className={cn(
                            "w-full py-2.5 px-4 bg-coffee-100 hover:bg-coffee-200 text-coffee-600 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest shadow-sm",
                            collapsed && "px-0"
                        )}
                        aria-label="Open directory"
                    >
                        <FolderOpen size={16} />
                        {!collapsed && "Open Directory"}
                    </button>

                    {!collapsed && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search frequency..."
                                    className="w-full pl-9 pr-3 py-2 bg-white/60 rounded-lg text-xs font-medium text-coffee-Dark placeholder:text-coffee-300 focus:outline-none focus:ring-2 focus:ring-coffee-200 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={filterDecoded}
                                        onChange={(e) => onFilterDecodedChange(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-coffee-100 rounded-full peer-checked:bg-green-500 transition-colors" />
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                                </div>
                                <span className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest group-hover:text-coffee-600 transition-colors">Only Processed</span>
                            </label>
                        </>
                    )}
                </div>

                {!collapsed && (
                    <div className="flex items-center justify-between px-4 mb-3">
                        <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.15em]">
                            Signal Inventory ({filteredFiles.length})
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    {!collapsed && filteredFiles.map((file) => (
                        <FileItem
                            key={file.id}
                            file={file}
                            isSelected={selectedFile?.id === file.id}
                            onClick={onFileSelect}
                        />
                    ))}

                    {!collapsed && filteredFiles.length === 0 && (
                        <div className="text-center py-16 px-4">
                            <AudioLines className="w-12 h-12 text-coffee-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-xs text-coffee-400 font-bold uppercase tracking-widest leading-relaxed">
                                {files?.length === 0 ? "Vault is empty" : "No signals match"}
                                <br />
                                <span className="opacity-50">{files?.length === 0 ? "Discovery required" : "Refinitize search"}</span>
                            </p>
                        </div>
                    )}

                    {collapsed && (
                        <div className="text-center py-8 text-[10px] font-bold uppercase tracking-widest text-coffee-400">
                            {filteredFiles.length} Files
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}
