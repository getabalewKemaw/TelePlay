import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import PlayerDashboard from './pages/PlayerDashboard'
import { Preloader } from './components/ui/Preloader'
import { ThemeProvider } from './hooks/useTheme.tsx'

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Preloader onComplete={() => setIsLoaded(true)} />
        <AnimatePresence>
          {isLoaded && (
            <motion.div
              initial={{ y: '100vh', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Smooth "Cubic-Bezier" entrance
              className="min-h-screen"
            >
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<PlayerDashboard />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>
      </BrowserRouter>
    </ThemeProvider>
  )
}
