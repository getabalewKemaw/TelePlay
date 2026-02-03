import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import apiRoutes from './routes/index.js';

import { errorHandler } from './middleware/errorHandler.js';

import { FileService } from './services/file/FileService.js';
import { ChunkingService } from './services/chunking/ChunkingService.js';
import path from 'path';
import cors from 'cors';

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

// Startup Discovery
fileService.discoverFiles(uploadsDir).then(() => {
    console.log('Initial file discovery completed');
}).catch(err => {
    console.error('Initial discovery failed:', err);
});

// Periodic Discovery (every 5 minutes)
setInterval(() => {
    fileService.discoverFiles(uploadsDir).catch(err => console.error('Periodic discovery failed:', err));
}, 5 * 60 * 1000);

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



