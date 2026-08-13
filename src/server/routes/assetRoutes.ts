import { Router, Request, Response } from 'express';
import { Asset, Reservation, Blackout } from '../db/models.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, createAssetSchema } from '../middleware/validation.js';

export const assetRouter = Router();

// GET all assets (with optional search/filter)
assetRouter.get('/', async (req: Request, res: Response) => {
  const { category, search, status } = req.query;
  const filter: any = {};

  if (category) filter.category = category;
  if (status)   filter.status   = status;
  if (search) {
    const re = new RegExp(String(search), 'i');
    filter.$or = [{ name: re }, { serial_number: re }, { description: re }];
  }

  const assets = await Asset.find(filter).sort({ name: 1 }).lean();
  const mapped = assets.map(a => ({ ...a, id: a._id.toString() }));
  return res.json({ assets: mapped });
});

// GET single asset
assetRouter.get('/:id', async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id).lean().catch(() => null);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const activeReservations = await Reservation.find({
    asset_id: asset._id,
    status:   { $in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] },
  }).populate('user_id', 'name').sort({ start_date: 1 }).lean();

  const blackouts = await Blackout.find({ asset_id: asset._id }).sort({ start_date: 1 }).lean();

  return res.json({
    asset: { ...asset, id: asset._id.toString() },
    activeReservations,
    blackouts,
  });
});

// POST create asset (Admin only)
assetRouter.post('/', authenticateToken, requireRole('ADMIN'), validateBody(createAssetSchema), async (req: Request, res: Response) => {
  const { name, category, serialNumber, dailyPenaltyRate, description, location } = req.body;
  try {
    const newAsset = await Asset.create({
      name,
      category,
      serial_number:      serialNumber,
      daily_penalty_rate: dailyPenaltyRate,
      description:        description || '',
      location:           location || 'Main Office',
    });
    return res.status(201).json({ message: 'Asset created successfully', asset: { ...newAsset.toObject(), id: newAsset._id.toString() } });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An asset with this serial number already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create asset' });
  }
});
