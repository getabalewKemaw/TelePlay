import { create } from 'zustand'
interface UIState {
  isSidebarCollapsed: boolean
  isTableOpen: boolean
  isDarkMode: boolean
  toggleSidebar: () => void
  toggleTable: () => void
  toggleTheme: () => void
}

const getInitialSidebar = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
}

const getInitialTheme = () => {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
  if (stored === 'dark') return true
  if (stored === 'light') return false
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: getInitialSidebar(),
  isTableOpen: true,

  isDarkMode: getInitialTheme(),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleTable: () => set((state) => ({ isTableOpen: !state.isTableOpen })),
  toggleTheme: () => set((state) => {
    const next = !state.isDarkMode
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', next ? 'dark' : 'light')
    }
    return { isDarkMode: next }
  })
}))
