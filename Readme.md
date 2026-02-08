# I-Player Decode & Streaming Overview

This document explains **how decoding and streaming work** in the current implementation, for both backend and frontend. It also covers what happens with very large inputs (e.g., **1 GB / 3 hours**).

## What Is Implemented (Current State)

### Backend
- **File registration & metadata** via FFprobe with raw codec fallbacks for telecom formats.
- **Decode / convert** endpoint (`POST /api/ffmpeg/decode`) supporting:
  - G.711 (µ-law / A-law), G.726, G.728, PCM
  - Output to WAV or MP3
- **Streaming sessions** (`POST /api/streaming/sessions`)
  - **File-based streaming** with HTTP Range support
  - **Live streaming** mode for large files (stream as FFmpeg transcodes)
- **Download** returns decoded file with correct extension.

### Frontend
- **File list** with sorting/filtering
- **Decode & Play** in WAV or MP3
- **WaveSurfer** waveform for normal-size files
- **Native audio player** for large/live streams to avoid out-of-memory issues
- **Seek / FF / Rewind / Volume**

---

## Backend Flow (Decode + Stream)

### 1) Upload & Metadata
Files are uploaded to `server/uploads`. The server extracts metadata and stores it in the database:
- `server/src/services/file/FileService.ts`
- `server/src/services/chunking/implementations/FFprobeMetadataProvider.ts`

### 2) Decode / Convert
Endpoint: `POST /api/ffmpeg/decode`

Main files:
- `server/src/controllers/FFmpegController.ts`
- `server/src/services/ffmpeg/FFmpegService.ts`
- `server/src/services/ffmpeg/implementations/FFmpegExecutor.ts`

Behavior:
- Validates input/output paths.
- For telecom codecs, applies the correct raw input args before `-i`.
- Output format is controlled by `output.format` (`wav` or `mp3`).
- For MP3 output, FFmpeg uses `libmp3lame`.

### 3) Streaming
Endpoint: `POST /api/streaming/sessions`

Main files:
- `server/src/controllers/StreamingController.ts`
- `server/src/services/streaming/StreamingPreparationService.ts`
- `server/src/types/streaming/StreamingTypes.ts`

Two modes:

1) **File-based streaming**  
   - Used when a decoded output file already exists.  
   - Uses HTTP Range support (`206 Partial Content`).

2) **Live streaming (large files)**  
   - Used when file is large or when no decoded output exists.
   - FFmpeg **transcodes and streams immediately** via `pipe:1`.
   - Optional **tee** output saves the final file (`processed/..._decoded.mp3` or `.wav`).

---

## Frontend Flow (Decode + Play)

Main files:
- `client/src/hooks/useAppController.ts`
- `client/src/hooks/useWaveSurfer.ts`
- `client/src/components/Player/Player.tsx`

Logic:
- If output already exists, **play immediately**.
- If not, either:
  - decode via `/ffmpeg/decode`, or
  - start live streaming if file is large.

Playback:
- **Normal files** -> WaveSurfer waveform.
- **Large files / live streams** -> native `<audio>` element to prevent memory crashes.

---

## Large File Scenario (1 GB / 3 Hours)

### What happens
1. File is uploaded to `server/uploads`.
2. Frontend detects large file size.
3. **Live streaming mode** is used.
4. FFmpeg:
   - streams output immediately to the client
   - continues decoding in the background
   - optionally saves compressed MP3 in `server/processed`
5. User can **play immediately**, without waiting for full decode.

### Why native audio is used
WaveSurfer loads full buffers and can cause **out-of-memory crashes** on very large files.  
The native player avoids this and is more stable for long recordings.

---

## Reference Files

Backend
- `server/src/controllers/FFmpegController.ts`
- `server/src/controllers/StreamingController.ts`
- `server/src/controllers/FileController.ts`
- `server/src/services/ffmpeg/FFmpegService.ts`
- `server/src/services/streaming/StreamingPreparationService.ts`
- `server/src/services/chunking/implementations/FFprobeMetadataProvider.ts`

Frontend
- `client/src/hooks/useAppController.ts`
- `client/src/hooks/useWaveSurfer.ts`
- `client/src/components/Player/Player.tsx`
- `client/src/components/FileTable/FileTable.tsx`
