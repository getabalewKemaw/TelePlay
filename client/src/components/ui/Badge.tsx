import React from 'react'

interface BadgeProps {
    icon: React.ReactNode
    label: string
}

export function Badge({ icon, label }: BadgeProps) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-coffee-50 text-coffee-600 rounded-none text-xs font-bold uppercase tracking-wide shadow-sm border">
            {icon}
            <span>{label}</span>
        </div>
    )
}
