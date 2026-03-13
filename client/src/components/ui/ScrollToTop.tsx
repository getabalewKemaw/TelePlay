import { useState, useEffect } from 'react'
import type { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopProps {
  containerRef?: RefObject<HTMLDivElement | null>
  threshold?: number
}

export const ScrollToTop = ({ containerRef, threshold = 400 }: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef?.current) {
        setIsVisible(containerRef.current.scrollTop > threshold)
      } else {
        setIsVisible(window.scrollY > threshold)
      }
    }

    const target = containerRef?.current || window
    target.addEventListener('scroll', handleScroll as any, { passive: true })
    
    // Initial check
    handleScroll()

    return () => target.removeEventListener('scroll', handleScroll as any)
  }, [containerRef, threshold])

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 lg:bottom-16 lg:right-16 p-6 lg:p-8 bg-coffee-600 text-white shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-none z-[100] hover:bg-black transition-all border-2 lg:border-4 border-white/20 active:scale-90 group"
        >
          <ArrowUp size={32} className="group-hover:-translate-y-2 transition-transform duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
