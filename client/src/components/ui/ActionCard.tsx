import React from 'react'
import { cn } from '../../utils/utils'

interface ActionCardProps {
    title: string
    desc: string
    icon: React.ReactNode
    color: string
}

export function ActionCard({ title, desc, icon, color }: ActionCardProps) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-coffee-100/50 hover:shadow-xl transition-all group hover:-translate-y-1 cursor-pointer">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 transition-transform group-hover:scale-110 shadow-sm", color)}>
                {icon}
            </div>
            <h4 className="font-bold text-coffee-Dark mb-1 tracking-tight">{title}</h4>
            <p className="text-xs text-coffee-400 leading-relaxed font-medium">{desc}</p>
        </div>
    )
}
