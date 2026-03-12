import { motion } from 'framer-motion'
import { ShieldAlert, RefreshCcw, ActivitySquare, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function LandingWhatItSolves() {
  const navigate = useNavigate()
  return (
    <section id="what-it-solves" className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 flex flex-col items-center border-t border-coffee-300">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="text-center mb-24"
      >
        <h2 className="text-6xl md:text-7xl font-bold text-coffee-600 tracking-tighter uppercase mb-8">WHY TELEPLAY?</h2>
        <p className="max-w-4xl mx-auto text-xl md:text-2xl text-primary-600 font-bold tracking-tight leading-tight">
          Traditional browser players crash when handling gigabytes of audio data. We solved that.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full">
        <ProblemCard
          icon={<ShieldAlert size={32} className="text-red-500" />}
          title="THE PROBLEM: MEMORY CRASHES"
          description="LOADING A MULTI-HOUR AUDIO SIGNAL DIRECTLY INTO A BROWSER MEMORY BUFFER INEVITABLY CAUSES THE TAB TO FREEZE OR OOM (OUT OF MEMORY) CRASH."
        />
        <SolutionCard
          icon={<CheckCircle2 size={32} className="text-green-600" />}
          title="THE SOLUTION: SMART CHUNKING"
          description="TELEPLAY REQUESTS MEDIA IN TINY BYTE-RANGE CHUNKS. THE BROWSER ONLY KEEPS WHAT IT CURRENTLY NEEDS IN RAM, ALLOWING INFINITE DURATIONS."
        />

        <ProblemCard
          icon={<RefreshCcw size={32} className="text-red-500" />}
          title="THE PROBLEM: TERRIBLE UI LAGGING"
          description="DRAWING A WAVEFORM FOR 10 MILLION SAMPLES LOCKS THE BROWSER'S MAIN UI THREAD, MAKING SCRUBBING IMPOSSIBLE."
        />
        <SolutionCard
          icon={<ActivitySquare size={32} className="text-green-600" />}
          title="THE SOLUTION: MULTI-PEAK CACHING"
          description="WE OFF-LOAD THE HEAVY COMPUTATION AND USE A DEGRADED RESOLUTION GRAPH OVERVIEW THAT FETCHES HIGH-RES DATA ONLY WHEN YOU ZOOM IN."
        />
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
          COMPARE ARCHITECTURES
          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform flex-shrink-0" />
        </button>
      </motion.div>
    </section>
  )
}

function ProblemCard({ icon, title, description }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="bg-red-50/60 backdrop-blur-sm border-x border-red-200/50 border-t-2 border-b-2 border-t-red-500 border-b-red-500 p-8 rounded-none flex flex-col lg:flex-row gap-6 items-start shadow-sm hover:shadow-xl transition-all"
    >
      <div className="flex-shrink-0 bg-white shadow-xl shadow-red-500/10 p-4 rounded-none border border-red-100">{icon}</div>
      <div>
        <h3 className="text-xl font-black tracking-widest text-red-900 mb-2 uppercase">{title}</h3>
        <p className="text-red-900 font-bold tracking-tight leading-relaxed text-sm">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

function SolutionCard({ icon, title, description }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-green-50/60 backdrop-blur-sm border-x border-green-200/50 border-t-2 border-b-2 border-t-green-600 border-b-green-600 p-8 rounded-none flex flex-col lg:flex-row gap-6 items-start shadow-sm hover:shadow-xl transition-all"
    >
      <div className="flex-shrink-0 bg-white shadow-xl shadow-primary-500/10 p-4 rounded-none border border-green-100">{icon}</div>
      <div>
        <h3 className="text-xl font-black tracking-widest text-primary-900 mb-2 uppercase">{title}</h3>
        <p className="text-primary font-bold tracking-tight leading-relaxed text-sm">
          {description}
        </p>
      </div>
    </motion.div>
  )
}
