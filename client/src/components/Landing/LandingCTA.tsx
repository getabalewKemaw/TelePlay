import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function LandingCTA() {
  const navigate = useNavigate()

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-white/40 backdrop-blur-2xl border border-white/80 p-12 md:p-20 flex flex-col items-center text-center rounded-none shadow-2xl shadow-coffee-Dark/5"
      >
        <h2 className="text-3xl md:text-5xl font-black text-coffee-Dark tracking-tighter uppercase mb-6 leading-tight">
          COMPLETE SIGNAL<br />VISUALIZATION.
        </h2>
        <p className="text-coffee-600 text-base md:text-lg font-medium tracking-widest uppercase mb-10 max-w-2xl">
          READY TO EXPERIENCE INDUSTRIAL GRADE TELECOM DECODING? ENTER THE I-PLAYER DASHBOARD NOW.
        </p>
        <button 
          onClick={() => navigate('/app')}
          className="px-10 py-5 bg-coffee-Dark text-white font-black text-xs tracking-[0.3em] hover:bg-coffee-600 transition-all flex items-center gap-4 group rounded-none uppercase"
        >
          LAUNCH DASHBOARD
          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </motion.div>
    </section>
  )
}
