import { motion } from 'framer-motion'
import { Cpu, Zap, Binary, ShieldCheck } from 'lucide-react'

const specs = [
  {
    icon: <Binary size={20} />,
    label: "CODEC DECODE",
    value: "G.711/726/728",
    detail: "FULL ANALYTICAL SUPPORT FOR INDUSTRY STANDARD TELECOM CODECS."
  },
  {
    icon: <Zap size={20} />,
    label: "PLAYBACK",
    value: "INSTANT",
    detail: "LIVE CHUNKED MSE STREAMING ENABLES PLAYBACK WITHOUT WAITING."
  },
  {
    icon: <Cpu size={20} />,
    label: "ARCHIVING",
    value: "SCALABLE",
    detail: "HANDLES MASSIVE SIGNAL ARCHIVES WITH PRISMA METADATA STORAGE."
  },
  {
    icon: <ShieldCheck size={20} />,
    label: "WAVEFORM",
    value: "DYNAMIC",
    detail: "SEAMLESS TRANSITION FROM SERVER PEAKS TO HIGH-RES WAVESURFER."
  }
]

export function LandingTechnicalSpecs() {
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 border-y border-coffee-200/20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {specs.map((spec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="text-coffee-300 mb-4">{spec.icon}</div>
            <span className="text-[10px] font-black tracking-[0.3em] text-coffee-400 mb-2 uppercase">{spec.label}</span>
            <span className="text-3xl font-black text-coffee-Dark tracking-tighter mb-4 uppercase">{spec.value}</span>
            <p className="text-[10px] font-bold tracking-widest text-coffee-500 leading-relaxed uppercase">{spec.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
