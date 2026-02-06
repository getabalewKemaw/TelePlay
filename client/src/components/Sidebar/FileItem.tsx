import { FileAudio, CheckCircle2 } from 'lucide-react'
import type { MediaFile } from '../../api/api'
import { cn } from '../../utils/utils'

interface FileItemProps {
    file: MediaFile
    isSelected: boolean
    onClick: (file: MediaFile) => void
}

export function FileItem({ file, isSelected, onClick }: FileItemProps) {
    return (
        <button
            onClick={() => onClick(file)}
            className={cn(
                "w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden",
                isSelected
                    ? "bg-coffee-600 text-white shadow-md shadow-coffee-600/30"
                    : "hover:bg-coffee-100 active:scale-[0.98]"
            )}
        >
            <div className="flex items-center gap-3 relative z-10">
                <div className={cn(
                    "p-2 rounded-lg relative",
                    isSelected ? "bg-white/20" : "bg-coffee-50 text-coffee-400"
                )}>
                    <FileAudio size={20} />
                    {file.decodedPath && !isSelected && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 size={8} />
                        </div>
                    )}
                </div>
                <div className="flex-1 truncate">
                    <div className="font-semibold text-sm truncate tracking-tight">{file.filename}</div>
                    <div className={cn(
                        "text-[10px] truncate uppercase font-bold tracking-widest opacity-70",
                        isSelected ? "text-coffee-50" : "text-coffee-400"
                    )}>
                        {file.codec?.toUpperCase()} • {file.format}
                    </div>
                </div>
            </div>

            {/* Selection Border */}
            {isSelected && (
                <div className="absolute inset-y-0 left-0 w-1 bg-white opacity-50" />
            )}
        </button>
    )
}
