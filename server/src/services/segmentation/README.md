# Segmentation Service – Streaming Optimization Layer

A production-ready, type-safe segmentation service for the iPlayer media system. This service groups time-based chunks into logical segments optimized for efficient network delivery, low-latency streaming, and progressive playback.

---

## 📋 Table of Contents

- [What is Done](#what-is-done)
- [What is Not Done](#what-is-not-done)
- [Architecture & Logic](#architecture--logic)
- [Segmentation Strategies](#segmentation-strategies)
- [Streaming Reasoning](#streaming-reasoning)
- [How This Enables Streaming](#how-this-enables-streaming)
- [Step-by-Step Flow](#step-by-step-flow)
- [Future Enhancements](#future-enhancements)
- [Usage Examples](#usage-examples)
- [Testing](#testing)

---

## ✅ What is Done

### Core Functionality

1. **Multiple Segmentation Strategies**
   - ✅ **Fixed**: Fixed number of chunks per segment
   - ✅ **Adaptive**: Variable segments targeting specific duration
   - ✅ **Progressive**: Increasing segment sizes for progressive playback
   - ✅ **Low-Latency**: Small initial segments for fast playback start

2. **Segment Metadata**
   - ✅ Index, start time, end time, duration
   - ✅ Chunk references (which chunks belong to segment)
   - ✅ Priority levels (Critical, High, Medium, Low, Background)
   - ✅ Critical flag for initial segments
   - ✅ Sequence numbers for streaming order

3. **Low-Latency Optimization**
   - ✅ Small initial segments for fast time-to-first-frame
   - ✅ Critical segment marking
   - ✅ Priority-based loading recommendations
   - ✅ Configurable initial segment size

4. **Progressive Playback Support**
   - ✅ Segments optimized for play-while-downloading
   - ✅ Progressive segment sizing
   - ✅ Buffer-aware segment recommendations

5. **Adaptive Buffering**
   - ✅ Buffering recommendations based on playback state
   - ✅ Network bandwidth awareness
   - ✅ Immediate, preload, and deferred segment categorization
   - ✅ Configurable buffer strategies

6. **Codec & Transport Independence**
   - ✅ Works with any codec (audio/video)
   - ✅ No transport protocol dependencies
   - ✅ Format-agnostic segmentation

7. **Live & File-Based Streaming**
   - ✅ Supports both streaming modes
   - ✅ Same API for both use cases
   - ✅ Mode-aware optimizations

8. **SOLID Principles**
   - ✅ **Strategy Pattern**: Pluggable segmentation algorithms
   - ✅ **Dependency Inversion**: Depends on chunking service interface
   - ✅ **Single Responsibility**: Each strategy has one purpose
   - ✅ **Open/Closed**: Easy to add new strategies

9. **Error Handling**
   - ✅ `SegmentationValidationError` - Invalid parameters
   - ✅ `SegmentationStrategyError` - Strategy failures
   - ✅ `SegmentationBufferingError` - Buffering issues

10. **Testing**
    - ✅ 27 unit tests covering all strategies and service
    - ✅ Strategy-specific tests
    - ✅ Buffering recommendation tests
    - ✅ Mock-based isolation

---

## ❌ What is Not Done

### Missing Features

1. **Physical Segment Generation**
   - ❌ Actual segment file creation
   - ❌ Integration with FFmpeg for segment extraction
   - ❌ Segment storage management

2. **Advanced Adaptive Strategies**
   - ❌ Content-aware segmentation (scene detection)
   - ❌ Quality-based segmentation
   - ❌ Bitrate-aware segmentation
   - ❌ Keyframe-aware segmentation

3. **Network Optimization**
   - ❌ CDN integration
   - ❌ Multi-server segment distribution
   - ❌ Segment replication strategies
   - ❌ Geographic segment placement

4. **Live Streaming Features**
   - ❌ Real-time segment generation
   - ❌ Sliding window segmentation
   - ❌ Live segment expiration
   - ❌ DVR (Digital Video Recorder) support

5. **Advanced Buffering**
   - ❌ Predictive buffering (ML-based)
   - ❌ User behavior-based buffering
   - ❌ Quality adaptation during buffering
   - ❌ Buffer health monitoring

6. **Segment Validation**
   - ❌ Segment integrity checks
   - ❌ Segment size validation
   - ❌ Segment quality metrics
   - ❌ Segment corruption detection

7. **Caching & Persistence**
   - ❌ Segment metadata caching
   - ❌ Segment metadata database storage
   - ❌ Segment access tracking
   - ❌ Segment popularity metrics

8. **Transport Protocol Integration**
   - ❌ HTTP Live Streaming (HLS) manifest generation
   - ❌ DASH manifest generation
   - ❌ WebRTC segment delivery
   - ❌ WebSocket streaming

---

## 🏗️ Architecture & Logic

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              SegmentationService                        │
│         (Streaming Optimization Layer)                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Create  │  │  Get     │  │ Buffering│  │ Initial││
│  │ Segments │  │ Segment  │  │  Rec     │  │Segment ││
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬───┘│
│       │            │             │              │       │
│       └────────────┴─────────────┴──────────────┘       │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │  Strategy  │                        │
│                    │  Factory   │                        │
│                    └─────┬──────┘                       │
│                          │                              │
│        ┌─────────────────┼─────────────────┐            │
│        │                 │                 │            │
│   ┌────▼────┐    ┌──────▼──────┐   ┌─────▼─────┐      │
│   │  Fixed  │    │  Adaptive    │   │Progressive│      │
│   │Strategy │    │  Strategy    │   │ Strategy  │      │
│   └─────────┘    └──────────────┘   └───────────┘      │
│                                                       │
│   ┌──────────────┐                                    │
│   │ Low-Latency │                                     │
│   │  Strategy   │                                     │
│   └──────────────┘                                    │
│                          │                              │
│                    ┌─────▼──────┐                       │
│                    │ Chunking   │                        │
│                    │  Service   │                        │
│                    └────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. **SegmentationService** (Main Service)
- **Purpose**: Orchestrate segmentation operations
- **Responsibilities**:
  - Get chunks from chunking service
  - Select appropriate strategy
  - Generate segment metadata
  - Provide buffering recommendations
  - Handle range queries

#### 2. **ISegmentationStrategy** (Strategy Interface)
- **Purpose**: Define segmentation algorithm contract
- **Responsibilities**:
  - Transform chunks into segments
  - Apply segmentation rules
  - Assign priorities
  - Mark critical segments

#### 3. **Strategy Implementations**
- **FixedSegmentationStrategy**: Fixed chunks per segment
- **AdaptiveSegmentationStrategy**: Target duration-based
- **ProgressiveSegmentationStrategy**: Increasing sizes
- **LowLatencySegmentationStrategy**: Small initial segments

#### 4. **SegmentationStrategyFactory**
- **Purpose**: Create strategy instances
- **Responsibilities**:
  - Strategy selection
  - Strategy instantiation
  - Default strategy provision

### Design Patterns Used

1. **Strategy Pattern**: Pluggable segmentation algorithms
2. **Factory Pattern**: Strategy creation
3. **Dependency Injection**: Chunking service injection
4. **Template Method**: Common segmentation flow

---

## 🎯 Segmentation Strategies

### 1. Fixed Strategy

**Purpose**: Simple, predictable segmentation

**Algorithm:**
- Divides chunks into segments with fixed number of chunks
- Example: 5 chunks per segment

**Use Cases:**
- Simple streaming scenarios
- Predictable network conditions
- Uniform content

**Example:**
```
Chunks: [0-4] [5-9] [10-14] [15-19]
Segments: Segment0 (5 chunks), Segment1 (5 chunks), ...
```

### 2. Adaptive Strategy

**Purpose**: Target duration-based segmentation

**Algorithm:**
- Groups chunks to achieve target segment duration
- Respects min/max duration constraints
- Adapts to chunk sizes

**Use Cases:**
- Variable chunk sizes
- Network-aware streaming
- Balanced segment sizes

**Example:**
```
Target: 10s per segment
Chunks: 2s each
Result: ~5 chunks per segment (10s total)
```

### 3. Progressive Strategy

**Purpose**: Increasing segment sizes for progressive playback

**Algorithm:**
- Small initial segments (fast start)
- Gradually increasing segment sizes
- Optimized for play-while-downloading

**Use Cases:**
- Progressive download scenarios
- Bandwidth-limited connections
- Fast initial playback

**Example:**
```
Segment 0: 2.5 chunks (fast start)
Segment 1: 5 chunks
Segment 2: 5.5 chunks
Segment 3: 6 chunks (increasing)
```

### 4. Low-Latency Strategy

**Purpose**: Minimal time-to-first-frame

**Algorithm:**
- Very small initial segments
- Multiple critical segments
- Fast playback start

**Use Cases:**
- Live streaming
- Low-latency requirements
- Fast user experience

**Example:**
```
Segment 0: 2.5s (critical, immediate load)
Segment 1: 5s (critical, immediate load)
Segment 2: 5s (critical, immediate load)
Segment 3+: 10s (normal segments)
```

---

## 📡 Streaming Reasoning

### Why Segmentation?

1. **Network Efficiency**
   - Smaller units = better bandwidth utilization
   - Parallel downloading of segments
   - Reduced re-buffering

2. **Low Latency**
   - Small initial segments = fast start
   - Don't wait for entire file
   - Progressive playback

3. **Adaptive Streaming**
   - Different quality segments
   - Bandwidth-aware selection
   - Quality switching

4. **Caching & CDN**
   - Segment-level caching
   - Distributed delivery
   - Edge server optimization

5. **Error Recovery**
   - Retry individual segments
   - Partial failure handling
   - Graceful degradation

### Segment Size Trade-offs

**Small Segments:**
- ✅ Lower latency
- ✅ Faster start
- ✅ Better adaptation
- ❌ More overhead
- ❌ More requests

**Large Segments:**
- ✅ Less overhead
- ✅ Fewer requests
- ✅ Better compression
- ❌ Higher latency
- ❌ Slower start

**Optimal Balance:**
- Initial segments: Small (2-5s)
- Subsequent segments: Medium (10-15s)
- Later segments: Can be larger (20-30s)

---

## 🎮 How This Enables Streaming

### Progressive Playback

**How it works:**
1. Player requests initial segments (small, critical)
2. Service returns segment metadata
3. Player starts downloading first segment
4. Playback begins while downloading subsequent segments
5. Buffer maintains target level

**Example:**
```typescript
// Get initial segments for fast start
const initialSegments = await service.getInitialSegments('video.mp4');
// Returns: [Segment0 (2.5s), Segment1 (5s)] - critical segments

// Player:
// 1. Downloads Segment0 immediately
// 2. Starts playback after Segment0 loaded
// 3. Downloads Segment1+ in background
// 4. Maintains buffer for smooth playback
```

### Adaptive Buffering

**How it works:**
1. Player monitors buffer level and network
2. Requests buffering recommendation
3. Service categorizes segments (immediate/preload/deferred)
4. Player loads segments based on priority
5. Adjusts based on network conditions

**Example:**
```typescript
const recommendation = await service.getBufferingRecommendation(
  'video.mp4',
  {
    currentTime: 30,
    bufferLevel: 5, // Low buffer
    bandwidth: 2000000, // 2 Mbps
    isPlaying: true
  },
  {
    initialBufferSize: 10,
    minBufferSize: 5,
    maxBufferSize: 30,
    targetBufferSize: 15
  }
);

// Returns:
// immediate: [Segment3, Segment4] - load now
// preload: [Segment5, Segment6] - load soon
// deferred: [Segment7+] - load later
```

### Low-Latency Streaming

**How it works:**
1. Service creates small initial segments
2. Marks them as critical
3. Player prioritizes critical segments
4. Fast time-to-first-frame

**Example:**
```typescript
const result = await service.createSegments('video.mp4', {
  strategy: 'low-latency',
  optimizeForLowLatency: true
});

// First segment: 2.5s duration, critical, priority 100
// Player can start playback in ~2.5s instead of waiting for entire file
```

### Bandwidth Adaptation

**How it works:**
1. Service monitors network bandwidth
2. Adjusts buffering recommendations
3. Reduces preload for low bandwidth
4. Prioritizes immediate segments

**Example:**
```typescript
// High bandwidth (10 Mbps)
const rec1 = await service.getBufferingRecommendation(..., {
  bandwidth: 10000000
});
// Preloads more segments

// Low bandwidth (500 kbps)
const rec2 = await service.getBufferingRecommendation(..., {
  bandwidth: 500000
});
// Reduces preload, focuses on immediate segments
```

---

## 🔄 Step-by-Step Flow

### Example: Creating Segments for Streaming

```
Step 1: User calls SegmentationService.createSegments()
        │
        ├─> Input: { filePath: 'video.mp4', strategy: 'adaptive' }
        │
Step 2: Service gets chunks from ChunkingService
        │
        ├─> Calls: chunkingService.getAllChunks('video.mp4')
        ├─> Returns: [Chunk0, Chunk1, ..., Chunk19] (20 chunks)
        │
Step 3: Service selects strategy
        │
        ├─> Strategy: 'adaptive'
        ├─> Factory creates: AdaptiveSegmentationStrategy
        │
Step 4: Strategy creates segments
        │
        ├─> Target duration: 10s
        ├─> Groups chunks: [0-4] → Segment0 (10s)
        ├─> Groups chunks: [5-9] → Segment1 (10s)
        ├─> Groups chunks: [10-14] → Segment2 (10s)
        ├─> Groups chunks: [15-19] → Segment3 (10s)
        │
Step 5: Service assigns priorities
        │
        ├─> Segment0: CRITICAL (isCritical: true)
        ├─> Segment1: HIGH
        ├─> Segment2: MEDIUM
        ├─> Segment3: LOW
        │
Step 6: Service returns result
        │
        └─> Returns: {
              segments: [Segment0, Segment1, Segment2, Segment3],
              totalSegments: 4,
              firstSegmentDuration: 10,
              ...
            }
```

### Example: Adaptive Buffering Recommendation

```
Step 1: Player requests buffering recommendation
        │
        ├─> Input: {
              currentTime: 25s,
              bufferLevel: 8s,
              bandwidth: 2000000
            }
        │
Step 2: Service gets all segments
        │
        ├─> Calls: getAllSegments('video.mp4')
        ├─> Returns: [Segment0, Segment1, ..., Segment10]
        │
Step 3: Service finds current segment
        │
        ├─> Binary search for segment containing 25s
        ├─> Found: Segment2 (20s - 30s)
        │
Step 4: Service categorizes segments
        │
        ├─> Immediate: Segment2, Segment3 (current + next)
        ├─> Preload: Segment4, Segment5 (within target buffer)
        ├─> Deferred: Segment6+ (beyond target buffer)
        │
Step 5: Service adjusts for bandwidth
        │
        ├─> Bandwidth: 2 Mbps (medium)
        ├─> Keeps preload as-is
        │
Step 6: Service calculates recommendation
        │
        ├─> Immediate duration: 20s
        ├─> Preload duration: 20s
        ├─> Recommended buffer: min(40s, maxBufferSize)
        │
Step 7: Service returns recommendation
        │
        └─> Returns: {
              immediate: [Segment2, Segment3],
              preload: [Segment4, Segment5],
              deferred: [Segment6+],
              recommendedBufferSize: 30
            }
```

---

## 🚀 Future Enhancements

### High Priority

1. **Content-Aware Segmentation**
   ```typescript
   interface ContentAwareStrategy extends ISegmentationStrategy {
     detectScenes(chunks: ChunkMetadata[]): SceneBoundary[];
     createSegmentsAtScenes(chunks: ChunkMetadata[]): SegmentMetadata[];
   }
   ```

2. **Quality-Based Segmentation**
   - Multiple quality levels per segment
   - Adaptive quality selection
   - Quality ladder management

3. **Segment File Generation**
   ```typescript
   async generateSegmentFiles(
     filePath: string,
     segmentIndex: number
   ): Promise<string> // Returns path to segment file
   ```

### Medium Priority

4. **HLS/DASH Manifest Generation**
   - Generate HLS playlist files
   - Generate DASH MPD files
   - Multi-bitrate support

5. **Predictive Buffering**
   - ML-based buffer prediction
   - User behavior analysis
   - Network pattern recognition

6. **Segment Analytics**
   - Access tracking
   - Popularity metrics
   - Performance monitoring

---

## 💡 Usage Examples

### Basic Segmentation

```typescript
import { SegmentationService } from './services/segmentation/index.js';
import { ChunkingService } from './services/chunking/index.js';

const chunkingService = new ChunkingService();
const segmentationService = new SegmentationService(chunkingService);

// Create segments with adaptive strategy
const result = await segmentationService.createSegments('video.mp4', {
  strategy: 'adaptive',
  targetSegmentDuration: 10,
  optimizeForLowLatency: true
});

console.log(`Total segments: ${result.totalSegments}`);
console.log(`First segment: ${result.firstSegmentDuration}s`);
```

### Low-Latency Streaming

```typescript
// Create segments optimized for low latency
const result = await segmentationService.createSegments('video.mp4', {
  strategy: 'low-latency',
  targetSegmentDuration: 5,
  optimizeForLowLatency: true
});

// Get initial segments for fast start
const initialSegments = await segmentationService.getInitialSegments('video.mp4');

// Load critical segments first
initialSegments.forEach(segment => {
  console.log(`Load segment ${segment.index}: ${segment.duration}s (critical)`);
});
```

### Adaptive Buffering

```typescript
const playbackState = {
  currentTime: 45,
  bufferLevel: 8,
  bandwidth: 3000000, // 3 Mbps
  isPlaying: true
};

const bufferingStrategy = {
  initialBufferSize: 10,
  minBufferSize: 5,
  maxBufferSize: 30,
  targetBufferSize: 15
};

const recommendation = await segmentationService.getBufferingRecommendation(
  'video.mp4',
  playbackState,
  bufferingStrategy
);

// Load immediate segments
recommendation.immediate.forEach(segment => {
  loadSegment(segment);
});

// Preload upcoming segments
recommendation.preload.forEach(segment => {
  preloadSegment(segment);
});
```

### Progressive Playback

```typescript
// Use progressive strategy for play-while-downloading
const result = await segmentationService.createSegments('video.mp4', {
  strategy: 'progressive',
  chunksPerSegment: 5,
  initialSegmentMultiplier: 0.5
});

// First segment is small (fast start)
console.log(`Segment 0: ${result.segments[0].duration}s`);

// Later segments are larger (efficient)
console.log(`Segment 5: ${result.segments[5].duration}s`);
```

---

## 🧪 Testing

### Run Tests

```bash
npm test -- SegmentationService        # Service tests
npm test -- SegmentationStrategies    # Strategy tests
npm test -- segmentation              # All segmentation tests
```

### Test Coverage

- **SegmentationService**: 16 tests
  - Segment creation
  - Strategy selection
  - Buffering recommendations
  - Range queries

- **Segmentation Strategies**: 11 tests
  - Fixed strategy
  - Adaptive strategy
  - Progressive strategy
  - Low-latency strategy
  - Factory tests

### Test Results

```
✓ 27 tests passing
✓ All strategies tested
✓ Buffering logic verified
✓ Edge cases covered
```

---

## 📁 File Structure

```
segmentation/
├── __tests__/                    # Unit tests
│   ├── SegmentationService.test.ts
│   └── SegmentationStrategies.test.ts
├── errors/                       # Custom error classes
│   └── SegmentationErrors.ts
├── interfaces/                   # Dependency inversion interfaces
│   ├── ISegmentationService.ts
│   └── IChunkingService.ts
├── strategies/                   # Segmentation strategies
│   ├── ISegmentationStrategy.ts
│   ├── FixedSegmentationStrategy.ts
│   ├── AdaptiveSegmentationStrategy.ts
│   ├── ProgressiveSegmentationStrategy.ts
│   ├── LowLatencySegmentationStrategy.ts
│   └── SegmentationStrategyFactory.ts
├── types/                        # TypeScript type definitions
│   └── SegmentationTypes.ts
├── SegmentationService.ts        # Main service
├── index.ts                      # Public API exports
└── README.md                     # This file
```

---

## 🔧 Configuration

### Default Settings

- **Strategy**: `adaptive`
- **Target Segment Duration**: 10 seconds
- **Chunks Per Segment**: 5 (for fixed strategy)
- **Optimize for Low Latency**: `true`
- **Initial Segment Multiplier**: 0.5 (for progressive)

### Strategy Selection Guide

| Strategy | Use Case | Latency | Complexity |
|----------|----------|---------|------------|
| `fixed` | Simple, predictable | Medium | Low |
| `adaptive` | Variable chunk sizes | Medium | Medium |
| `progressive` | Play-while-download | Low | Medium |
| `low-latency` | Fast start required | Very Low | Medium |

---

## 📝 Notes

- **Strategy-Based**: Pluggable algorithms via Strategy pattern
- **Chunking Integration**: Works with ChunkingService
- **Transport Independent**: No HTTP/WebSocket logic
- **Codec Agnostic**: Works with any media format
- **Microservice Ready**: Can be extracted as standalone service
- **SOLID Compliant**: Follows all SOLID principles

---

## 🤝 Contributing

When adding new features:

1. Follow SOLID principles
2. Maintain strategy pattern
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
