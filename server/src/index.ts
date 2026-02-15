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
const fileService = new FileService(new ChunkingService());
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

let isDiscovering = false;
let pendingDiscovery = false;
let discoveryTimeout: NodeJS.Timeout | null = null;
const activeWatchers: fs.FSWatcher[] = [];

const runDiscovery = async () => {
    if (isDiscovering) {
        pendingDiscovery = true;
        return;
    }

    isDiscovering = true;
    try {
        await fileService.discoverFiles(uploadsDir);

        if (process.env.MEDIA_ROOT) {
            const mediaRoot = path.resolve(process.env.MEDIA_ROOT);
            if (fs.existsSync(mediaRoot)) {
                await fileService.discoverFiles(mediaRoot);
            }
        }
    } catch (err) {
        console.error('Discovery failed:', err);
    } finally {
        isDiscovering = false;
        if (pendingDiscovery) {
            pendingDiscovery = false;
            void runDiscovery();
        }
    }
};

const scheduleDiscovery = (source: string) => {
    if (discoveryTimeout) clearTimeout(discoveryTimeout);
    discoveryTimeout = setTimeout(() => {
        console.log(`File system change detected in ${source}. Running discovery...`);
        void runDiscovery();
    }, 1000);
};

const setupWatcher = (dir: string, source: string): void => {
    try {
        const watcher = fs.watch(dir, { recursive: true }, (_eventType, filename) => {
            if (filename) scheduleDiscovery(source);
        });
        activeWatchers.push(watcher);
    } catch (error) {
        console.warn(`Watch setup failed for ${dir}. Falling back to periodic discovery only.`, error);
    }
};

// 1. Startup discovery
runDiscovery().then(() => console.log('Initial file discovery completed'));

// 2. Real-time watcher (debounced)
setupWatcher(uploadsDir, 'uploads');
if (process.env.MEDIA_ROOT) {
    const mediaRoot = path.resolve(process.env.MEDIA_ROOT);
    if (fs.existsSync(mediaRoot)) {
        setupWatcher(mediaRoot, 'media_root');
        console.log(`Watching custom media root: ${mediaRoot}`);
    }
}

// 3. Periodic fallback scan (single-flight protected)
const periodicScanMs = Number(process.env.DISCOVERY_INTERVAL_MS || 120000);
const discoveryInterval = setInterval(() => {
    void runDiscovery();
}, Math.max(10000, periodicScanMs));

const shutdown = () => {
    if (discoveryTimeout) clearTimeout(discoveryTimeout);
    clearInterval(discoveryInterval);
    for (const watcher of activeWatchers) watcher.close();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('I-Player Backend API is active');
});

app.use('/api', apiRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`I-Player server is running on port http://localhost:${PORT}`);
});
