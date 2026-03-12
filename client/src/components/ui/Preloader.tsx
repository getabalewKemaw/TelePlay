import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
          <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-coffee-50 flex flex-col items-center justify-center p-6 overflow-hidden transition-colors duration-500"
        >
          {/* Background Technical Pattern */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-12 relative z-10"
          >
            {/* Huge Logo Container */}
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="w-48 h-48 md:w-64 md:h-64"
            >
              <img src="/logo.png" alt="Teleplay Logo" className="w-full h-full object-contain" />
            </motion.div>

            {/* Huge Branding Text */}
            <div className="flex flex-col items-center">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-7xl md:text-[10rem] font-black text-coffee-600 tracking-tighter leading-none"
              >
                TELEPLAY
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                className="h-2 bg-coffee-600 mt-4 rounded-full"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="text-xs md:text-sm font-black tracking-[0.5em] text-primary/40 uppercase mt-8"
              >
                Industrial Signal Processing Core
              </motion.p>
            </div>
          </motion.div>

          {/* Loading Progress Bar at bottom */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-1 bg-coffee-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full bg-coffee-600"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
