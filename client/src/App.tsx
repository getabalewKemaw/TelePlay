import { Toaster } from 'react-hot-toast'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Player } from './components/Player/Player'
import { FileTable } from './components/FileTable/FileTable'
import { AppHeader } from './components/App/AppHeader'
import { FileTableCard } from './components/App/FileTableCard'
import { EmptyState } from './components/App/EmptyState'
import { useEffect, useRef } from 'react'
import { useUIStore } from './stores/useUIStore'
import { useShallow } from 'zustand/shallow'
import { useFileStore } from './stores/useFileStore'
import { useFileActions } from './hooks/useFileActions'
import { useFileDerivedSync } from './hooks/useFileDerivedSync'
export default function App() {
  useFileDerivedSync()
  const playerSectionRef = useRef<HTMLDivElement | null>(null)

  const {
    filteredFiles,
    selectedFile,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    debouncedSearchTerm,
    page,
    limit,
    total,
    setSearchTerm,
    setFilterDecoded,
    setPage
  } = useFileStore(useShallow((state) => ({
    filteredFiles: state.filteredFiles,
    selectedFile: state.selectedFile,
    searchTerm: state.searchTerm,
    filterDecoded: state.filterDecoded,
    sortKey: state.sortKey,
    sortDir: state.sortDir,
    debouncedSearchTerm: state.debouncedSearchTerm,
    page: state.page,
    limit: state.limit,
    total: state.total,
    setSearchTerm: state.setSearchTerm,
    setFilterDecoded: state.setFilterDecoded,
    setPage: state.setPage
  })));

  const {
    handleSortChange,
    handleFileSelect,
    pickDirectory,
    pickSingleFile,
    loadFiles
  } = useFileActions();

  const {
    isTableOpen,
    isSidebarCollapsed,
    isDarkMode,
    toggleSidebar,
    toggleTable,
    toggleTheme
  } = useUIStore(useShallow((state) => ({
    isTableOpen: state.isTableOpen,
    isSidebarCollapsed: state.isSidebarCollapsed,
    isDarkMode: state.isDarkMode,
    toggleSidebar: state.toggleSidebar,
    toggleTable: state.toggleTable,
    toggleTheme: state.toggleTheme
  })));

  useEffect(() => {
    loadFiles(true)
    const interval = setInterval(() => {
      loadFiles(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [loadFiles]);

  useEffect(() => {
    const currentPage = useFileStore.getState().page
    if (currentPage !== 1) {
      setPage(1)
    }
  }, [debouncedSearchTerm, filterDecoded, sortDir, sortKey, setPage])

  useEffect(() => {
    if (!selectedFile || !playerSectionRef.current) return
    playerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedFile?.id])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = total === 0 ? 0 : Math.min(page * limit, total)

  return (
    <div

      data-theme={isDarkMode ? 'dark' : 'light'}
      className="flex h-screen bg-coffee-50 text-coffee-Dark font-sans selection:bg-coffee-200 overflow-hidden transition-colors duration-300"
    >
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#3C2A21',
          color: '#FFF',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }
      }} />

      <Sidebar
        files={filteredFiles}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onPickDirectory={pickDirectory}
        onPickFile={pickSingleFile}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterDecoded={filterDecoded}
        onFilterDecodedChange={setFilterDecoded}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-coffee-300/10 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-coffee-accent/5 blur-[100px] -z-10 rounded-full -translate-x-1/2 translate-y-1/2" />

        <AppHeader
          fileCount={total}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-12 thin-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10">
            <FileTableCard
              fileCount={total}
              isOpen={isTableOpen}
              onToggle={toggleTable}
            >
              <div className="flex flex-col gap-3 px-6 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-coffee-500">
                  <div className="uppercase tracking-widest">
                    Showing {startIndex}-{endIndex} of {total} signals
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                    >
                      Prev
                    </button>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-coffee-400">
                      Page {page} of {totalPages}
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              <FileTable
                files={filteredFiles}
                selectedId={selectedFile?.id}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={handleSortChange}
                onSelect={handleFileSelect}
              />
            </FileTableCard>

            <div ref={playerSectionRef}>
              {selectedFile ? (
                <Player />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
