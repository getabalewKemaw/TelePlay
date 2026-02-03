import express from 'express';
import type { Request, Response } from 'express';
import apiRoutes from './routes/index.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

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

