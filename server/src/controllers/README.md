
# I-Player Controller Layer

This directory contains the Implementation of the **Controller Layer** for the I-Player media processing backend.

## Architecture Overview

The controller layer follows the **Clean Architecture** principles, ensuring that the API layer is decoupled from the business logic (services).

### Key Components

1.  **Controllers (`src/controllers/`)**:
    *   **Thin Layer**: Controllers only handle request parsing, validation (delegated to DTOs), and response structuring.
    *   **Service Integration**: Controllers interface with existing core services (`FFmpegService`, `ChunkingService`, etc.) via their respective interfaces.
    *   **Non-Blocking**: All controller methods are asynchronous.

2.  **Routes (`src/routes/`)**:
    *   Modular routing using Express Router.
    *   RESTful API design following resource-based paths.

3.  **DTOs (`src/dto/`)**:
    *   Data Transfer Objects define the contract for the API.
    *   Ensure type safety for incoming requests.

4.  **Middleware (`src/middleware/`)**:
    *   **Global Error Handler**: Captures and formats errors from all services into a consistent JSON response.

## API Endpoints

### FFmpeg Operations
*   `POST /api/ffmpeg/decode`: Decode audio files.

### Media Processing
*   `GET /api/chunks`: Get all metadata for file chunks.
*   `GET /api/chunks/at-time`: Seek a specific chunk by timestamp.

### Streaming Sessions
*   `POST /api/streaming/sessions`: Initialize a streaming session.



