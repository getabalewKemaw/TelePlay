import { useNavigate } from 'react-router-dom'
import { Activity, Github, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Why Teleplay', id: 'what-it-solves' },
]

export function LandingNavbar() {
  const navigate = useNavigate()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100 // adjust for navbar height
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl px-4 transition-all duration-300">
      <div
        className="flex items-center justify-between px-10 py-5 bg-coffee-50/80 backdrop-blur-xl border border-coffee-200/50 rounded-full shadow-lg relative"
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none rounded-full overflow-hidden"
          style={{
            backgroundImage: "url('/nav-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <div className="flex items-center gap-10 relative z-10">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 flex items-center justify-center text-white bg-coffee-Dark shadow-lg shadow-coffee-Dark/20 transition-transform group-hover:scale-110 rounded-full">
              <Activity size={20} />
            </div>
            <span className="text-2xl font-black text-coffee-Dark transition-transform group-hover:scale-105 uppercase tracking-tighter">
              Teleplay
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-coffee-500/80 mt-1 ml-1">
              Core
            </span>
          </button>

          {/* Nav Links */}
          <nav className="hidden items-center gap-8 text-sm font-black text-coffee-500 md:flex tracking-widest uppercase">
            {NAV_LINKS.map((link, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(link.id)}
                className="hover:text-coffee-Dark transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-coffee-Dark transition-all group-hover:w-full" />
              </button>
            ))}
          </nav>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-6 relative z-10">
          <a href="https://github.com/getabalewKemaw/I-Player" target="_blank" rel="noreferrer" className="text-coffee-500 hover:text-coffee-Dark transition-colors hidden md:block">
            <Github size={20} />
          </a>

          <button
            onClick={() => navigate('/app')}
            className="px-6 py-2.5 text-xs font-black tracking-widest transition-all shadow-xl shadow-coffee-Dark/20 flex items-center gap-3 group  uppercase bg-coffee-Dark text-white hover:bg-coffee-600 hover:scale-105"
          >
            Launch app
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  )
}
