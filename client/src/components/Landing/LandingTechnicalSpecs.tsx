import { motion } from 'framer-motion'
import { Cpu, Zap, Binary, ShieldCheck, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const specs = [
  {
    icon: <Binary size={32} />,
    title: "CODEC DECODE",
    value: "G.711/726/728",
    detail: "Full analytical support for industry standard telecom codecs."
  },
  {
    icon: <Zap size={32} />,
    title: "PLAYBACK",
    value: "INSTANT",
    detail: "Live chunked MSE streaming enables playback without waiting."
  },
  {
    icon: <Cpu size={32} />,
    title: "ARCHIVING",
    value: "SCALABLE",
    detail: "Handles massive signal archives with Prisma metadata storage."
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "WAVEFORM",
    value: "DYNAMIC",
    detail: "Seamless transition from server peaks to high-res WaveSurfer."
  }
]

export function LandingTechnicalSpecs() {
  const navigate = useNavigate()
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 border-y border-coffee-200/20 border-t border-coffee-300 pt-10 flex flex-col items-center">
      {/* lets add some titles */}
      <div className="text-center mb-24">
        <span className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4 block">Technical Specs</span>
        <h2 className="text-3xl md:text-7xl font-bold text-coffee-600 tracking-tighter uppercase mb-6">THE TECH SPECS.</h2>
        <p className="max-w-2xl mx-auto text-base text-primary uppercase tracking-widest font-semibold leading-relaxed">A seamless pipeline from raw telecom discovery to high-fidelity playback.</p>
      </div>
      <div className="relative w-full">
        {/* Technical Grid Lines (Table-like Structure) */}
        <div className="absolute inset-x-0 top-0 border-t border-coffee-600/30 w-full z-0" />
        <div className="absolute inset-x-0 bottom-0 border-b border-coffee-600/30 w-full z-0" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full pt-10 relative z-10">
          {specs.map((spec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/60 backdrop-blur-xl border-x border-white/80 border-t-2 border-b-2 border-t-coffee-600 border-b-coffee-600 p-10 rounded-none shadow-sm hover:shadow-2xl hover:bg-white/90 transition-all hover:-translate-y-2 text-left flex flex-col group cursor-default"
            >
              <div className="text-primary mb-8 group-hover:scale-110 transition-transform">{spec.icon}</div>
              <span className="text-sm font-black tracking-[0.3em] text-primary mb-2 uppercase">{spec.title}</span>
              <span className="text-4xl font-black text-primary tracking-tighter mb-4 uppercase drop-shadow-sm">{spec.value}</span>
              <p className="text-base font-bold tracking-tight text-primary leading-relaxed">{spec.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-20"
      >
        <button
          onClick={() => navigate('/app')}
          className="px-10 py-5 bg-coffee-600 text-white font-black text-xs tracking-[0.3em] hover:bg-coffee-Dark transition-all flex items-center gap-4 group rounded-none uppercase shadow-xl shadow-coffee-600/10 whitespace-nowrap"
        >
          VIEW TECHNICAL DOCUMENTATION
          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform flex-shrink-0" />
        </button>
      </motion.div>
    </section>
  )
}
