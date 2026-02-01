# Chunking Service – Time-Based Media Control

A production-ready, type-safe chunking service for the iPlayer media system. This service splits large media files into time-based chunks, enabling fast-forward, rewind, partial streaming, and random access playback.

---

## 📋 Table of Contents

- [What is Done](#what-is-done)
- [What is Not Done](#what-is-not-done)
- [Architecture & Logic](#architecture--logic)
- [Chunking Algorithm](#chunking-algorithm)
- [How This Enables Playback Controls](#how-this-enables-playback-controls)
- [Step-by-Step Flow](#step-by-step-flow)
- [Future Enhancements](#future-enhancements)
- [Usage Examples](#usage-examples)
- [Testing](#testing)

---

## ✅ What is Done

### Core Functionality

1. **Time-Based Chunking**
   - ✅ Splits media files into time-based chunks (default: 2 minutes)
   - ✅ Configurable chunk duration
   - ✅ Handles files of any size (tested up to 1+ hour files)
   - ✅ Deterministic chunk boundaries

2. **Chunk Metadata Generation**
   - ✅ Index (zero-based)
   - ✅ Start time (seconds)
   - ✅ End time (seconds, exclusive)
   - ✅ Duration (seconds)
   - ✅ Optional file paths for chunk files
   - ✅ Optional byte offset and size

3. **Random Access Support**
   - ✅ **Seek**: Find chunk at specific time position
   - ✅ **Fast Forward**: Get next chunks
   - ✅ **Rewind**: Get previous chunks
   - ✅ Binary search for efficient chunk lookup (O(log n))

4. **Range Queries**
   - ✅ Get chunks within a time range
   - ✅ Efficient filtering of overlapping chunks
   - ✅ Support for partial chunk ranges

5. **Codec & Format Agnostic**
   - ✅ Works with any media format
   - ✅ No codec-specific logic
   - ✅ Format-independent chunking

6. **Metadata Provider Abstraction**
   - ✅ Interface-based design (`IMediaMetadataProvider`)
   - ✅ FFprobe implementation included
   - ✅ Easy to swap with other providers
   - ✅ Testable with mock providers

7. **SOLID Principles**
   - ✅ **Single Responsibility**: Each class has one clear purpose
   - ✅ **Open/Closed**: Extensible via interfaces
   - ✅ **Liskov Substitution**: Interface implementations are interchangeable
   - ✅ **Interface Segregation**: Focused, minimal interfaces
   - ✅ **Dependency Inversion**: Depends on abstractions

8. **Error Handling**
   - ✅ `ChunkingValidationError` - Invalid parameters
   - ✅ `ChunkingFileError` - File operation errors
   - ✅ `ChunkingMetadataError` - Metadata retrieval errors
   - ✅ `ChunkingSeekError` - Seek operation errors

9. **Testing**
   - ✅ 17 unit tests covering all operations
   - ✅ Mock-based testing for isolation
   - ✅ Edge case handling (short files, long files, exact matches)

---

## ❌ What is Not Done

### Missing Features

1. **Physical Chunk File Generation**
   - ❌ Actual file splitting (currently metadata only)
   - ❌ Integration with FFmpeg for chunk extraction
   - ❌ Chunk file storage management
   - ❌ Chunk file cleanup/deletion

2. **Byte-Level Chunking**
   - ❌ Byte offset calculation (requires codec-specific knowledge)
   - ❌ Byte size calculation for chunks
   - ❌ Precise byte boundaries

3. **Advanced Chunking Strategies**
   - ❌ Variable chunk sizes (adaptive chunking)
   - ❌ Keyframe-aware chunking
   - ❌ Quality-based chunking
   - ❌ Multi-pass chunking

4. **Caching & Performance**
   - ❌ Chunk metadata caching
   - ❌ Metadata persistence (database/file)
   - ❌ Incremental chunking
   - ❌ Parallel chunk generation

5. **Streaming Integration**
   - ❌ HTTP range request support
   - ❌ Chunk streaming endpoints
   - ❌ Progressive chunk loading
   - ❌ Chunk preloading strategies

6. **Advanced Seek Features**
   - ❌ Seek to keyframe
   - ❌ Smooth seeking with buffering
   - ❌ Seek preview/thumbnail
   - ❌ Multi-level seek (coarse/fine)

7. **Chunk Management**
   - ❌ Chunk versioning
   - ❌ Chunk validation/verification
   - ❌ Chunk metadata updates
   - ❌ Chunk deletion/archival

8. **Monitoring & Analytics**
   - ❌ Chunk access tracking
   - ❌ Performance metrics
   - ❌ Usage analytics
   - ❌ Health checks

---

## 🏗️ Architecture & Logic

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  ChunkingService                        │
│              (Time-Based Chunking)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Generate │  │   Seek   │  │  Range   │  │  Get   ││
│  │  Chunks  │  │          │  │  Query   │  │ Chunk  ││
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬───┘│
│       │            │             │              │       │
│       └────────────┴─────────────┴──────────────┘       │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  Metadata │                        │
│                    │  Provider │                        │
│                    │ (Interface)│                       │
│                    └─────┬──────┘                       │
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │ FFprobeMetadata       │                  │
│              │ Provider              │                  │
│              │ (Implementation)      │                  │
│              └───────────┬───────────┘                  │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  FFprobe   │                       │
│                    │  Process   │                       │
│                    └────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. **ChunkingService** (Main Service)
- **Purpose**: Generate and manage time-based chunks
- **Responsibilities**:
  - Calculate chunk boundaries
  - Generate chunk metadata
  - Support seek operations
  - Handle range queries
  - Validate inputs

#### 2. **IMediaMetadataProvider** (Metadata Interface)
- **Purpose**: Abstract media metadata retrieval
- **Responsibilities**:
  - Get media duration
  - Get file size (optional)
  - Get format/codec info (optional)
  - Check availability

#### 3. **FFprobeMetadataProvider** (Metadata Implementation)
- **Purpose**: Extract metadata using FFprobe
- **Responsibilities**:
  - Execute FFprobe commands
  - Parse JSON output
  - Extract duration and metadata
  - Handle errors

### Design Patterns Used

1. **Strategy Pattern**: `IMediaMetadataProvider` allows different metadata sources
2. **Dependency Injection**: Metadata provider injected via constructor
3. **Factory Pattern**: Service creates default provider if none provided
4. **Binary Search**: Efficient chunk lookup (O(log n) vs O(n))

---

## 🔢 Chunking Algorithm

### Core Algorithm

The chunking algorithm is **deterministic** and **time-based**:

```typescript
function calculateChunks(totalDuration, chunkDuration) {
  chunks = []
  numChunks = ceil(totalDuration / chunkDuration)
  
  for i = 0 to numChunks - 1:
    startTime = i * chunkDuration
    endTime = min(startTime + chunkDuration, totalDuration)
    duration = endTime - startTime
    
    chunk = {
      index: i,
      startTime: startTime,
      endTime: endTime,
      duration: duration
    }
    
    chunks.push(chunk)
  
  return chunks
}
```

### Algorithm Characteristics

1. **Deterministic**: Same input always produces same output
2. **Time-Based**: Boundaries are time-aligned, not byte-aligned
3. **Uniform Chunks**: All chunks (except last) have same duration
4. **Last Chunk**: May be shorter if duration doesn't divide evenly

### Example Calculation

**Input:**
- Total Duration: 300 seconds (5 minutes)
- Chunk Duration: 120 seconds (2 minutes)

**Output:**
```
Chunk 0: 0s - 120s (duration: 120s)
Chunk 1: 120s - 240s (duration: 120s)
Chunk 2: 240s - 300s (duration: 60s)  ← Last chunk is shorter
```

**Total Chunks:** 3

### Edge Cases Handled

1. **Exact Division**: If `totalDuration % chunkDuration === 0`, all chunks are equal
2. **Short Files**: If `totalDuration < chunkDuration`, single chunk with full duration
3. **Very Long Files**: Algorithm scales to any duration (tested with 1+ hour files)
4. **Zero Duration**: Handled by validation (throws error)

### Time Complexity

- **Chunk Generation**: O(n) where n = number of chunks
- **Chunk Lookup (Seek)**: O(log n) using binary search
- **Range Query**: O(n) for filtering, but typically returns small subset

### Space Complexity

- **Chunk Metadata**: O(n) where n = number of chunks
- **Memory Efficient**: Only stores metadata, not actual media data

---

## 🎮 How This Enables Playback Controls

### Fast Forward

**How it works:**
1. User clicks "Fast Forward" → jump forward by chunk duration
2. Service calculates current chunk index
3. Returns next chunk(s) metadata
4. Player loads and plays next chunk(s)

**Example:**
```typescript
// Current position: 150 seconds (chunk 1)
const currentChunk = await service.getChunkAtTime(filePath, 150);
// Returns: Chunk 1 (120s - 240s)

// Fast forward: jump to next chunk
const nextChunk = await service.getChunk(filePath, currentChunk.index + 1);
// Returns: Chunk 2 (240s - 300s)
```

### Rewind

**How it works:**
1. User clicks "Rewind" → jump backward by chunk duration
2. Service calculates current chunk index
3. Returns previous chunk(s) metadata
4. Player loads and plays previous chunk(s)

**Example:**
```typescript
// Current position: 150 seconds (chunk 1)
const currentChunk = await service.getChunkAtTime(filePath, 150);

// Rewind: jump to previous chunk
const prevChunk = await service.getChunk(filePath, currentChunk.index - 1);
// Returns: Chunk 0 (0s - 120s)
```

### Seek (Jump to Position)

**How it works:**
1. User seeks to specific time (e.g., 5:30)
2. Service uses binary search to find containing chunk
3. Returns chunk metadata + offset within chunk
4. Player seeks to exact position in chunk

**Example:**
```typescript
// User seeks to 5 minutes 30 seconds (330 seconds)
const result = await service.seek(filePath, { time: 330 });

// Returns:
// {
//   chunk: { index: 2, startTime: 240, endTime: 360, ... },
//   offsetInChunk: 90,  // 330 - 240 = 90 seconds into chunk
//   exact: true
// }

// Player can now:
// 1. Load chunk 2
// 2. Seek to 90 seconds within that chunk
// 3. Resume playback
```

### Partial Streaming

**How it works:**
1. Player requests chunks for a time range
2. Service returns all chunks overlapping the range
3. Player loads chunks progressively
4. Enables efficient bandwidth usage

**Example:**
```typescript
// User wants to stream from 2:00 to 4:00 (120s - 240s)
const chunks = await service.getChunksInRange(filePath, 120, 240);

// Returns: [Chunk 1, Chunk 2] (overlapping chunks)
// Player can:
// 1. Load chunk 1 first
// 2. Preload chunk 2 in background
// 3. Seamlessly transition between chunks
```

### Random Access

**How it works:**
1. User clicks on timeline at arbitrary position
2. Service finds chunk containing that time
3. Returns chunk metadata instantly (O(log n))
4. Player can immediately load and play that chunk

**Benefits:**
- **Fast**: Binary search is O(log n), not O(n)
- **Efficient**: No need to scan entire file
- **Scalable**: Works with files of any size

---

## 🔄 Step-by-Step Flow

### Example: Generating Chunks for a 5-Minute Audio File

```
Step 1: User calls ChunkingService.generateChunks()
        │
        ├─> Input: { filePath: 'audio.mp3', chunkDuration: 120 }
        │
Step 2: Service validates file exists
        │
        ├─> Check: existsSync('audio.mp3')
        ├─> Result: true
        │
Step 3: Service gets media metadata
        │
        ├─> Calls: metadataProvider.getMetadata('audio.mp3')
        ├─> FFprobe executes: ffprobe -show_entries format=duration ...
        ├─> Returns: { duration: 300, ... }
        │
Step 4: Service calculates chunks
        │
        ├─> numChunks = ceil(300 / 120) = 3
        ├─> Chunk 0: startTime=0, endTime=120, duration=120
        ├─> Chunk 1: startTime=120, endTime=240, duration=120
        ├─> Chunk 2: startTime=240, endTime=300, duration=60
        │
Step 5: Service returns result
        │
        └─> Returns: {
              chunks: [Chunk0, Chunk1, Chunk2],
              totalChunks: 3,
              totalDuration: 300,
              chunkDuration: 120,
              lastChunkDuration: 60
            }
```

### Example: Seeking to 2 Minutes 30 Seconds

```
Step 1: User calls ChunkingService.seek()
        │
        ├─> Input: { filePath: 'audio.mp3', time: 150 }
        │
Step 2: Service generates chunks (if not cached)
        │
        ├─> Calls: generateChunks('audio.mp3')
        ├─> Returns: [Chunk0, Chunk1, Chunk2]
        │
Step 3: Service validates time
        │
        ├─> Check: 150 >= 0 && 150 <= 300
        ├─> Result: true
        │
Step 4: Service finds chunk using binary search
        │
        ├─> Binary search on chunks array
        ├─> left=0, right=2, mid=1
        ├─> Check: 150 >= 120 && 150 < 240? → true
        ├─> Found: Chunk 1
        │
Step 5: Service calculates offset
        │
        ├─> offsetInChunk = 150 - 120 = 30 seconds
        ├─> exact = true (150 is within chunk boundaries)
        │
Step 6: Service returns result
        │
        └─> Returns: {
              chunk: Chunk1,
              offsetInChunk: 30,
              exact: true
            }
```

### Logic Flow Diagram

```
User Request (Seek to 150s)
    │
    ▼
[ChunkingService.seek()]
    │
    ├─► [Validate File Exists]
    │       │
    │       └─► File exists? ──NO──► Throw FileError
    │               │
    │               YES
    │
    ├─► [Get Media Metadata]
    │       │
    │       └─► FFprobe → { duration: 300 }
    │
    ├─► [Generate Chunks]
    │       │
    │       ├─► Calculate: numChunks = ceil(300/120) = 3
    │       ├─► Generate: [Chunk0, Chunk1, Chunk2]
    │       │
    │       └─► Chunks: [
    │             { index: 0, startTime: 0, endTime: 120 },
    │             { index: 1, startTime: 120, endTime: 240 },
    │             { index: 2, startTime: 240, endTime: 300 }
    │           ]
    │
    ├─► [Validate Time]
    │       │
    │       └─► 150 >= 0 && 150 <= 300? ──NO──► Throw SeekError
    │               │
    │               YES
    │
    ├─► [Binary Search for Chunk]
    │       │
    │       ├─► left=0, right=2
    │       ├─► mid=1, chunk=Chunk1
    │       ├─► 150 >= 120 && 150 < 240? ──YES──► Found!
    │       │
    │       └─► Return Chunk1
    │
    ├─► [Calculate Offset]
    │       │
    │       └─► offset = 150 - 120 = 30s
    │
    └─► [Return Result]
            │
            └─► { chunk: Chunk1, offsetInChunk: 30, exact: true }
```

---

## 🚀 Future Enhancements

### High Priority

1. **Physical Chunk Generation**
   ```typescript
   async generateChunkFiles(
     filePath: string,
     options: ChunkingOptions
   ): Promise<ChunkingResult>
   // Uses FFmpeg to extract actual chunk files
   ```

2. **Chunk Metadata Caching**
   ```typescript
   interface ChunkCache {
     get(filePath: string): Promise<ChunkingResult | null>;
     set(filePath: string, result: ChunkingResult): Promise<void>;
   }
   ```

3. **Byte-Level Chunking**
   ```typescript
   interface ChunkMetadata {
     byteOffset: number;  // Precise byte position
     byteSize: number;    // Exact chunk size in bytes
   }
   ```

### Medium Priority

4. **Keyframe-Aware Chunking**
   - Align chunks to keyframes for better seeking
   - Reduce decoding overhead

5. **Adaptive Chunk Sizes**
   - Variable chunk sizes based on content
   - Smaller chunks for action scenes, larger for static scenes

6. **HTTP Range Request Support**
   ```typescript
   getChunkRangeRequest(
     filePath: string,
     chunkIndex: number
   ): { start: number, end: number }
   ```

### Low Priority

7. **Chunk Analytics**
   - Track which chunks are accessed most
   - Optimize preloading based on usage patterns

8. **Multi-Format Chunking**
   - Generate chunks in multiple formats simultaneously
   - Support adaptive bitrate streaming

---

## 💡 Usage Examples

### Basic Chunking

```typescript
import { ChunkingService } from './services/chunking/index.js';

const chunkingService = new ChunkingService();

// Generate chunks for a media file
const result = await chunkingService.generateChunks('audio.mp3', {
  chunkDuration: 120 // 2 minutes per chunk
});

console.log(`Total chunks: ${result.totalChunks}`);
console.log(`Chunk duration: ${result.chunkDuration}s`);

// Access individual chunks
result.chunks.forEach(chunk => {
  console.log(`Chunk ${chunk.index}: ${chunk.startTime}s - ${chunk.endTime}s`);
});
```

### Seek Operation

```typescript
// Seek to 5 minutes 30 seconds
const seekResult = await chunkingService.seek('audio.mp3', {
  time: 330, // 5:30 in seconds
  exact: false // Allow nearest chunk
});

console.log(`Found chunk: ${seekResult.chunk.index}`);
console.log(`Offset in chunk: ${seekResult.offsetInChunk}s`);
console.log(`Exact match: ${seekResult.exact}`);
```

### Fast Forward / Rewind

```typescript
// Get current chunk
const currentTime = 150; // 2:30
const currentChunk = await chunkingService.getChunkAtTime('audio.mp3', currentTime);

// Fast forward: next chunk
const nextChunk = await chunkingService.getChunk('audio.mp3', currentChunk.index + 1);

// Rewind: previous chunk
const prevChunk = await chunkingService.getChunk('audio.mp3', currentChunk.index - 1);
```

### Range Query

```typescript
// Get chunks for time range (2:00 to 4:00)
const chunks = await chunkingService.getChunksInRange(
  'audio.mp3',
  120, // Start time
  240  // End time
);

// Load chunks for streaming
chunks.forEach(chunk => {
  console.log(`Load chunk ${chunk.index}: ${chunk.startTime}s - ${chunk.endTime}s`);
});
```

### Custom Metadata Provider

```typescript
import { ChunkingService } from './services/chunking/index.js';
import type { IMediaMetadataProvider } from './services/chunking/index.js';

class DatabaseMetadataProvider implements IMediaMetadataProvider {
  async getMetadata(filePath: string) {
    // Get metadata from database
    const record = await db.mediaFiles.findOne({ path: filePath });
    return {
      duration: record.duration,
      fileSize: record.size
    };
  }
  
  async isAvailable() { return true; }
}

const service = new ChunkingService(new DatabaseMetadataProvider());
```

---

## 🧪 Testing

### Run Tests

```bash
npm test -- ChunkingService              # Run chunking service tests
npm test -- FFprobeMetadataProvider     # Run metadata provider tests
npm test -- chunking                    # Run all chunking tests
```

### Test Coverage

- **ChunkingService**: 17 tests
  - Chunk generation
  - Seek operations
  - Range queries
  - Edge cases

- **FFprobeMetadataProvider**: Tests with mocked FFprobe
  - Metadata parsing
  - Error handling
  - Availability checks

### Test Results

```
✓ 17 tests passing
✓ All edge cases covered
✓ Mock-based isolation
✓ Deterministic algorithm verified
```

---

## 📁 File Structure

```
chunking/
├── __tests__/                    # Unit tests
│   ├── ChunkingService.test.ts
│   └── FFprobeMetadataProvider.test.ts
├── errors/                       # Custom error classes
│   └── ChunkingErrors.ts
├── implementations/              # Concrete implementations
│   └── FFprobeMetadataProvider.ts
├── interfaces/                   # Dependency inversion interfaces
│   ├── IChunkingService.ts
│   └── IMediaMetadataProvider.ts
├── types/                        # TypeScript type definitions
│   └── ChunkingTypes.ts
├── ChunkingService.ts            # Main service
├── index.ts                      # Public API exports
└── README.md                     # This file
```

---

## 🔧 Configuration

### Default Settings

- **Chunk Duration**: 120 seconds (2 minutes)
- **Metadata Provider**: FFprobeMetadataProvider
- **File Generation**: Disabled by default (metadata only)

### Supported Operations

- `generateChunks()` - Generate all chunks
- `getChunk()` - Get specific chunk by index
- `getAllChunks()` - Get all chunks
- `seek()` - Find chunk at time position
- `getChunkAtTime()` - Get chunk containing time
- `getChunksInRange()` - Get chunks in time range

---

## 📝 Notes

- **Time-Based Only**: Chunking is time-based, not byte-based
- **Metadata Only**: Service generates metadata, not physical chunk files
- **Codec Agnostic**: Works with any media format/codec
- **Transport Independent**: No network logic, pure chunking logic
- **Deterministic**: Same input always produces same output
- **Efficient**: Binary search for O(log n) chunk lookup

---

## 🤝 Contributing

When adding new features:

1. Follow SOLID principles
2. Maintain codec/format agnosticism
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
