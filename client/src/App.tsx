import { Toaster } from 'react-hot-toast'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Player } from './components/Player/Player'
import { FileTable } from './components/FileTable/FileTable'
import { AppHeader } from './components/App/AppHeader'
import { FileTableCard } from './components/App/FileTableCard'
import { EmptyState } from './components/App/EmptyState'
import { useEffect } from 'react'
import { useUIStore } from './stores/useUIStore'
import { useShallow } from 'zustand/shallow'
import { useFileStore } from './stores/useFileStore'
import { useFileActions } from './hooks/useFileActions'
import { useFileDerivedSync } from './hooks/useFileDerivedSync'
export default function App() {
  useFileDerivedSync()

  const {
    filteredFiles,
    selectedFile,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    setSearchTerm,
    setFilterDecoded
  } = useFileStore(useShallow((state) => ({
    filteredFiles: state.filteredFiles,
    selectedFile: state.selectedFile,
    searchTerm: state.searchTerm,
    filterDecoded: state.filterDecoded,
    sortKey: state.sortKey,
    sortDir: state.sortDir,
    setSearchTerm: state.setSearchTerm,
    setFilterDecoded: state.setFilterDecoded
  })));

  const {
    handleSortChange,
    handleFileSelect,
    pickDirectory,
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
          fileCount={filteredFiles.length}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-12 thin-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10">
            <FileTableCard
              fileCount={filteredFiles.length}
              isOpen={isTableOpen}
              onToggle={toggleTable}
            >
              <FileTable
                files={filteredFiles}
                selectedId={selectedFile?.id}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={handleSortChange}
                onSelect={handleFileSelect}
              />
            </FileTableCard>

            {selectedFile ? (
              <Player />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
