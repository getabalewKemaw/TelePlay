import { motion } from 'framer-motion'
import { Headphones, Layers, Zap, Server, Sliders, Box } from 'lucide-react'

const features = [
  {
    icon: <Box size={32} className="text-coffee-500 mb-6" />,
    title: "CODEC SUPPORT",
    description: "NATIVE DECODING FOR G.711, G.726, AND G.728 TELECOM SIGNALS INTO STANDARD PCM/WAV FORMATS."
  },
  {
    icon: <Zap size={32} className="text-coffee-500 mb-6" />,
    title: "LIVE STREAMING",
    description: "INSTANT PLAYBACK VIA CHUNKED MEDIA SOURCE EXTENSIONS (MSE) BUFFERING FOR RAW ANALOG INPUTS."
  },
  {
    icon: <Layers size={32} className="text-coffee-500 mb-6" />,
    title: "DUAL WAVEFORMS",
    description: "REAL-TIME PEAK RENDERING FOR LIVE STREAMS AND HIGH-RES WAVESURFER ANALYSIS FOR DECODED STORAGE."
  },
  {
    icon: <Server size={32} className="text-coffee-500 mb-6" />,
    title: "SERVER INDEXING",
    description: "NODE.JS BACKEND POWERED BY PRISMA FOR METADATA STORAGE AND EFFICIENT FILE SYSTEM DISCOVERY."
  },
  {
    icon: <Headphones size={32} className="text-coffee-500 mb-6" />,
    title: "LOSSLESS SCRUB",
    description: "HIGH-PRECISION SEEKING AND SCRUBBING ACROSS LARGE FILES POWERED BY SERVER-SIDE CHUNKING."
  },
  {
    icon: <Sliders size={32} className="text-coffee-500 mb-6" />,
    title: "SIGNAL CONTROL",
    description: "FINE-GRAINED GAIN ADJUSTMENT, PLAYBACK RATE MODULATION, AND INSTANT METADATA VISUALIZATION."
  }
]

export function LandingFeatures() {
  return (
    <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20"
      >
        <span className="text-xs font-black tracking-[0.4em] text-coffee-400 uppercase mb-4 block">Engineered for Precision</span>
        <h2 className="text-3xl md:text-5xl font-black text-coffee-Dark tracking-tighter uppercase mb-6">CORE CAPABILITIES.</h2>
        <p className="max-w-3xl mx-auto text-base text-coffee-500 uppercase tracking-widest font-semibold leading-relaxed">A specialized analytical environment built specifically for telecom signal processing and archival retrieval.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-white/50 backdrop-blur-xl border border-white/80 p-10 rounded-none shadow-sm hover:shadow-xl hover:bg-white/80 transition-all hover:-translate-y-1 text-left group cursor-default"
          >
            {feature.icon}
            <h3 className="text-lg font-bold tracking-widest text-coffee-Dark mb-4 group-hover:text-coffee-600 transition-colors uppercase">{feature.title}</h3>
            <p className="text-coffee-500 tracking-wide font-medium leading-relaxed text-[11px] uppercase">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
