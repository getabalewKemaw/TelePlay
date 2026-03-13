import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme.tsx'
import { 
  Book, 
  Layers, 
  Zap, 
  Info, 
  Shield, 
  ChevronRight, 
  Search, 
  Terminal,
  Play,
  Github,
  ArrowRight,
  Copy,
  Check,
  Menu,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ScrollToTop } from '../components/ui/ScrollToTop'

type DocSection = {
  id: string
  title: string
  icon: any
  body: string[]
  code?: string
}

const SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: Book,
    body: [
      'Teleplay is a resilient web player + SDK engineered to handle legacy telecom audio codecs (G711, G726, G728) with modern performance standards.',
      'By delegating complex signal processing to a specialized microservice, the browser remains lightweight and responsive.',
      'Integrate the package into your pipeline and connect to your Teleplay infrastructure in seconds.'
    ]
  },
  {
    id: 'architecture',
    title: 'How It Works',
    icon: Layers,
    body: [
      'The client requests a high-fidelity streaming session from the core microservice.',
      'A server-side FFmpeg pipeline performs on-the-fly transcoding of proprietary telecom signals.',
      'Decoded PCM data is delivered via MSE (Media Source Extensions) for seamless playback and waveform analysis.'
    ]
  },
  {
    id: 'server',
    title: 'Server Setup',
    icon: Terminal,
    body: [
      'Ensure the Teleplay Server environment has a certified FFmpeg binary available in the system PATH.',
      'Configure your path resolution policies to point to the secure file storage directory.',
      'Verify that the /api/streaming and /api/ffmpeg endpoints are correctly routing decoder requests.'
    ],
    code: `# TERMINAL\nnpm install @teleplay/server\nnpm run start\n\n# VERIFY FFmpeg\nffmpeg -version`
  },
  {
    id: 'client',
    title: 'Client Integration',
    icon: Zap,
    body: [
      'Install the core SDK via your preferred package manager.',
      'Initialize the Global Signal Config to target your processing microservice.',
      'Deploy the TeleplayPlayer component with a server-validated file path.'
    ],
    code: `import { TeleplayPlayer } from '@teleplay/core'\n\nconst App = () => (\n  <TeleplayPlayer\n    filePath="/data/signal_01.raw"\n    codec="G726"\n    bitrate={32}\n  />\n);`
  },
  {
    id: 'props',
    title: 'Technical Specs',
    icon: Info,
    body: [
      'filePath: [REQUIRED] Absolute path to the source signal on the server.',
      'codec: [IDENTIFIER] G711, G711A, G726, G728 - used for optimized pipeline selection.',
      'bitrate: [METRIC] Required for variable-rate G726 decoding (16, 24, 32, 40).',
      'outputFormat: Specifies the delivery target (mp3/wav) for browser compatibility.'
    ]
  },
  {
    id: 'security',
    title: 'System Security',
    icon: Shield,
    body: [
      'Signal processing is sandboxed within the microservice to prevent local execution risks.',
      'All file paths are sanitized through the Server Path Policy before processing.',
      'Ensure your API identifies client origins via standard CORS verification.'
    ]
  }
]

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code mt-6">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/5 rounded-t-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[10px] text-white/40 font-mono ml-2 uppercase tracking-widest">teleplay-terminal</span>
        </div>
        <button 
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-6 font-mono text-xs md:text-sm overflow-x-auto shadow-2xl border-l-2 border-coffee-600 rounded-none leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function DocsPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const bgImage = theme === 'dark'
    ? "/black-concrete-textured-background.jpg"
    : "/bg-image.png"

  const handleScroll = () => {
    if (!contentRef.current) return
    
    // Active Tab detection
    const sections = SECTIONS.map(s => document.getElementById(s.id))
    const current = sections.find(section => {
      if (!section) return false
      const rect = section.getBoundingClientRect()
      return rect.top >= 0 && rect.top <= 500
    })
    if (current) setActiveTab(current.id)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element && contentRef.current) {
      const containerTop = contentRef.current.getBoundingClientRect().top
      const elementTop = element.getBoundingClientRect().top
      const scrollOffset = elementTop - containerTop + contentRef.current.scrollTop
      
      contentRef.current.scrollTo({
        top: scrollOffset - 40,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div
      className={`h-screen overflow-hidden bg-cover bg-center bg-fixed font-sans relative transition-colors duration-500`}
      style={{ backgroundImage: `url('${bgImage}')` }}
    >
      {/* Background Overlays */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${theme === 'dark' ? 'opacity-40' : 'opacity-25'}`}>
        <div className={`absolute top-0 right-[15%] w-[60vw] h-[60vw] bg-coffee-300/40 blur-[180px] rounded-full pointer-events-none ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'}`} />
        <div className={`absolute bottom-[10%] left-[10%] w-[60vw] h-[60vw] bg-coffee-accent/25 blur-[180px] rounded-full pointer-events-none ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'}`} />
      </div>

      {/* Mobile Top Bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 z-[60] flex items-center justify-between px-6 border-b border-coffee-600/10 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <Link to="/" className="text-sm font-black tracking-tighter text-coffee-600">TELEPLAY SDK</Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-coffee-600">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex h-full w-full relative z-10">
        
        {/* SIDEBAR - PERSISTENT TECHNICAL ASIDE */}
        <aside className={`
          ${mobileMenuOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} 
          lg:static lg:flex w-[480px] flex-col border-r-2 border-coffee-600/10 dark:border-white/5 h-full 
          ${theme === 'dark' ? 'bg-black lg:bg-black/40 lg:backdrop-blur-3xl' : 'bg-white'}
        `}>
          <div className="flex-1 overflow-y-auto p-8 space-y-10 thin-scrollbar">
            {/* Header / Brand */}
            <div className="mb-10">
              <Link to="/" className={`text-xl font-black tracking-tighter hover:text-coffee-600 transition-colors ${theme === 'dark' ? 'text-white' : 'text-[#3C2A21]'}`}>
                TELEPLAY <span className="text-coffee-600 underline decoration-4 underline-offset-4">DOCS</span>
              </Link>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-1 bg-coffee-600" />
                <h3 className={`text-[9px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-coffee-600' : 'text-[#3C2A21]'}`}>Protocols</h3>
              </div>
              
              <div className="relative group mb-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400 group-focus-within:text-coffee-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="SEARCH PROTOCOLS..." 
                  className="w-full bg-white/40 dark:bg-white/5 border-2 border-coffee-600/10 rounded-none py-5 pl-12 pr-6 text-[11px] font-black uppercase tracking-[0.2em] focus:border-coffee-600 outline-none transition-all placeholder:text-coffee-300 placeholder:tracking-widest"
                />
              </div>

              <nav className="flex flex-col gap-3">
                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeTab === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        scrollToSection(section.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`flex items-center justify-between group px-8 py-4 text-[12px] font-bold uppercase tracking-[0.25em] transition-all rounded-none border-l-4 whitespace-nowrap ${
                        isActive 
                          ? 'bg-coffee-600 text-white shadow-xl shadow-coffee-600/20 border-coffee-Dark' 
                          : 'text-coffee-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-8">
                        <Icon size={22} className={isActive ? 'text-white' : 'text-coffee-600/40 group-hover:text-coffee-600'} />
                        {section.title}
                      </div>
                      <ChevronRight size={18} className={`transition-all duration-500 ${isActive ? 'rotate-90 opacity-100' : 'opacity-0'}`} />
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="pt-12 border-t-2 border-coffee-600/10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-coffee-400 mb-8 italic">Telemetry & Sources</h3>
              <div className="grid grid-cols-1 gap-5">
                <Link to="/app" className="group flex items-center justify-between p-6 bg-coffee-600 text-white text-[11px] font-black tracking-[0.4em] uppercase hover:bg-coffee-Dark transition-all">
                  <span className="flex items-center gap-4"><Play size={14} className="fill-coffee-accent stroke-coffee-accent" /> Signal Console</span>
                  <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <a href="https://github.com/getabalewKemaw/I-Player" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-6 bg-white/40 dark:bg-white/5 border-2 border-coffee-600/10 text-[11px] font-black tracking-[0.4em] uppercase text-coffee-600 dark:text-slate-400 hover:border-coffee-600 transition-all">
                  <Github size={20} /> Git Pipeline
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT Area */}
        <main 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 md:px-24 py-32 lg:py-24 scroll-smooth thin-scrollbar backdrop-blur-[1px] relative pt-24 lg:pt-24"
        >
          <div className="max-w-5xl mx-auto space-y-24">
            <header className="space-y-8 mb-24">
              <div className="flex items-center gap-6">
                <div className="h-1 w-20 bg-coffee-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-coffee-600">DOCUMENTATION VER 1.0.4</span>
              </div>
              <h1 className={`text-5xl md:text-6xl font-black tracking-tighter leading-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-[#3C2A21]'}`}>
                SIGNAL <br />
                <span className="text-coffee-600">ENGINEERING</span>
              </h1>
              <p className={`max-w-3xl text-lg md:text-xl font-bold leading-relaxed tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-[#3C2A21]/80'}`}>
                Core architecture and integration patterns for <br /> 
                <span className="underline decoration-coffee-600 decoration-[6px] underline-offset-[10px]">enterprise signal processing</span>.
              </p>
            </header>

            <div className="space-y-72 pb-72">
              {SECTIONS.map((section, idx) => {
                const Icon = section.icon
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, scale: 0.98, y: 30 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="relative group"
                  >
                    <div className="absolute -top-24 -left-12 text-[12rem] font-black text-coffee-600/5 dark:text-white/5 pointer-events-none group-hover:text-coffee-600/10 transition-colors select-none tracking-tighter">
                      0{idx + 1}
                    </div>

                    <div className="flex flex-col 2xl:flex-row gap-32 relative z-10">
                      <div className="flex-1 space-y-20">
                        <div className="flex items-center gap-12">
                          <div className="p-8 bg-coffee-600 text-white rounded-none shadow-xl">
                            <Icon size={32} strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-coffee-600 uppercase tracking-[0.6em] mb-2">Module Blueprint 0{idx + 1}</div>
                            <h2 className={`text-3xl md:text-4xl font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-[#3C2A21]'}`}>
                              {section.title}
                            </h2>
                          </div>
                        </div>
                        
                        <div className="space-y-8">
                          {section.body.map((line, i) => (
                            <div key={i} className="flex gap-8 items-start">
                              <div className="w-3 h-3 bg-coffee-600 mt-2 shrink-0" />
                              <p className={`text-lg md:text-xl font-bold leading-relaxed tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-[#2D1E17]'}`}>
                                {line}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {section.code && (
                        <div className="2xl:w-[45%] shrink-0 self-start">
                          <CodeBlock code={section.code} />
                        </div>
                      )}
                    </div>
                  </motion.section>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Shared Scroll Utility */}
      <ScrollToTop containerRef={contentRef} />
    </div>
  )
}
