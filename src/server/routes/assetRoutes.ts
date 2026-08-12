import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, createAssetSchema } from '../middleware/validation.js';

export const assetRouter = Router();

// GET all assets
assetRouter.get('/', (req: Request, res: Response) => {
  const { category, search, status } = req.query;

  let query = 'SELECT * FROM assets WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR serial_number LIKE ? OR description LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY name ASC';

  const assets = db.prepare(query).all(...params);
  return res.json({ assets });
});

// GET single asset details
assetRouter.get('/:id', (req: Request, res: Response) => {
  const assetId = parseInt(req.params.id as string, 10);
  if (isNaN(assetId)) {
    return res.status(400).json({ error: 'Invalid asset ID' });
  }

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  // Get active reservations for timeline preview
  const reservations = db.prepare(`
    SELECT r.id, r.start_date, r.end_date, r.status, u.name as reserved_by
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.asset_id = ? AND r.status IN ('PENDING', 'CONFIRMED', 'CHECKED_OUT')
    ORDER BY r.start_date ASC
  `).all(assetId);

  const blackouts = db.prepare(`
    SELECT id, start_date, end_date, reason 
    FROM blackouts 
    WHERE asset_id = ?
    ORDER BY start_date ASC
  `).all(assetId);

  return res.json({ asset, activeReservations: reservations, blackouts });
});

// POST create asset (Admin only)
assetRouter.post('/', authenticateToken, requireRole('ADMIN'), validateBody(createAssetSchema), (req: Request, res: Response) => {
  const { name, category, serialNumber, dailyPenaltyRate, description, location } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO assets (name, category, serial_number, daily_penalty_rate, description, location)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, category, serialNumber, dailyPenaltyRate, description || '', location || 'Main Office');

    const newAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ message: 'Asset created successfully', asset: newAsset });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An asset with this serial number already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create asset' });
  }
});
