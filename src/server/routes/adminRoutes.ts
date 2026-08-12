import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, createBlackoutSchema } from '../middleware/validation.js';

export const adminRouter = Router();

adminRouter.use(authenticateToken, requireRole('ADMIN'));

// Create Blackout Period
adminRouter.post('/blackouts', validateBody(createBlackoutSchema), (req: Request, res: Response) => {
  const { assetId, startDate, endDate, reason } = req.body;

  const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  const result = db.prepare(`
    INSERT INTO blackouts (asset_id, start_date, end_date, reason)
    VALUES (?, ?, ?, ?)
  `).run(assetId, startDate, endDate, reason);

  const newBlackout = db.prepare('SELECT * FROM blackouts WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ message: 'Blackout window created', blackout: newBlackout });
});

// GET Blackouts
adminRouter.get('/blackouts', (req: Request, res: Response) => {
  const blackouts = db.prepare(`
    SELECT b.*, a.name as asset_name 
    FROM blackouts b 
    JOIN assets a ON b.asset_id = a.id 
    ORDER BY b.start_date DESC
  `).all();
  return res.json({ blackouts });
});

// GET Audit Logs
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  return res.json({ auditLogs: logs });
});
