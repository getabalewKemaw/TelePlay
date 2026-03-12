import { motion } from 'framer-motion'
import { ShieldAlert, RefreshCcw, ActivitySquare, CheckCircle2 } from 'lucide-react'

export function LandingWhatItSolves() {
  return (
    <section id="what-it-solves" className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="text-center mb-24"
      >
        <h2 className="text-4xl md:text-6xl font-black text-coffee-Dark tracking-tighter uppercase mb-6">WHY TELEPLAY?</h2>
        <p className="max-w-3xl mx-auto text-xl text-coffee-500 uppercase tracking-widest font-semibold text-balance">
          TRADITIONAL BROWSER PLAYERS CRASH WHEN HANDLING GIGABYTES OF AUDIO DATA. WE SOLVED THAT.
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
      className="bg-red-50/50 backdrop-blur-sm border border-red-200/50 p-8 rounded-none flex flex-col lg:flex-row gap-6 items-start"
    >
      <div className="flex-shrink-0 bg-white shadow-xl shadow-red-500/10 p-4 rounded-none border border-red-100">{icon}</div>
      <div>
        <h3 className="text-xl font-bold tracking-widest text-red-900 mb-2 uppercase">{title}</h3>
        <p className="text-red-800/80 font-bold tracking-wider leading-relaxed text-xs uppercase">{description}</p>
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
      className="bg-green-50/50 backdrop-blur-sm border border-green-200/50 p-8 rounded-none flex flex-col lg:flex-row gap-6 items-start shadow-xl shadow-green-500/5"
    >
      <div className="flex-shrink-0 bg-white shadow-xl shadow-green-500/10 p-4 rounded-none border border-green-100">{icon}</div>
      <div>
        <h3 className="text-xl font-bold tracking-widest text-green-900 mb-2 uppercase">{title}</h3>
        <p className="text-green-800/80 font-bold tracking-wider leading-relaxed text-xs uppercase">{description}</p>
      </div>
    </motion.div>
  )
}
