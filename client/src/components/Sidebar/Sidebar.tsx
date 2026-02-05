import { Coffee, FolderOpen, AudioLines, Settings, Search } from 'lucide-react'
import type { MediaFile } from '../../api/api'
import { FileItem } from './FileItem'


interface SidebarProps {
    files: MediaFile[]
    selectedFile: MediaFile | null
    onFileSelect: (file: MediaFile) => void
    onPickDirectory: () => void
    searchTerm: string
    onSearchChange: (value: string) => void
    filterDecoded: boolean
    onFilterDecodedChange: (value: boolean) => void
}

export function Sidebar({
    files,
    selectedFile,
    onFileSelect,
    onPickDirectory,
    searchTerm,
    onSearchChange,
    filterDecoded,
    onFilterDecodedChange
}: SidebarProps) {
    const filteredFiles = files || []

    return (
        <aside className="w-80 border-r border-coffee-200 bg-white/50 backdrop-blur-md flex flex-col z-20">
            <div className="p-6 border-b border-coffee-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-coffee-600 rounded-xl flex items-center justify-center shadow-lg shadow-coffee-600/20">
                    <Coffee className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight text-coffee-Dark">I-Player</h1>
                    <p className="text-[10px] text-coffee-400 font-bold uppercase tracking-[0.2em]">High-Fidelity Lab</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 thin-scrollbar">
                <div className="px-2 mb-4 space-y-3">
                    <button
                        onClick={onPickDirectory}
                        className="w-full py-2.5 px-4 bg-coffee-100 hover:bg-coffee-200 text-coffee-600 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest border border-coffee-200 shadow-sm"
                    >
                        <FolderOpen size={16} />
                        Open Directory
                    </button>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search frequency..."
                            className="w-full pl-9 pr-3 py-2 bg-white/50 border border-coffee-100 rounded-lg text-xs font-medium text-coffee-Dark placeholder:text-coffee-300 focus:outline-none focus:ring-2 focus:ring-coffee-200"
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
                </div>

                <div className="flex items-center justify-between px-4 mb-3">
                    <div className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.15em]">
                        Signal Inventory ({filteredFiles.length})
                    </div>
                </div>

                <div className="space-y-1">
                    {filteredFiles.map((file) => (
                        <FileItem
                            key={file.id}
                            file={file}
                            isSelected={selectedFile?.id === file.id}
                            onClick={onFileSelect}
                        />
                    ))}

                    {filteredFiles.length === 0 && (
                        <div className="text-center py-16 px-4">
                            <AudioLines className="w-12 h-12 text-coffee-100 mx-auto mb-4 animate-pulse" />
                            <p className="text-xs text-coffee-400 font-bold uppercase tracking-widest leading-relaxed">
                                {files?.length === 0 ? "Vault is empty" : "No signals match"}
                                <br />
                                <span className="opacity-50">{files?.length === 0 ? "Discovery required" : "Refinitize search"}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-coffee-100 bg-coffee-50/30">
                <div className="flex items-center gap-3 text-coffee-400 hover:text-coffee-600 transition-colors cursor-pointer px-4 py-2 hover:bg-white/50 rounded-lg">
                    <Settings size={18} />
                    <span className="text-sm font-bold tracking-tight">System Configuration</span>
                </div>
            </div>
        </aside>
    )
}
