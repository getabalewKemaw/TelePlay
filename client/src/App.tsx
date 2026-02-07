import { Toaster } from 'react-hot-toast'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Player } from './components/Player/Player'
import { FileTable } from './components/FileTable/FileTable'
import { AppHeader } from './components/App/AppHeader'
import { FileTableCard } from './components/App/FileTableCard'
import { EmptyState } from './components/App/EmptyState'
import { useAppController } from './hooks/useAppController'
export default function App() {
  const {
    filteredFiles,
    selectedFile,
    isDecoding,
    activeSession,
    playbackRate,
    volume,
    outputFormat,
    searchTerm,
    filterDecoded,
    sortKey,
    sortDir,
    isTableOpen,
    isSidebarCollapsed,
    isDarkMode,
    waveformRef,
    audioRef,
    nativeTime,
    nativeDuration,
    nativePlaying,
    forceNativeAudio,
    wavesurfer,
    isWaveformReady,
    isPlaying,
    currentTime,
    duration,
    setSearchTerm,
    setFilterDecoded,
    setOutputFormat,
    handleSortChange,
    handleFileSelect,
    handleDecodeAndPlay,
    handleDownload,
    handleNext,
    handlePrev,
    handleRateChange,
    handleSeek,
    handleSkip,
    handleVolumeChange,
    pickDirectory,
    playPause,
    toggleSidebar,
    toggleTable,
    toggleTheme,
    isDirectPlayable
  } = useAppController()

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
              <Player
                selectedFile={selectedFile}
                isDecoding={isDecoding}
                activeSession={activeSession}
                isPlaying={forceNativeAudio ? nativePlaying : isPlaying}
                currentTime={forceNativeAudio ? nativeTime : currentTime}
                duration={forceNativeAudio ? nativeDuration : duration}
                playbackRate={playbackRate}
                volume={volume}
                outputFormat={outputFormat}
                wavesurfer={wavesurfer}
                waveformRef={waveformRef}
                audioRef={audioRef}
                useNativeAudio={forceNativeAudio}
                canDirectPlay={isDirectPlayable(selectedFile)}
                isWaveformReady={isWaveformReady}
                onDecodeAndPlay={() => handleDecodeAndPlay()}
                onDownload={handleDownload}
                onPlayPause={() => {
                  if (forceNativeAudio) {
                    if (!audioRef.current) return
                    if (nativePlaying) {
                      audioRef.current.pause()
                    } else {
                      audioRef.current.play().catch(() => undefined)
                    }
                  } else {
                    playPause()
                  }
                }}
                onNext={handleNext}
                onPrev={handlePrev}
                onRateChange={handleRateChange}
                onSeek={handleSeek}
                onSkip={handleSkip}
                onVolumeChange={handleVolumeChange}
                onOutputFormatChange={setOutputFormat}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
