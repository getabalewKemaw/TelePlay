import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, MessageSquare, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const faqs = [
  {
    question: "WHICH TELECOM CODECS ARE SUPPORTED NATIVELY?",
    answer: "TELEPLAY CORE NATIVELY SUPPORTS G.711 (µ-LAW/A-LAW), G.726 (ADPCM), AND G.728 (LOW-BITRATE) CODECS. OUR FFMPEG-POWERED BACKEND TRANSCODES THESE RAW SIGNALS INTO HIGH-FIDELITY PCM DATA FOR WEB PLAYBACK."
  },
  {
    question: "HOW DOES TELEPLAY HANDLE EXTREMELY LARGE AUDIO ARCHIVES?",
    answer: "WE UTILIZE A SMART BYTE-RANGE CHUNKING ARCHITECTURE. THE BROWSER ONLY LOADS SMALL SUB-SECTIONS OF THE AUDIO DATA INTO MEMORY VIA MEDIA SOURCE EXTENSIONS (MSE), PREVENTING RAM OVERLOAD AND BROWSER CRASHES."
  },
  {
    question: "CAN I RUN TELEPLAY ON A PRIVATE LOCAL NETWORK?",
    answer: "YES. THE ARCHITECTURE IS DESIGNED FOR ON-PREMISE DEPLOYMENT. THE NODE.JS BACKEND RUNS LOCALLY, INDEXING YOUR PRIVATE SIGNAL DIRECTORIES WITHOUT REQUIRING CLOUD ACCESS."
  },
  {
    question: "HOW ARE THE WAVEFORMS GENERATED FOR LONG DURATION SIGNALS?",
    answer: "WE GENERATE MULTI-LEVEL PEAK DATA ON THE SERVER. YOU SEE A LOW-RES GLOBAL OVERVIEW FIRST, AND AS YOU ZOOM IN, HIGH-RES WAVEFORM DATA IS FETCHED FOR THE SPECIFIC TIME RANGE YOU ARE ANALYZING."
  }
]

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const navigate = useNavigate()

  return (
    <section id="faq" className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 py-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-24"
      >
        <span className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4 block">Knowledge Base</span>
        <h2 className="text-5xl md:text-7xl font-black text-coffee-600 tracking-tighter uppercase mb-6">COMMON QUERIES.</h2>
        <p className="max-w-2xl mx-auto text-base text-primary uppercase tracking-widest font-bold leading-relaxed">
          Deep dives into the mechanics of industrial signal processing.
        </p>
      </motion.div>

      <div className="w-full space-y-4 relative">
        {/* Decorative Grid Lines */}
        <div className="absolute -left-10 h-full w-px bg-coffee-600/10 hidden lg:block" />
        <div className="absolute -right-10 h-full w-px bg-coffee-600/10 hidden lg:block" />

        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className={`group border-x border-white/80 border-t-2 border-b-2 ${
              openIndex === i ? 'border-t-coffee-600 border-b-coffee-600 bg-white/60 shadow-xl' : 'border-t-coffee-200 border-b-coffee-200 bg-white/30 hover:bg-white/50'
            } transition-all duration-300 rounded-none overflow-hidden`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-8 py-8 flex items-center justify-between text-left"
            >
              <span className={`text-sm md:text-base font-black tracking-widest uppercase ${openIndex === i ? 'text-coffee-600' : 'text-primary'}`}>
                {faq.question}
              </span>
              <div className={`flex-shrink-0 ml-4 p-2 ${openIndex === i ? 'bg-coffee-600 text-white' : 'bg-coffee-100 text-primary'} transition-colors`}>
                {openIndex === i ? <Minus size={16} /> : <Plus size={16} />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-8 pb-8">
                    <div className="pt-6 border-t border-coffee-200/50">
                      <p className="text-primary text-xs md:text-sm font-bold tracking-widest leading-relaxed uppercase">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 p-12 bg-coffee-600 w-full flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-coffee-600/20"
      >
        <div className="text-center md:text-left">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-4 justify-center md:justify-start">
            <MessageSquare size={24} className="text-white" />
            STILL HAVE QUESTIONS?
          </h3>
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/50 uppercase">
            WE ARE READY TO HELP YOU INTEGRATE TELEPLAY INTO YOUR PIPELINE.
          </p>
        </div>
        <button
          onClick={() => navigate('/app')}
          className="px-12 py-5 bg-white text-coffee-600 font-black text-xs tracking-[0.4em] hover:bg-coffee-50 transition-all flex items-center gap-4 group rounded-none uppercase whitespace-nowrap"
        >
          CONTACT US
          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform flex-shrink-0" />
        </button>
      </motion.div>
    </section>
  )
}
