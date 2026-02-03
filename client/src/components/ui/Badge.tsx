import React from 'react'

interface BadgeProps {
    icon: React.ReactNode
    label: string
}

export function Badge({ icon, label }: BadgeProps) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-coffee-50 text-coffee-600 rounded-full text-xs font-bold border border-coffee-100 uppercase tracking-wide">
            {icon}
            <span>{label}</span>
        </div>
    )
}
