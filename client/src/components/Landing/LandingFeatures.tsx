import { motion } from 'framer-motion'
import { Headphones, Layers, Zap, Server, Sliders, Box, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  return (
    <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 flex flex-col items-center border-t border-coffee-300 pt-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20"
      >
        <span className="text-sm font-black tracking-[0.4em] text-primary uppercase mb-4 block">Engineered for Precision</span>
        <h2 className="text-7xl md:text-8xl font-black text-coffee-600 tracking-tighter uppercase mb-6 drop-shadow-sm">CORE CAPABILITIES.</h2>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-primary font-bold tracking-tight leading-relaxed">
          A specialized analytical environment built specifically for telecom signal processing and archival retrieval.
        </p>
      </motion.div>

      <div className="relative w-full">
        {/* Technical Grid Lines (Table-like Structure) */}
        <div className="absolute inset-x-0 -top-4 border-t border-coffee-600/30 w-full z-0" />
        <div className="absolute inset-x-0 top-1/2 border-t border-coffee-600/10 w-full z-0 hidden lg:block" />
        <div className="absolute inset-x-0 -bottom-4 border-b border-coffee-600/30 w-full z-0" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full pt-10 relative z-10">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-white/60 backdrop-blur-xl border-x border-white/80 border-t-2 border-b-2 border-t-coffee-600 border-b-coffee-600 p-10 rounded-none shadow-sm hover:shadow-2xl hover:bg-white/90 transition-all hover:-translate-y-2 text-left group cursor-default"
            >
              <div className="text-coffee-600 mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-xl font-black tracking-widest text-primary mb-4 group-hover:text-primary transition-colors uppercase">{feature.title}</h3>
              <p className="text-primary tracking-wide font-bold leading-relaxed text-sm">
                {feature.description}
              </p>
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
          EXPLORE ALL FEATURES
          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform flex-shrink-0" />
        </button>
      </motion.div>
    </section>
  )
}
