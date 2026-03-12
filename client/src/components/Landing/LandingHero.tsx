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
        className="text-[3.5rem] md:text-[5rem] lg:text-[6rem] font-black tracking-tighter text-coffee-Dark max-w-[90rem] leading-[0.95] uppercase"
      >
        ADVANCED TELECOM<br />SIGNAL PLAYER.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="mt-10 text-base md:text-lg text-coffee-600 max-w-4xl font-medium tracking-widest leading-relaxed uppercase"
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
          className="px-12 py-5 bg-coffee-Dark text-white font-bold text-xs tracking-[0.3em] hover:bg-coffee-600 transition-all shadow-xl shadow-coffee-Dark/10 flex items-center gap-3 group rounded-none uppercase"
        >
          OPEN DASHBOARD
          <Play size={12} className="fill-white transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </section>
  )
}
