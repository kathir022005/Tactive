import { Router, Request, Response } from 'express';
import { Asset, Blackout, AuditLog } from '../db/models.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, createBlackoutSchema } from '../middleware/validation.js';

export const adminRouter = Router();

adminRouter.use(authenticateToken, requireRole('ADMIN'));

// POST create blackout
adminRouter.post('/blackouts', validateBody(createBlackoutSchema), async (req: Request, res: Response) => {
  const { assetId, startDate, endDate, reason } = req.body;

  const asset = await Asset.findById(assetId).lean().catch(() => null);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const newBlackout = await Blackout.create({
    asset_id:   assetId,
    start_date: startDate,
    end_date:   endDate,
    reason,
  });

  return res.status(201).json({
    message: 'Blackout window created',
    blackout: { ...newBlackout.toObject(), id: newBlackout._id.toString(), asset_name: asset.name },
  });
});

// GET all blackouts
adminRouter.get('/blackouts', async (_req: Request, res: Response) => {
  const blackouts = await Blackout.find({})
    .populate('asset_id', 'name')
    .sort({ start_date: -1 })
    .lean();

  const mapped = blackouts.map(b => ({
    id:         b._id.toString(),
    asset_id:   (b.asset_id as any)?._id?.toString(),
    asset_name: (b.asset_id as any)?.name,
    start_date: b.start_date,
    end_date:   b.end_date,
    reason:     b.reason,
    createdAt:  b.createdAt,
  }));

  return res.json({ blackouts: mapped });
});

// GET audit logs
adminRouter.get('/audit-logs', async (_req: Request, res: Response) => {
  const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
  return res.json({ auditLogs: logs });
});
