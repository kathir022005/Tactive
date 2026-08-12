import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db/database.js';
import { authRouter } from './routes/authRoutes.js';
import { assetRouter } from './routes/assetRoutes.js';
import { reservationRouter } from './routes/reservationRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';

export function createApp() {
  // Initialize Database
  initializeDatabase();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/assets', assetRouter);
  app.use('/api/reservations', reservationRouter);
  app.use('/api/admin', adminRouter);

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'EquipFlow API', timestamp: new Date().toISOString() });
  });

  // Serve static files in production
  const clientDist = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(clientDist));

  // Catch-all for SPA client routing
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: `API endpoint '${req.path}' not found` });
    }
    const indexPath = path.resolve(clientDist, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send('EquipFlow API Server is Running. Frontend client build not found.');
      }
    });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  return app;
}
