import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth';
import familyRoutes from './routes/family';
import mediaRoutes from './routes/media';
import orbsRoutes from './routes/orbs';
import sessionsRoutes from './routes/sessions';

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
app.use(
  cors({
    origin: '*', // Allow frontend development
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve Uploaded Media (Photos & Videos)
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Memora API Server',
    time: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/orbs', orbsRoutes);
app.use('/api/sessions', sessionsRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🔮 Memora Backend Server is running at http://localhost:${PORT}`);
  console.log(`📁 Serving media uploads at http://localhost:${PORT}/uploads/`);
});
