import { Router, Request, Response } from 'express';
import { Asset, Reservation, User } from '../db/models.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, createReservationSchema } from '../middleware/validation.js';
import { checkAssetAvailability } from '../services/conflictEngine.js';
import { checkUserReservationQuota } from '../services/quotaEngine.js';
import { calculateLatePenalty } from '../services/penaltyCalculator.js';

export const reservationRouter = Router();

// Helper to flatten a populated reservation for the client
function flattenReservation(r: any) {
  const asset = r.asset_id;
  const user  = r.user_id;
  return {
    id:                   r._id?.toString(),
    asset_id:             asset?._id?.toString() ?? r.asset_id?.toString(),
    user_id:              user?._id?.toString()  ?? r.user_id?.toString(),
    asset_name:           asset?.name,
    asset_category:       asset?.category,
    serial_number:        asset?.serial_number,
    daily_penalty_rate:   asset?.daily_penalty_rate,
    user_name:            user?.name,
    user_role:            user?.role,
    start_date:           r.start_date,
    end_date:             r.end_date,
    status:               r.status,
    is_vip_auto_approved: r.is_vip_auto_approved,
    penalty_fee:          r.penalty_fee,
    actual_return_date:   r.actual_return_date,
    notes:                r.notes,
    created_at:           r.createdAt,
  };
}

// GET reservations
reservationRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const u = req.user!;
  const filter: any = {};
  if (u.role !== 'ADMIN' || req.query.mine === 'true') {
    filter.user_id = u.id;
  }

  const reservations = await Reservation.find(filter)
    .populate('asset_id', 'name category serial_number daily_penalty_rate')
    .populate('user_id',  'name role')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ reservations: reservations.map(flattenReservation) });
});

// POST create reservation
reservationRouter.post('/', authenticateToken, validateBody(createReservationSchema), async (req: Request, res: Response) => {
  const user = req.user!;
  const { assetId, startDate, endDate, notes } = req.body;

  // 1. Asset exists and is available?
  const asset = await Asset.findById(String(assetId)).lean().catch(() => null);
  if (!asset) return res.status(404).json({ error: 'Selected asset does not exist.' });
  if (asset.status === 'RETIRED' || asset.status === 'MAINTENANCE') {
    return res.status(400).json({ error: `Asset is currently unavailable (Status: ${asset.status}).` });
  }

  // 2. Quota check
  const quotaCheck = await checkUserReservationQuota(user.id);
  if (!quotaCheck.allowed) return res.status(400).json({ error: quotaCheck.reason });

  // 3. Conflict check
  const availabilityCheck = await checkAssetAvailability(String(assetId), startDate, endDate);
  if (availabilityCheck.hasConflict) {
    return res.status(409).json({ error: 'Reservation conflict detected.', reason: availabilityCheck.reason });
  }

  // 4. Create
  const isVip      = user.role === 'VIP' || user.role === 'ADMIN';
  const initStatus = isVip ? 'CONFIRMED' : 'PENDING';

  const newRes = await Reservation.create({
    asset_id:             String(assetId),
    user_id:              user.id,
    start_date:           startDate,
    end_date:             endDate,
    status:               initStatus,
    is_vip_auto_approved: isVip,
    notes:                notes || '',
  });

  const populated = await Reservation.findById(newRes._id)
    .populate('asset_id', 'name')
    .populate('user_id',  'name')
    .lean();

  return res.status(201).json({
    message: initStatus === 'CONFIRMED'
      ? 'Reservation confirmed automatically (VIP / Admin priority).'
      : 'Reservation submitted and pending admin approval.',
    reservation: flattenReservation(populated),
  });
});

// POST return asset
reservationRouter.post('/:id/return', authenticateToken, async (req: Request, res: Response) => {
  const { returnDate } = req.body;
  const actualReturnDate = returnDate || new Date().toISOString().split('T')[0];

  const reservation = await Reservation.findById(req.params.id).populate('asset_id', 'daily_penalty_rate').lean().catch(() => null);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

  if (req.user!.role !== 'ADMIN' && reservation.user_id.toString() !== String(req.user!.id)) {
    return res.status(403).json({ error: 'Unauthorized to return this reservation.' });
  }

  if (reservation.status !== 'CONFIRMED' && reservation.status !== 'CHECKED_OUT') {
    return res.status(400).json({ error: `Cannot return reservation with status '${reservation.status}'.` });
  }

  const ownerUser = await User.findById(reservation.user_id).select('role').lean();
  const userRole  = ownerUser?.role ?? 'STANDARD';
  const assetDoc  = reservation.asset_id as any;
  const penaltyCalc = calculateLatePenalty(reservation.end_date, actualReturnDate, assetDoc?.daily_penalty_rate ?? 50, userRole);

  await Reservation.findByIdAndUpdate(req.params.id, {
    status:             'RETURNED',
    actual_return_date: actualReturnDate,
    penalty_fee:        penaltyCalc.penaltyFee,
  });

  return res.json({
    message: penaltyCalc.isOverdue
      ? `Asset returned with late penalty: $${penaltyCalc.penaltyFee.toFixed(2)} (${penaltyCalc.overdueDays} days overdue).`
      : 'Asset returned on time with no penalty fees.',
    penaltyDetails: penaltyCalc,
  });
});

// POST cancel
reservationRouter.post('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  const reservation = await Reservation.findById(req.params.id).lean().catch(() => null);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

  if (req.user!.role !== 'ADMIN' && reservation.user_id.toString() !== String(req.user!.id)) {
    return res.status(403).json({ error: 'Unauthorized to cancel this reservation.' });
  }
  if (reservation.status === 'RETURNED' || reservation.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Reservation is already closed.' });
  }

  await Reservation.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' });
  return res.json({ message: 'Reservation cancelled successfully.' });
});

// POST approve (Admin)
reservationRouter.post('/:id/approve', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const resRecord = await Reservation.findById(req.params.id).lean().catch(() => null);
  if (!resRecord) return res.status(404).json({ error: 'Reservation not found.' });
  if (resRecord.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot approve reservation in state '${resRecord.status}'` });
  }
  await Reservation.findByIdAndUpdate(req.params.id, { status: 'CONFIRMED' });
  return res.json({ message: 'Reservation approved.' });
});

// POST reject (Admin)
reservationRouter.post('/:id/reject', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const resRecord = await Reservation.findById(req.params.id).lean().catch(() => null);
  if (!resRecord) return res.status(404).json({ error: 'Reservation not found.' });
  await Reservation.findByIdAndUpdate(req.params.id, { status: 'REJECTED' });
  return res.json({ message: 'Reservation rejected.' });
});
