# Transcoding Service – Codec Interoperability Layer

A production-ready, type-safe transcoding service for the iPlayer media system. This service converts PCM and telecom codec formats (G.711, G.726, G.728) into browser-playable formats (AAC, MP3, Opus), enabling playback in web browsers and modern media players.

---

## 📋 Table of Contents

- [What is Done](#what-is-done)
- [What is Not Done](#what-is-not-done)
- [Architecture & Logic](#architecture--logic)
- [Codec Flow Explanation](#codec-flow-explanation)
- [Transcoding Pipelines](#transcoding-pipelines)
- [Step-by-Step Flow](#step-by-step-flow)
- [Usage Examples](#usage-examples)
- [Testing](#testing)

---

## ✅ What is Done

### Core Functionality

1. **Telecom Codec Support**
   - ✅ **G.711** (μ-law/A-law): 8 kHz, mono
   - ✅ **G.726** (ADPCM): Multiple bitrates (8, 16, 24, 32 kbps)
   - ✅ **G.728** (LD-CELP): 16 kbps, 8 kHz
   - ✅ **PCM**: S16LE, S24LE support

2. **Browser-Playable Codecs**
   - ✅ **AAC**: Recommended default, excellent quality
   - ✅ **MP3**: Widely compatible
   - ✅ **Opus**: Modern, efficient
   - ✅ **PCM**: For further processing

3. **Transcoding Modes**
   - ✅ **Full**: Transcode entire file
   - ✅ **Chunk**: Transcode specific chunk (partial)
   - ✅ **Stream**: Transcode for streaming (time range)

4. **Codec Compatibility**
   - ✅ Compatibility matrix for source → target codecs
   - ✅ Recommended target codec selection
   - ✅ Automatic codec validation

5. **FFmpeg Integration**
   - ✅ Uses FFmpegService for actual transcoding
   - ✅ Proper codec parameter mapping
   - ✅ Error handling and validation

6. **Chunk-Based Transcoding**
   - ✅ Transcode individual chunks
   - ✅ Partial file transcoding
   - ✅ Time-range transcoding

7. **SOLID Principles**
   - ✅ **Dependency Inversion**: Depends on FFmpeg service interface
   - ✅ **Single Responsibility**: Transcoding logic only
   - ✅ **Open/Closed**: Extensible via interfaces

8. **Testing**
   - ✅ 13 unit tests covering all operations
   - ✅ Mock-based isolation
   - ✅ Error handling tests

---

## ❌ What is Not Done

### Missing Features

1. **Advanced Transcoding**
   - ❌ Two-pass transcoding
   - ❌ Variable bitrate (VBR)
   - ❌ Quality-based transcoding
   - ❌ Perceptual optimization

2. **Batch Transcoding**
   - ❌ Multiple file transcoding
   - ❌ Parallel transcoding
   - ❌ Transcoding queue
   - ❌ Progress tracking

3. **Transcoding Caching**
   - ❌ Cache transcoded files
   - ❌ Transcoding result persistence
   - ❌ Cache invalidation

4. **Advanced Codec Support**
   - ❌ Video codec transcoding
   - ❌ Container format conversion
   - ❌ Multi-stream transcoding

5. **Real-Time Transcoding**
   - ❌ Live transcoding
   - ❌ On-the-fly transcoding
   - ❌ Adaptive bitrate transcoding

---

## 🏗️ Architecture & Logic

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              TranscodingService                          │
│         (Codec Interoperability Layer)                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Transcode│  │  Chunk   │  │ Streaming│  │Recommend││
│  │          │  │ Transcode│  │ Transcode│  │ Codec  ││
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬───┘│
│       │            │             │              │       │
│       └────────────┴─────────────┴──────────────┘       │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  Validator │                        │
│                    └─────┬──────┘                       │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  FFmpeg    │                        │
│                    │  Service   │                        │
│                    │ (Interface)│                        │
│                    └─────┬──────┘                       │
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │ FFmpegService         │                  │
│              │ (Implementation)      │                  │
│              └───────────┬───────────┘                  │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  FFmpeg    │                       │
│                    │  Process   │                       │
│                    └────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. **TranscodingService** (Main Service)
- **Purpose**: Orchestrate transcoding operations
- **Responsibilities**:
  - Validate input parameters
  - Build transcoding configuration
  - Execute transcoding via FFmpeg
  - Handle codec compatibility
  - Provide recommendations

#### 2. **Codec Compatibility Matrix**
- **Purpose**: Define compatible codec pairs
- **Responsibilities**:
  - Map source codecs to compatible targets
  - Recommend optimal target codecs
  - Validate codec combinations

---

## 🎯 Codec Flow Explanation

### Source Codecs (Telecom)

#### G.711 (μ-law/A-law)
- **Format**: Lossy compression
- **Sample Rate**: 8 kHz
- **Channels**: Mono (1)
- **Bitrate**: 64 kbps
- **Use Case**: Traditional telephony
- **Transcoding**: Requires sample rate upsampling (8 kHz → 44.1 kHz)

**Flow:**
```
G.711 (8 kHz, mono) 
  → Decode to PCM 
  → Upsample to 44.1 kHz 
  → Convert to stereo 
  → Encode to AAC/MP3/Opus
```

#### G.726 (ADPCM)
- **Format**: Adaptive Differential PCM
- **Sample Rate**: 8 kHz
- **Channels**: Mono (1)
- **Bitrates**: 8, 16, 24, 32 kbps
- **Use Case**: Digital telephony
- **Transcoding**: Requires bitrate specification

**Flow:**
```
G.726 (8 kHz, mono, 32 kbps) 
  → Decode to PCM (with bitrate) 
  → Upsample to 44.1 kHz 
  → Convert to stereo 
  → Encode to AAC/MP3/Opus
```

#### G.728 (LD-CELP)
- **Format**: Low-Delay Code-Excited Linear Prediction
- **Sample Rate**: 8 kHz
- **Channels**: Mono (1)
- **Bitrate**: 16 kbps
- **Use Case**: Low-bitrate telephony
- **Transcoding**: Similar to G.711

**Flow:**
```
G.728 (8 kHz, mono, 16 kbps) 
  → Decode to PCM 
  → Upsample to 44.1 kHz 
  → Convert to stereo 
  → Encode to AAC/MP3/Opus
```

### Target Codecs (Browser-Playable)

#### AAC (Recommended)
- **Format**: Advanced Audio Coding
- **Sample Rate**: 44.1 kHz (standard)
- **Channels**: Stereo (2)
- **Bitrate**: 96-192 kbps
- **Compatibility**: Excellent browser support
- **Quality**: High quality at low bitrates

#### MP3
- **Format**: MPEG Audio Layer III
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo (2)
- **Bitrate**: 128-192 kbps
- **Compatibility**: Universal
- **Quality**: Good quality, larger files

#### Opus
- **Format**: Modern audio codec
- **Sample Rate**: 48 kHz (can handle 44.1 kHz)
- **Channels**: Stereo (2)
- **Bitrate**: 64-128 kbps
- **Compatibility**: Modern browsers
- **Quality**: Excellent quality, efficient

---

## 🔄 Transcoding Pipelines

### Pipeline 1: Full File Transcoding

```
Input: G.711 file (telecom format)
  │
  ├─► [Validate Input]
  │     ├─► File exists?
  │     ├─► Codec detected?
  │     └─► Parameters valid?
  │
  ├─► [Build Configuration]
  │     ├─► Source: G.711, 8 kHz, mono
  │     ├─► Target: AAC, 44.1 kHz, stereo
  │     └─► Mode: full
  │
  ├─► [FFmpeg Transcoding]
  │     ├─► Decode G.711 → PCM
  │     ├─► Upsample: 8 kHz → 44.1 kHz
  │     ├─► Convert: mono → stereo
  │     └─► Encode: PCM → AAC
  │
  └─► [Output]
        └─► AAC file (browser-playable)
```

### Pipeline 2: Chunk-Based Transcoding

```
Input: Chunk file (G.711, 10 seconds)
  │
  ├─► [Validate Chunk]
  │     ├─► Chunk file exists?
  │     ├─► Source encoding valid?
  │     └─► Target encoding valid?
  │
  ├─► [Build Chunk Configuration]
  │     ├─► Source: G.711, 8 kHz, mono
  │     ├─► Target: AAC, 44.1 kHz, stereo
  │     └─► Mode: chunk
  │
  ├─► [FFmpeg Chunk Transcoding]
  │     ├─► Decode chunk → PCM
  │     ├─► Upsample chunk
  │     ├─► Convert to stereo
  │     └─► Encode chunk → AAC
  │
  └─► [Output]
        └─► Transcoded chunk (AAC, ready for streaming)
```

### Pipeline 3: Streaming Transcoding

```
Input: Full file, time range (10s - 40s)
  │
  ├─► [Validate Time Range]
  │     ├─► Start time >= 0?
  │     ├─► Duration > 0?
  │     └─► Range within file?
  │
  ├─► [Build Streaming Configuration]
  │     ├─► Source: G.711, 8 kHz, mono
  │     ├─► Target: AAC, 44.1 kHz, stereo
  │     ├─► Mode: stream
  │     ├─► Start: 10s
  │     └─► Duration: 30s
  │
  ├─► [FFmpeg Streaming Transcoding]
  │     ├─► Seek to start time (-ss 10)
  │     ├─► Decode range → PCM
  │     ├─► Upsample range
  │     ├─► Convert to stereo
  │     ├─► Encode range → AAC
  │     └─► Limit duration (-t 30)
  │
  └─► [Output]
        └─► Streaming segment (AAC, 30 seconds)
```

---

## 🔄 Step-by-Step Flow

### Example: Transcoding G.711 to AAC

```
Step 1: User calls TranscodingService.transcode()
        │
        ├─> Input: { filePath: 'call.g711', sourceCodec: 'g711', targetCodec: 'aac' }
        │
Step 2: Service validates input
        │
        ├─> Validates file exists
        ├─> Validates source codec
        ├─> Validates target codec
        │
Step 3: Service builds configuration
        │
        ├─> Source: { codec: 'g711', sampleRate: 8000, channels: 1 }
        ├─> Target: { codec: 'aac', sampleRate: 44100, channels: 2 }
        ├─> Mode: 'full'
        │
Step 4: Service checks codec compatibility
        │
        ├─> G.711 → AAC: Compatible ✓
        ├─> Recommended target: AAC ✓
        │
Step 5: Service generates output path
        │
        ├─> Input: 'call.g711'
        ├─> Output: 'call_aac.aac'
        │
Step 6: Service calls FFmpeg service
        │
        ├─> FFmpeg transcode({
        │     input: { path: 'call.g711' },
        │     output: { path: 'call_aac.aac' },
        │     sourceEncoding: { codec: 'g711', sampleRate: 8000, channels: 1 },
        │     targetEncoding: { codec: 'aac', sampleRate: 44100, channels: 2 }
        │   })
        │
Step 7: FFmpeg processes file
        │
        ├─> Decode G.711 → PCM (8 kHz, mono)
        ├─> Upsample PCM: 8 kHz → 44.1 kHz
        ├─> Convert PCM: mono → stereo
        ├─> Encode PCM → AAC (44.1 kHz, stereo)
        │
Step 8: Service gets file sizes
        │
        ├─> Original: 1,000,000 bytes
        ├─> Transcoded: 500,000 bytes
        │
Step 9: Service returns result
        │
        └─> Returns: {
              outputPath: 'call_aac.aac',
              originalSize: 1000000,
              transcodedSize: 500000,
              sourceCodec: 'g711',
              targetCodec: 'aac',
              executionTime: 2000
            }
```

### Example: Chunk Transcoding

```
Step 1: User calls TranscodingService.transcodeChunk()
        │
        ├─> Input: {
        │     inputPath: 'chunk_0.g711',
        │     outputPath: 'chunk_0.aac',
        │     sourceEncoding: { codec: 'g711', sampleRate: 8000, channels: 1 },
        │     targetEncoding: { codec: 'aac', sampleRate: 44100, channels: 2 }
        │   }
        │
Step 2: Service validates chunk
        │
        ├─> Chunk file exists? ✓
        ├─> Source encoding valid? ✓
        ├─> Target encoding valid? ✓
        │
Step 3: Service calls FFmpeg for chunk
        │
        ├─> FFmpeg transcode chunk
        ├─> Process: G.711 → PCM → AAC
        │
Step 4: Service returns chunk result
        │
        └─> Returns: {
              outputPath: 'chunk_0.aac',
              sourceCodec: 'g711',
              targetCodec: 'aac',
              config: { mode: 'chunk' }
            }
```

---

## 💡 Usage Examples

### Basic Transcoding

```typescript
import { TranscodingService } from './services/transcoding/index.js';
import { FFmpegService } from './services/ffmpeg/index.js';

const ffmpegService = new FFmpegService();
const transcodingService = new TranscodingService(ffmpegService);

// Transcode G.711 to AAC
const result = await transcodingService.transcode('call.g711', {
  sourceCodec: 'g711',
  targetCodec: 'aac'
});

console.log(`Transcoded: ${result.outputPath}`);
console.log(`Size: ${result.transcodedSize} bytes`);
console.log(`Time: ${result.executionTime}ms`);
```

### G.726 Transcoding (with bitrate)

```typescript
// G.726 requires bitrate specification
const result = await transcodingService.transcode('call.g726', {
  sourceCodec: 'g726',
  sourceBitrate: 32, // Required for G.726
  targetCodec: 'aac'
});
```

### Chunk Transcoding

```typescript
// Transcode a single chunk
const result = await transcodingService.transcodeChunk({
  inputPath: 'chunk_0.g711',
  outputPath: 'chunk_0.aac',
  sourceEncoding: {
    codec: 'g711',
    sampleRate: 8000,
    channels: 1
  },
  targetEncoding: {
    codec: 'aac',
    sampleRate: 44100,
    channels: 2
  }
});
```

### Streaming Transcoding

```typescript
// Transcode a time range for streaming
const result = await transcodingService.transcodeForStreaming(
  'call.g711',
  10,  // Start time (seconds)
  30,  // Duration (seconds)
  {
    sourceCodec: 'g711',
    targetCodec: 'aac'
  }
);
```

### Get Recommended Codec

```typescript
// Get recommended target codec
const recommended = transcodingService.getRecommendedTargetCodec('g711');
console.log(`Recommended: ${recommended}`); // 'aac'
```

---

## 🧪 Testing

### Run Tests

```bash
npm test -- TranscodingService
```

### Test Coverage

- **TranscodingService**: 13 tests
  - Full file transcoding
  - Chunk transcoding
  - Streaming transcoding
  - Codec recommendations
  - Error handling
  - Validation

### Test Results

```
✓ 13 tests passing
✓ All transcoding scenarios covered
✓ Error handling verified
```

---

## 📁 File Structure

```
transcoding/
├── __tests__/                    # Unit tests
│   └── TranscodingService.test.ts
├── errors/                       # Custom error classes
│   └── TranscodingErrors.ts
├── interfaces/                   # Dependency inversion interfaces
│   ├── ITranscodingService.ts
│   └── IFfmpegService.ts
├── types/                        # TypeScript type definitions
│   └── TranscodingTypes.ts
├── TranscodingService.ts         # Main service
├── index.ts                       # Public API exports
└── README.md                      # This file
```

---

## 📝 Notes

- **Telecom Codecs**: G.711, G.726, G.728 are low-sample-rate, mono formats
- **Upsampling**: Required to convert 8 kHz → 44.1 kHz for browser playback
- **Stereo Conversion**: Mono → Stereo conversion for better compatibility
- **G.726 Bitrate**: Must specify bitrate (8, 16, 24, 32 kbps) for G.726
- **Chunk Support**: Enables partial transcoding for streaming scenarios
- **FFmpeg Dependency**: Uses FFmpegService for actual transcoding operations

---

## 🤝 Contributing

When adding new features:

1. Follow SOLID principles
2. Maintain FFmpeg integration
3. Add comprehensive tests
4. Update type definitions
5. Document in this README
6. Maintain backward compatibility

---

## 📄 License

Part of the iPlayer media system.

---

**Last Updated**: 2024
**Status**: ✅ Production Ready (Core Features Complete)
