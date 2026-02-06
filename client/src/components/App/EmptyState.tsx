import { Music } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
      <div className="w-32 h-32 bg-white/50 backdrop-blur-xl rounded-[2.5rem] rotate-12 flex items-center justify-center text-coffee-400 shadow-2xl">
        <Music size={64} className="-rotate-12 animate-pulse" />
      </div>
      <div className="space-y-3 max-w-sm">
        <h3 className="text-3xl font-black text-coffee-Dark tracking-tighter">Signal Deadlock</h3>
        <p className="text-sm text-coffee-400 font-bold uppercase tracking-wider leading-relaxed">
          Select a terminal source from the left inventory to initiate primary decode sequence.
        </p>
      </div>
    </div>
  )
}
