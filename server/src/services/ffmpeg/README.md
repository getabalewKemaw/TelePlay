# FFmpeg Service - Core Execution Layer

A production-ready, type-safe FFmpeg wrapper service for the iPlayer media system. This service acts as the single, controlled gateway to FFmpeg execution, supporting audio decoding, encoding, transcoding, and format conversion with comprehensive validation and error handling.

---

## 📋 Table of Contents

- [What is Done](#what-is-done)
- [What is Not Done](#what-is-not-done)
- [Architecture & Logic](#architecture--logic)
- [Step-by-Step Flow](#step-by-step-flow)
- [Future Enhancements](#future-enhancements)
- [Usage Examples](#usage-examples)
- [Testing](#testing)

---

## ✅ What is Done

### Core Functionality

1. **Single Gateway Pattern**
   - `FFmpegService` is the only entry point for all FFmpeg operations
   - No raw shell/command execution elsewhere in the codebase
   - Centralized control and monitoring

2. **Type-Safe Interfaces**
   - Complete TypeScript type definitions
   - Type-safe parameters for all operations
   - Compile-time safety for codecs, sample rates, channels

3. **Four Core Operations**
   - ✅ **Decode**: Convert encoded audio to raw PCM or another format
   - ✅ **Encode**: Encode audio with specified parameters (codec, sample rate, channels, bitrate)
   - ✅ **Transcode**: Convert between different codecs/formats with source and target encoding specs
   - ✅ **Convert**: Format conversion with optional encoding parameters

4. **Comprehensive Validation**
   - ✅ Codec validation (G711, G726, G728, PCM, AAC, MP3, Opus)
   - ✅ Sample rate validation (8000, 16000, 22050, 44100, 48000 Hz)
   - ✅ Channel validation (1 = mono, 2 = stereo)
   - ✅ Bitrate validation (1-10000 kbps)
   - ✅ File path validation (existence, readability, writability)
   - ✅ Input/output directory validation

5. **Error Handling**
   - ✅ Custom error classes with error codes
   - ✅ `FFmpegValidationError` - Invalid parameters
   - ✅ `FFmpegExecutionError` - FFmpeg process failures
   - ✅ `FFmpegFileError` - File operation errors
   - ✅ `FFmpegCodecError` - Codec-related errors
   - ✅ `FFmpegTimeoutError` - Operation timeouts

6. **Execution Metrics**
   - ✅ Execution time tracking (milliseconds)
   - ✅ Exit code capture
   - ✅ stderr/stdout capture
   - ✅ Output path tracking

7. **SOLID Principles**
   - ✅ **Single Responsibility**: Each class has one clear purpose
   - ✅ **Open/Closed**: Extensible via interfaces
   - ✅ **Liskov Substitution**: Interface implementations are interchangeable
   - ✅ **Interface Segregation**: Focused, minimal interfaces
   - ✅ **Dependency Inversion**: Depends on abstractions (`IFfmpegExecutor`)

8. **Dependency Injection**
   - ✅ Constructor injection for executor
   - ✅ Easy testing with mock implementations
   - ✅ Flexible for different execution strategies

9. **Concurrent Execution Safety**
   - ✅ Each operation is independent
   - ✅ No shared mutable state
   - ✅ Safe for parallel processing

10. **Testing**
    - ✅ 43 unit tests covering all components
    - ✅ Validator tests (19 tests)
    - ✅ Service tests (15 tests)
    - ✅ Executor tests (9 tests)
    - ✅ Mock-based testing for isolation

11. **Codec Support**
    - ✅ G.711 (μ-law)
    - ✅ G.726
    - ✅ G.728
    - ✅ PCM (s16le, s24le)
    - ✅ AAC
    - ✅ MP3
    - ✅ Opus

---

## ❌ What is Not Done

### Missing Features

1. **Streaming Support**
   - ❌ Chunk-based streaming operations
   - ❌ Real-time encoding/decoding streams
   - ❌ Progressive download support
   - ❌ HTTP Live Streaming (HLS) support

2. **Video Support**
   - ❌ Video codec support (currently audio-only)
   - ❌ Video encoding/decoding
   - ❌ Video transcoding
   - ❌ Video format conversion

3. **Advanced FFmpeg Features**
   - ❌ Filter chains (audio filters, effects)
   - ❌ Metadata manipulation
   - ❌ Subtitle handling
   - ❌ Multiple input/output streams
   - ❌ Complex filter graphs

4. **Performance Optimizations**
   - ❌ Operation queuing/priority system
   - ❌ Resource pooling
   - ❌ Concurrent operation limits
   - ❌ Memory usage monitoring
   - ❌ CPU usage throttling

5. **Monitoring & Observability**
   - ❌ Progress callbacks/events
   - ❌ Real-time progress reporting
   - ❌ Operation logging/metrics
   - ❌ Performance analytics
   - ❌ Health check endpoints

6. **Advanced Error Recovery**
   - ❌ Automatic retry mechanisms
   - ❌ Partial failure recovery
   - ❌ Operation cancellation
   - ❌ Graceful degradation

7. **Configuration Management**
   - ❌ Configurable codec mappings
   - ❌ Custom FFmpeg executable paths
   - ❌ Environment-specific settings
   - ❌ Preset configurations

8. **Input/Output Flexibility**
   - ❌ URL-based input (HTTP, HTTPS)
   - ❌ Stream input/output
   - ❌ Memory buffer I/O
   - ❌ Pipe-based I/O

9. **Quality & Optimization**
   - ❌ Quality presets (low, medium, high)
   - ❌ Automatic bitrate calculation
   - ❌ Codec-specific optimizations
   - ❌ Compression level settings

10. **Integration Features**
    - ❌ REST API endpoints
    - ❌ WebSocket support for progress
    - ❌ Event emitter for operation events
    - ❌ Plugin system integration points

---

## 🏗️ Architecture & Logic

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FFmpegService                        │
│              (Single Gateway Interface)                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Decode  │  │  Encode  │  │ Transcode│  │ Convert ││
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬─────┘│
│       │            │             │              │       │
│       └────────────┴─────────────┴──────────────┘       │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  Validator │                        │
│                    └─────┬──────┘                       │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  Executor │                        │
│                    │ (Interface)│                       │
│                    └─────┬──────┘                       │
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │  FFmpegExecutor       │                  │
│              │  (Implementation)    │                  │
│              └───────────┬───────────┘                  │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  FFmpeg    │                       │
│                    │  Process   │                       │
│                    └────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. **FFmpegService** (Main Gateway)
- **Purpose**: Single entry point for all FFmpeg operations
- **Responsibilities**:
  - Orchestrates high-level operations
  - Delegates validation to `FFmpegValidator`
  - Delegates execution to `IFfmpegExecutor`
  - Transforms errors into domain-specific exceptions
  - Builds command options from operation parameters

#### 2. **FFmpegValidator** (Validation Layer)
- **Purpose**: Validates all input parameters before execution
- **Responsibilities**:
  - Validates codecs, sample rates, channels, bitrates
  - Validates file paths (existence, permissions)
  - Validates directory writability
  - Throws `FFmpegValidationError` on invalid input

#### 3. **FFmpegExecutor** (Execution Layer)
- **Purpose**: Executes FFmpeg commands safely
- **Responsibilities**:
  - Spawns FFmpeg child processes
  - Captures stdout/stderr
  - Tracks execution time
  - Handles timeouts
  - Maps internal codec names to FFmpeg codec names
  - Builds FFmpeg command arguments

#### 4. **Error Classes** (Error Handling)
- **Purpose**: Domain-specific error types
- **Types**:
  - `FFmpegValidationError`: Invalid parameters
  - `FFmpegExecutionError`: Process failures
  - `FFmpegFileError`: File operation errors
  - `FFmpegCodecError`: Codec issues
  - `FFmpegTimeoutError`: Timeout errors

### Design Patterns Used

1. **Gateway Pattern**: `FFmpegService` is the single gateway
2. **Strategy Pattern**: `IFfmpegExecutor` allows different execution strategies
3. **Dependency Injection**: Executor injected via constructor
4. **Factory Pattern**: Service creates default executor if none provided
5. **Template Method**: Service methods follow similar validation → execution → error handling flow

---

## 🔄 Step-by-Step Flow

### Example: Encoding an Audio File

```
Step 1: User calls FFmpegService.encode()
        │
        ├─> Input: { input: { path: 'audio.wav' }, 
        │            output: { path: 'audio.aac' },
        │            encoding: { codec: 'aac', sampleRate: 44100, channels: 2 } }
        │
Step 2: FFmpegService.validateFilePath()
        │
        ├─> Validates input path is a string
        ├─> Validates output path is a string
        │
Step 3: FFmpegValidator.validateInputFile()
        │
        ├─> Checks file exists
        ├─> Checks file is readable
        │
Step 4: FFmpegValidator.validateOutputPath()
        │
        ├─> Checks output directory exists
        ├─> Checks output directory is writable
        │
Step 5: FFmpegValidator.validateEncodingParams()
        │
        ├─> Validates codec ('aac' is supported)
        ├─> Validates sample rate (44100 is supported)
        ├─> Validates channels (2 is supported)
        ├─> Validates bitrate (if provided)
        │
Step 6: FFmpegService builds command options
        │
        ├─> Maps codec: 'aac' → 'aac'
        ├─> Sets sample rate: 44100
        ├─> Sets channels: 2
        ├─> Sets input/output paths
        │
Step 7: FFmpegExecutor.execute()
        │
        ├─> Builds FFmpeg command: 
        │   ['ffmpeg', '-i', 'audio.wav', '-acodec', 'aac', 
        │    '-ar', '44100', '-ac', '2', '-y', 'audio.aac']
        │
Step 8: Spawns FFmpeg process
        │
        ├─> Starts child process
        ├─> Captures stdout/stderr
        ├─> Tracks start time
        │
Step 9: Process execution
        │
        ├─> FFmpeg processes the file
        ├─> Output written to 'audio.aac'
        │
Step 10: Process completion
         │
         ├─> Process exits with code 0 (success) or non-zero (error)
         ├─> Calculates execution time
         ├─> Collects stdout/stderr
         │
Step 11: Return result or throw error
         │
         ├─> Success: Returns FFmpegExecutionResult
         │   { success: true, executionTime: 1234, exitCode: 0, ... }
         │
         └─> Error: Throws FFmpegExecutionError
             { message: '...', exitCode: 1, stderr: '...', ... }
```

### Logic Flow Diagram

```
User Request
    │
    ▼
[FFmpegService.encode()]
    │
    ├─► [Validate File Paths]
    │       │
    │       ├─► Input path exists? ──NO──► Throw ValidationError
    │       │       │
    │       │       YES
    │       │       │
    │       └─► Output dir writable? ──NO──► Throw ValidationError
    │               │
    │               YES
    │
    ├─► [Validate Encoding Params]
    │       │
    │       ├─► Codec valid? ──NO──► Throw ValidationError
    │       │       │
    │       │       YES
    │       │       │
    │       ├─► Sample rate valid? ──NO──► Throw ValidationError
    │       │       │
    │       │       YES
    │       │       │
    │       └─► Channels valid? ──NO──► Throw ValidationError
    │               │
    │               YES
    │
    ├─► [Build Command Options]
    │       │
    │       └─► Map codec names
    │       └─► Build FFmpeg args
    │
    ├─► [FFmpegExecutor.execute()]
    │       │
    │       ├─► Spawn process
    │       ├─► Set timeout
    │       ├─► Capture streams
    │       │
    │       ├─► Process completes
    │       │       │
    │       │       ├─► Exit code 0? ──YES──► Return Success Result
    │       │       │       │
    │       │       │       NO
    │       │       │       │
    │       │       └─► Throw ExecutionError
    │       │
    │       └─► Timeout? ──YES──► Kill process, throw TimeoutError
    │
    └─► [Return Result to User]
```

---

## 🚀 Future Enhancements

### High Priority

1. **Streaming Support**
   ```typescript
   // Chunk-based streaming
   async streamEncode(
     input: ReadableStream,
     output: WritableStream,
     encoding: AudioEncodingParams
   ): Promise<StreamResult>
   ```

2. **Progress Callbacks**
   ```typescript
   async encode(
     params: EncodeParams,
     onProgress?: (progress: ProgressInfo) => void
   ): Promise<FFmpegExecutionResult>
   ```

3. **Operation Queue**
   ```typescript
   class FFmpegQueue {
     add(operation: FFmpegOperation, priority: number): Promise<Result>
     cancel(operationId: string): void
   }
   ```

### Medium Priority

4. **Video Support**
   - Extend types to support video codecs
   - Add video encoding/decoding operations
   - Support video filters

5. **Advanced Filters**
   ```typescript
   interface FilterChain {
     filters: AudioFilter[];
   }
   
   async encodeWithFilters(
     params: EncodeParams,
     filters: FilterChain
   ): Promise<FFmpegExecutionResult>
   ```

6. **Metadata Operations**
   ```typescript
   async getMetadata(file: string): Promise<MediaMetadata>
   async setMetadata(file: string, metadata: MediaMetadata): Promise<void>
   ```

### Low Priority

7. **REST API Layer**
   - Express.js routes for FFmpeg operations
   - OpenAPI/Swagger documentation
   - Request validation middleware

8. **WebSocket Progress**
   - Real-time progress updates via WebSocket
   - Operation status notifications

9. **Plugin System**
   ```typescript
   interface FFmpegPlugin {
     name: string;
     beforeExecute?(options: FFmpegCommandOptions): void;
     afterExecute?(result: FFmpegExecutionResult): void;
   }
   ```

10. **Performance Monitoring**
    - Operation metrics collection
    - Performance dashboards
    - Alerting on failures

---

## 💡 Usage Examples

### Basic Encoding

```typescript
import { FFmpegService } from './services/ffmpeg/index.js';

const ffmpegService = new FFmpegService();

// Encode WAV to AAC
const result = await ffmpegService.encode({
  input: { path: 'input.wav' },
  output: { path: 'output.aac' },
  encoding: {
    codec: 'aac',
    sampleRate: 44100,
    channels: 2,
    bitrate: 128
  }
});

console.log(`Encoding completed in ${result.executionTime}ms`);
```

### Transcoding G.711 to AAC

```typescript
// Transcode from G.711 (telecom codec) to AAC
const result = await ffmpegService.transcode({
  input: { path: 'telecom-audio.g711', format: 'g711' },
  output: { path: 'modern-audio.aac', format: 'aac' },
  sourceEncoding: {
    codec: 'g711',
    sampleRate: 8000,
    channels: 1
  },
  targetEncoding: {
    codec: 'aac',
    sampleRate: 44100,
    channels: 2,
    bitrate: 128
  }
});
```

### Error Handling

```typescript
import { 
  FFmpegService,
  FFmpegValidationError,
  FFmpegExecutionError 
} from './services/ffmpeg/index.js';

try {
  await ffmpegService.encode({ /* ... */ });
} catch (error) {
  if (error instanceof FFmpegValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field:', error.field);
  } else if (error instanceof FFmpegExecutionError) {
    console.error('FFmpeg failed:', error.message);
    console.error('Exit code:', error.exitCode);
    console.error('Stderr:', error.stderr);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Dependency Injection (Testing)

```typescript
import { FFmpegService } from './services/ffmpeg/index.js';
import type { IFfmpegExecutor } from './services/ffmpeg/index.js';

class MockExecutor implements IFfmpegExecutor {
  async execute() {
    return { success: true, executionTime: 100, exitCode: 0, stderr: '' };
  }
  async isAvailable() { return true; }
  async getVersion() { return 'ffmpeg version 4.4.0'; }
}

const service = new FFmpegService(new MockExecutor());
```

---

## 🧪 Testing

### Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Test Coverage

- **FFmpegValidator**: 19 tests
  - Codec validation
  - Sample rate validation
  - Channel validation
  - Bitrate validation
  - File path validation

- **FFmpegService**: 15 tests
  - All operation types
  - Validation integration
  - Error handling

- **FFmpegExecutor**: 9 tests
  - Command building
  - Process execution
  - Timeout handling
  - Error scenarios

### Test Results

```
✓ 43 tests passing
✓ 100% code coverage (target)
✓ All error scenarios covered
✓ Mock-based isolation
```

---

## 📁 File Structure

```
ffmpeg/
├── __tests__/              # Unit tests
│   ├── FFmpegExecutor.test.ts
│   ├── FFmpegService.test.ts
│   └── FFmpegValidator.test.ts
├── errors/                 # Custom error classes
│   └── FFmpegErrors.ts
├── implementations/        # Concrete implementations
│   └── FFmpegExecutor.ts
├── interfaces/             # Dependency inversion interfaces
│   ├── IFfmpegExecutor.ts
│   └── IFfmpegService.ts
├── types/                  # TypeScript type definitions
│   └── FFmpegTypes.ts
├── validators/             # Parameter validators
│   └── FFmpegValidator.ts
├── FFmpegService.ts        # Main service (gateway)
├── index.ts                # Public API exports
└── README.md               # This file
```

---

## 🔧 Configuration

### Supported Codecs

- `g711` - G.711 μ-law (telecom)
- `g726` - G.726 ADPCM (telecom)
- `g728` - G.728 LD-CELP (telecom)
- `pcm_s16le` - PCM 16-bit little-endian
- `pcm_s24le` - PCM 24-bit little-endian
- `aac` - Advanced Audio Coding
- `mp3` - MPEG Audio Layer III
- `opus` - Opus codec

### Supported Sample Rates

- `8000` Hz (telecom standard)
- `16000` Hz
- `22050` Hz
- `44100` Hz (CD quality)
- `48000` Hz (professional audio)

### Supported Channels

- `1` - Mono
- `2` - Stereo

---

## 📝 Notes

- **Thread Safety**: Service is safe for concurrent use
- **Error Recovery**: Currently no automatic retry; implement at higher level
- **Performance**: Each operation spawns a new FFmpeg process
- **Resource Usage**: Monitor CPU/memory for concurrent operations
- **FFmpeg Dependency**: Requires FFmpeg to be installed and in PATH

---

## 🤝 Contributing

When adding new features:

1. Follow SOLID principles
2. Add comprehensive tests
3. Update type definitions
4. Document in this README
5. Maintain backward compatibility

---

## 📄 License

Part of the iPlayer media system.

---

**Last Updated**: 2024
**Status**: ✅ Production Ready (Core Features Complete)
