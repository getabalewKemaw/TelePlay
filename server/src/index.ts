import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import apiRoutes from './routes/index.js';

import { errorHandler } from './middleware/errorHandler.js';

import { FileService } from './services/file/FileService.js';
import { ChunkingService } from './services/chunking/ChunkingService.js';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;

// Initialize services for background discovery
const fileService = new FileService(new ChunkingService() as any);
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Discovery Helper
const runDiscovery = async () => {
    try {
        await fileService.discoverFiles(uploadsDir);

        // Also scan MEDIA_ROOT if defined
        if (process.env.MEDIA_ROOT) {
            const mediaRoot = path.resolve(process.env.MEDIA_ROOT);
            if (fs.existsSync(mediaRoot)) {
                await fileService.discoverFiles(mediaRoot);
            }
        }
    } catch (err) {
        console.error('Discovery failed:', err);
    }
};

// 1. Startup Discovery
runDiscovery().then(() => console.log('Initial file discovery completed'));

// 2. Real-time Watcher (Debounced)
let discoveryTimeout: NodeJS.Timeout | null = null;
const triggerDiscovery = (source: string) => {
    if (discoveryTimeout) clearTimeout(discoveryTimeout);
    discoveryTimeout = setTimeout(() => {
        console.log(`File system change detected in ${source}. Running discovery...`);
        runDiscovery();
    }, 1000);
};

fs.watch(uploadsDir, { recursive: true }, (eventType, filename) => {
    if (filename) triggerDiscovery('uploads');
});

// Watch MEDIA_ROOT if defined
if (process.env.MEDIA_ROOT) {
    const mediaRoot = path.resolve(process.env.MEDIA_ROOT);
    if (fs.existsSync(mediaRoot)) {
        fs.watch(mediaRoot, { recursive: true }, (eventType, filename) => {
            if (filename) triggerDiscovery('media_root');
        });
        console.log(`Watching custom media root: ${mediaRoot}`);
    }
}

// 3. Fallback Periodic Discovery (every 30 seconds)
setInterval(() => {
    runDiscovery();
}, 30 * 1000);

// Body parsing middleware
app.use(express.json());

// Main Landing
app.get("/", (req: Request, res: Response) => {
    res.send("I-Player Backend API is active");
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`I-Player server is running on port http://localhost:${PORT}`);
});
