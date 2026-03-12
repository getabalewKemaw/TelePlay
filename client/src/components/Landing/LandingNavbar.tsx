import { useNavigate } from 'react-router-dom'
import { Github, ArrowRight, Star, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.tsx'

const NAV_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Why Teleplay', id: 'what-it-solves' },
  { label: 'FAQ', id: 'faq' },
]

export function LandingNavbar() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100 // adjust for navbar height
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-7xl px-4 transition-all duration-300">
      <div
        className="flex items-center justify-between px-10 py-2.5 bg-coffee-50/80 backdrop-blur-xl border border-coffee-200/50 rounded-full shadow-lg relative border-t border-coffee-300 "
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
            className="flex items-center gap-0 group"
          >
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
              <img src="/logo.png" alt="Teleplay Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-primary-600 transition-transform group-hover:scale-105 uppercase tracking-tighter">
              Teleplay
            </span>
          </button>

          {/* Nav Links */}
          <nav className="hidden items-center gap-8 text-sm font-black text-primary md:flex tracking-widest uppercase">
            {NAV_LINKS.map((link, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(link.id)}
                className="hover:text-primary-600 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-white/50 border border-coffee-200/50 rounded-full shadow-sm hover:shadow-md transition-all group text-primary hover:text-coffee-600"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="transition-transform group-hover:rotate-45" />
            ) : (
              <Moon size={18} className="transition-transform group-hover:-rotate-12" />
            )}
          </button>

          <div className="flex items-center gap-4 bg-white/50 border border-coffee-200/50 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all group">
            <a href="https://github.com/getabalewKemaw/I-Player" target="_blank" rel="noreferrer" className="text-primary hover:text-coffee-600 transition-colors flex items-center gap-2">
              <Github size={18} />
              <div className="w-px h-3 bg-coffee-200/50" />
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black tracking-widest text-primary">10</span>
              </div>
            </a>
          </div>

          <button
            onClick={() => navigate('/app')}
            className="px-6 py-2.5 text-xs font-black tracking-widest transition-all shadow-xl shadow-coffee-Dark/20 flex items-center gap-3 group uppercase bg-coffee-600 text-white hover:bg-coffee-Dark hover:scale-105 whitespace-nowrap"
          >
            Launch app
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>
        </div>
      </div>
    </header>
  )
}
