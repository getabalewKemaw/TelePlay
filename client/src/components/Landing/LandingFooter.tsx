import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="relative z-10 w-full bg-coffee-Dark text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-2">
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-6">TELEPLAY CORE</h3>
            <p className="max-w-md text-white/60 text-sm font-medium tracking-widest leading-relaxed uppercase">
              INDUSTRIAL GRADE SIGNAL PROCESSING ENGINE. BUILT FOR HIGH-PRESCISION ANALYSIS AND SEAMLESS CLOUD ARCHIVING.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-black tracking-[0.3em] text-white mb-6 uppercase">Product</h4>
            <ul className="space-y-4 text-xs font-bold tracking-widest text-white/50 uppercase">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Methodology</a></li>
              <li><a href="/app" className="hover:text-white transition-colors">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black tracking-[0.3em] text-white mb-6 uppercase">Legal</h4>
            <ul className="space-y-4 text-xs font-bold tracking-widest text-white/50 uppercase">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">License</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-8">
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter size={18} /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Linkedin size={18} /></a>
            <a href="https://github.com/getabalewKemaw/I-Player" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors"><Github size={18} /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Mail size={18} /></a>
          </div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase">
            © {new Date().getFullYear()} TELEPLAY SYSTEYMS. DESIGNED BY GETABALEW KEMAW.
          </p>
        </div>
      </div>
    </footer>
  )
}
