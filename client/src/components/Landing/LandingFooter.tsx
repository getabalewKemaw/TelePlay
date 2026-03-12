import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="relative z-10 w-full text-primary border-t-2 border-coffee-600/30 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div className="flex-1">
            <div className="w-14 h-14 mb-6 transition-transform hover:scale-105">
              <img src="/logo.png" alt="Teleplay Logo" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter uppercase mb-4">TELEPLAY CORE</h3>
            <p className="max-w-md text-primary/70 text-[10px] font-bold tracking-[0.2em] leading-relaxed uppercase">
              INDUSTRIAL GRADE SIGNAL PROCESSING ENGINE. BUILT FOR HIGH-PRECISION ANALYSIS AND SEAMLESS CLOUD ARCHIVING.
            </p>
          </div>

          <div className="w-px h-32 bg-coffee-200/50 hidden md:block" />

          <div className="flex-shrink-0">
            <h4 className="text-xs font-black tracking-[0.3em] text-primary mb-6 uppercase">Navigation</h4>
            <ul className="space-y-3 text-[10px] font-bold tracking-widest text-primary/50 uppercase">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">Methodology</a></li>
              <li><a href="/app" className="hover:text-primary transition-colors">Launch Dashboard</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-coffee-300 gap-8">
          <div className="flex items-center gap-6">
            <a href="#" className="text-primary/40 hover:text-primary transition-colors"><Twitter size={16} /></a>
            <a href="#" className="text-primary/40 hover:text-primary transition-colors"><Linkedin size={16} /></a>
            <a href="https://github.com/getabalewKemaw/I-Player" target="_blank" rel="noreferrer" className="text-primary/40 hover:text-primary transition-colors"><Github size={16} /></a>
            <a href="#" className="text-primary/40 hover:text-primary transition-colors"><Mail size={16} /></a>
          </div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-primary/30 uppercase">
            © {new Date().getFullYear()} TELEPLAY SYSTEMS. DESIGNED BY GETABALEW KEMAW.
          </p>
        </div>
      </div>
    </footer>
  )
}
