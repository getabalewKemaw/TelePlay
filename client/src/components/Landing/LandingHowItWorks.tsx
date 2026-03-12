import { motion } from 'framer-motion'
import { Terminal, Database, Laptop, ArrowRight } from 'lucide-react'

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="text-center mb-24"
      >
        <span className="text-xs font-black tracking-[0.4em] text-coffee-400 uppercase mb-4 block">Process Workflow</span>
        <h2 className="text-3xl md:text-5xl font-black text-coffee-Dark tracking-tighter uppercase mb-6">THE METHODOLOGY.</h2>
        <p className="max-w-2xl mx-auto text-base text-coffee-500 uppercase tracking-widest font-semibold leading-relaxed">A seamless pipeline from raw telecom discovery to high-fidelity playback.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 w-full">
        <StepCard
          icon={<Database size={24} className="text-white" />}
          step={1}
          title="DISCOVERY"
          description="SYSTEM SCANS DIRECTORIES FOR G.711/726/728 FILES AND EXTRACTS METADATA INTO PRISMA."
          delay={0.1}
        />
        <ArrowRight size={24} className="text-coffee-300 hidden md:block rotate-90 md:rotate-0" />
        <StepCard
          icon={<Terminal size={24} className="text-white" />}
          step={2}
          title="TRANSCODING"
          description="FFMPEG DECODES RAW SIGNALS TO PCM DATA UPON REQUEST OR BACKGROUND SCHEDULING."
          delay={0.3}
        />
        <ArrowRight size={24} className="text-coffee-300 hidden md:block rotate-90 md:rotate-0" />
        <StepCard
          icon={<Laptop size={24} className="text-white" />}
          step={3}
          title="STREAMING"
          description="EITHER INSTANT MSE LIVE CHUNKING OR HTTP RANGE FILE-BASED STREAMING AFTER DECODING."
          delay={0.5}
        />
      </div>
    </section>
  )
}

function StepCard({ icon, step, title, description, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="relative bg-white/40 backdrop-blur-xl border border-white/80 p-10 rounded-none shadow-sm max-w-sm w-full text-center flex flex-col items-center group hover:bg-white/60 transition-colors"
    >
      <div className="absolute -top-4 bg-coffee-Dark text-coffee-50 px-4 py-2 rounded-none font-black text-[10px] tracking-[0.3em] shadow-lg uppercase border border-white/20">
        PHASE {step}
      </div>
      <div className="w-16 h-16 bg-gradient-to-br from-coffee-400 to-coffee-500 rounded-none flex items-center justify-center shadow-lg shadow-coffee-500/10 mb-8 mt-2 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black tracking-tight text-coffee-Dark mb-4 uppercase">{title}</h3>
      <p className="text-coffee-500 font-bold tracking-wider leading-relaxed text-[11px] uppercase">{description}</p>
    </motion.div>
  )
}
