import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
export function LandingHero() {
  const navigate = useNavigate()

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-48 pb-32 flex flex-col items-center justify-center text-center">

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="text-[3.5rem] md:text-[5rem] lg:text-[6rem] font-black tracking-tighter text-coffee-600 max-w-[90rem] leading-[0.95] uppercase"
      >
        ADVANCED TELECOM<br />SIGNAL PLAYER.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="mt-10  text-base text-6xl md:text-lg text-primary max-w-4xl font-bold tracking-widest leading-relaxed uppercase"
      >
        DECODE G.711, G.726, AND G.728 CODECS INSTANTLY. <br className="hidden md:block" />
        LIVE CHUNKED STREAMING WITH REAL-TIME WAVEFORM RENDERING POWERED BY FFPROBE AND MSE.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="mt-16 flex justify-center"
      >
        <button
          onClick={() => navigate('/app')}
          className="px-12 py-5 bg-coffee-600 text-white font-black text-xs tracking-[0.3em] hover:bg-coffee-Dark transition-all shadow-xl shadow-coffee-Dark/10 flex items-center gap-3 group rounded-none uppercase whitespace-nowrap"
        >
          OPEN DASHBOARD
          <Play size={12} className="fill-white transition-transform group-hover:translate-x-1 flex-shrink-0" />
        </button>
        <button
          onClick={() => navigate('/app')}
          className="ml-7 px-12 py-5 bg-coffee-50 text-coffee-Dark font-bold text-xs tracking-[0.3em] hover:bg-coffee-Dark hover:text-white transition-all shadow-xl shadow-coffee-Dark/10 flex items-center gap-3 group rounded-none uppercase border whitespace-nowrap"
        >
          View Docs
        </button>
      </motion.div>
    </section>
  )
}
