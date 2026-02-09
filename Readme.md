# I-Player

Custom media player for telecom/raw codecs with decoding, streaming, and waveform playback.

## Project Summary
I-Player is a custom media player that supports non-standard telecom codecs (G711, G726, G728) and enables:
- decoding to WAV/MP3
- instant playback via live chunked streaming
- stable file-based playback with waveform
- server-generated waveform for live streams

## Tech Stack

**Client**
- React + TypeScript (Vite)
- WaveSurfer.js (file-based waveform)
- Custom canvas waveform (live chunked streaming)

**Server**
- Node.js + Express + TypeScript
- FFmpeg (decode/transcode/stream)
- Prisma (metadata storage)

## Prerequisites
- Node.js 18+ (recommended)
- npm 9+ (or pnpm/yarn)
- FFmpeg available in PATH
- SQLite (default Prisma DB)

Repository URL (for reference):
```
https://github.com/getabalewKemaw/I-Player
```

## How to Clone

```
git clone https://github.com/getabalewKemaw/I-Player.git
cd I-Player
```

## How to Run

### 1) Install Dependencies
```
cd C:\Users\Hp\Desktop\I-Player\I-Player\client
npm install

cd C:\Users\Hp\Desktop\I-Player\I-Player\server
npm install
```
create .env file in the root of the server folder and create like 

```
DATABASE_URL="postgresql://Username:Password@localhost:Port/Dbname?schema=public"
PORT=
FFMPEG_PATH=
FFPROBE_PATH=
UPLOADS_DIR=./uploads
PROCESSED_DIR=./processed
TEMP_DIR=./temp


```
### 2) Start the Server
```
cd C:\Users\Hp\Desktop\I-Player\I-Player\server
npm run dev
```

### 3) Start the Client
```
cd C:\Users\Hp\Desktop\I-Player\I-Player\client
npm run dev
```

### 4) Open the App
```
http://localhost:5173
```

## What We Built

**Core features**
- Decode telecom codecs to WAV/MP3
- File-based streaming with HTTP Range
- Live chunked streaming with MSE for instant playback
- Server-generated waveform peaks for live streams
- Seamless switch to file-based playback after decode
- Playback controls: play/pause, seek, skip, volume, rate

**Operational flow**
- File discovery and metadata extraction
- Store metadata in Prisma DB
- Stream from `uploads/` (live) or `processed/` (file-based)

## Folder Structure (Overview)

```
client/        # React UI + hooks + components
server/        # Express API + ffmpeg + chunking
docs/          # Architecture and implementation docs
```

## File Tree (Full)

# File Tree: I-Player

**Generated:** 2/9/2026, 10:26:48 PM
**Root Path:** `c:\Users\Hp\Desktop\I-Player\I-Player`

```
📁 client
   📁 public
      🖼 vite.svg
   📁 src
      📁 api
         📄 api.ts
      📁 assets
         🖼 react.svg
      📁 components
         📁 App
            📄 AppHeader.tsx
            📄 EmptyState.tsx
            📄 FileTableCard.tsx
         📁 FileTable
            📄 FileTable.tsx
         📁 Player
            📄 MobileSeekBar.tsx
            📄 Player.tsx
            📄 PlayerControlGrid.tsx
            📄 PlayerFileCard.tsx
            📄 PlayerHeader.tsx
            📄 PlayerTransport.tsx
            📄 StreamingWaveform.tsx
            📄 WaveformPanel.tsx
         📁 Sidebar
            📄 FileItem.tsx
            📄 Sidebar.tsx
         📁 ui
             📄 ActionCard.tsx
             📄 Badge.tsx
      📁 hooks
         📁 playback
            📄 useDecodeAndPlay.ts
            📄 useDownloadActions.ts
            📄 useNativeAudioState.ts
            📄 useTransportControls.ts
            📄 useWaveformState.ts
         📄 useAppController.ts
         📄 useFileState.ts
         📄 usePlaybackState.ts
         📄 useWaveSurfer.ts
      📁 types
         📄 player.ts
      📁 utils
         📄 appControllerFilters.ts
         📄 appControllerUtils.ts
         📄 utils.ts
      🎨 App.css
      📄 App.tsx
      🎨 index.css
      📄 main.tsx
    .gitignore
   📝 README.md
   📄 eslint.config.js
   🌐 index.html
    package-lock.json
    package.json
    tsconfig.app.json
    tsconfig.json
    tsconfig.node.json
   📄 vite.config.ts
📁 docs
   📝 ARCHITECTURE.md
   📝 CURRENT_IMPLEMENTATION.md
📁 server
   📁 generated
      📁 prisma
          📁 internal
             📄 class.ts
             📄 prismaNamespace.ts
             📄 prismaNamespaceBrowser.ts
          📁 models
          📄 browser.ts
          📄 client.ts
          📄 commonInputTypes.ts
          📄 enums.ts
          📄 models.ts
   📁 prisma
      📁 migrations
         📁 0_init
             📄 migration.sql
      📄 schema.prisma
   📁 src
      📁 __test__
         📁 chunking
            📄 ChunkingService.test.ts
            📄 FFprobeMetadataProvider.test.ts
         📁 compression
            📄 CompressionPresets.test.ts
            📄 CompressionService.test.ts
            📄 CompressionValidator.test.ts
         📁 ffmpeg
            📄 FFmpegExecutor.test.ts
            📄 FFmpegService.integration.test.ts
            📄 FFmpegService.test.ts
            📄 FFmpegValidator.test.ts
         📁 segmentation
            📄 SegmentationService.test.ts
            📄 SegmentationStrategies.test.ts
         📁 streaming
            📄 StreamingPreparationService.test.ts
         📁 transcoding
             📄 TranscodingService.test.ts
      📁 constants
         📁 ffmpeg
             📄 index.ts
      📁 controllers
         📄 ChunkingController.ts
         📄 CompressionController.ts
         📄 FFmpegController.ts
         📄 FileController.ts
         📝 README.md
         📄 SegmentationController.ts
         📄 StreamingController.ts
         📄 TranscodingController.ts
      📁 dto
         📄 base.dto.ts
         📄 chunking.dto.ts
         📄 compression.dto.ts
         📄 ffmpeg.dto.ts
         📄 file.dto.ts
         📄 streaming.dto.ts
      📁 errors
         📁 chunking
            📄 ChunkingErrors.ts
         📁 compression
            📄 CompressionErrors.ts
         📁 ffmpeg
            📄 FFmpegErrors.ts
         📁 segmentation
            📄 SegmentationErrors.ts
         📁 streaming
            📄 StreamingErrors.ts
         📁 transcoding
             📄 TranscodingErrors.ts
      📁 interfaces
         📁 chunking
            📄 IChunkingService.ts
            📄 IMediaMetadataProvider.ts
         📁 compression
            📄 ICompressionService.ts
            📄 IFfmpegService.ts
         📁 ffmpeg
            📄 IFfmpegExecutor.ts
            📄 IFfmpegService.ts
         📁 file
            📄 IFileService.ts
         📁 segmentation
            📄 ISegmentationService.ts
         📁 streaming
            📄 IStreamingPreparationService.ts
         📁 transcoding
             📄 IFfmpegService.ts
             📄 ITranscodingService.ts
      📁 lib
         📄 prisma.ts
      📁 middleware
         📄 errorHandler.ts
      📁 routes
         📄 chunkingRoutes.ts
         📄 compressionRoutes.ts
         📄 ffmpegRoutes.ts
         📄 fileRoutes.ts
         📄 index.ts
         📄 segmentationRoutes.ts
         📄 streamingRoutes.ts
         📄 transcodingRoutes.ts
      📁 services
         📁 chunking
            📁 implementations
               📄 FFprobeMetadataProvider.ts
            📄 ChunkingService.ts
         📁 compression
            📁 presets
               📄 CompressionPresets.ts
            📄 CompressionService.ts
         📁 ffmpeg
            📁 implementations
               📄 FFmpegExecutor.ts
            📄 FFmpegService.ts
         📁 file
            📄 FileService.ts
         📁 segmentation
            📁 strategies
               📄 AdaptiveSegmentationStrategy.ts
               📄 FixedSegmentationStrategy.ts
               📄 ISegmentationStrategy.ts
               📄 LowLatencySegmentationStrategy.ts
               📄 ProgressiveSegmentationStrategy.ts
               📄 SegmentationStrategyFactory.ts
            📄 SegmentationService.ts
         📁 streaming
            📄 StreamingPreparationService.ts
         📁 transcoding
             📄 TranscodingService.ts
      📁 tests
         📄 db_test.ts
          postman_data.json
         📄 prisma_test.ts
      📁 types
         📁 chunking
            📄 ChunkingTypes.ts
         📁 compression
            📄 CompressionTypes.ts
         📁 ffmpeg
            📄 FFmpegTypes.ts
         📁 segmentation
            📄 SegmentationTypes.ts
         📁 streaming
            📄 StreamingTypes.ts
         📁 transcoding
             📄 TranscodingTypes.ts
      📁 validator
         📁 compression
            📄 CompressionValidator.ts
         📁 ffmpeg
            📄 FFmpegValidator.ts
         📁 segementation
         📁 streaming
         📁 transcoding
      📄 index.ts
    .gitignore
    package-lock.json
    package.json
   📄 prisma.config.ts
   📄 prisma_error.txt
    tsconfig.json
   📄 vitest.config.d.ts
   📄 vitest.config.js
   📄 vitest.config.ts
.gitignore
📝 Readme.md
 package-lock.json
```

---
*Generated by FileTree Pro Extension*
