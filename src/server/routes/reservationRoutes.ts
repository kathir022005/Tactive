import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, createReservationSchema } from '../middleware/validation.js';
import { checkAssetAvailability } from '../services/conflictEngine.js';
import { checkUserReservationQuota } from '../services/quotaEngine.js';
import { calculateLatePenalty } from '../services/penaltyCalculator.js';

export const reservationRouter = Router();

// GET user reservations (or all if admin)
reservationRouter.get('/', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  let query = `
    SELECT r.*, a.name as asset_name, a.category as asset_category, a.serial_number, a.daily_penalty_rate, u.name as user_name, u.role as user_role
    FROM reservations r
    JOIN assets a ON r.asset_id = a.id
    JOIN users u ON r.user_id = u.id
  `;

  const params: any[] = [];

  // Standard/VIP users see their own, ADMIN can filter or see all
  if (user.role !== 'ADMIN' || req.query.mine === 'true') {
    query += ` WHERE r.user_id = ?`;
    params.push(user.id);
  }

  query += ` ORDER BY r.created_at DESC`;

  const reservations = db.prepare(query).all(...params);
  return res.json({ reservations });
});

// POST Create new reservation
reservationRouter.post('/', authenticateToken, validateBody(createReservationSchema), (req: Request, res: Response) => {
  const user = req.user!;
  const { assetId, startDate, endDate, notes } = req.body;

  // 1. Verify Asset exists and is not retired/maintenance
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) {
    return res.status(404).json({ error: 'Selected asset does not exist.' });
  }

  if (asset.status === 'RETIRED' || asset.status === 'MAINTENANCE') {
    return res.status(400).json({ error: `Asset is currently unavailable (Status: ${asset.status}).` });
  }

  // 2. Check User Quota
  const quotaCheck = checkUserReservationQuota(user.id);
  if (!quotaCheck.allowed) {
    return res.status(400).json({ error: quotaCheck.reason });
  }

  // 3. Check Date Overlap Conflicts & Blackouts
  const availabilityCheck = checkAssetAvailability(assetId, startDate, endDate);
  if (availabilityCheck.hasConflict) {
    return res.status(409).json({
      error: 'Reservation conflict detected.',
      reason: availabilityCheck.reason
    });
  }

  // 4. Determine status: VIP users get AUTO-APPROVED (Stage 3 feature logic), Standard users get PENDING
  const isVipAutoApproved = user.role === 'VIP' ? 1 : 0;
  const initialStatus = (user.role === 'VIP' || user.role === 'ADMIN') ? 'CONFIRMED' : 'PENDING';

  // 5. Insert Reservation inside Transaction
  const insertStmt = db.prepare(`
    INSERT INTO reservations (asset_id, user_id, start_date, end_date, status, is_vip_auto_approved, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    assetId,
    user.id,
    startDate,
    endDate,
    initialStatus,
    isVipAutoApproved,
    notes || ''
  );

  const newReservation = db.prepare(`
    SELECT r.*, a.name as asset_name, u.name as user_name 
    FROM reservations r 
    JOIN assets a ON r.asset_id = a.id 
    JOIN users u ON r.user_id = u.id 
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json({
    message: initialStatus === 'CONFIRMED' 
      ? 'Reservation confirmed automatically (VIP / Admin priority).' 
      : 'Reservation submitted and pending admin approval.',
    reservation: newReservation
  });
});

// POST Return asset & calculate penalty fee if overdue
reservationRouter.post('/:id/return', authenticateToken, (req: Request, res: Response) => {
  const reservationId = parseInt(req.params.id as string, 10);
  const { returnDate } = req.body; // YYYY-MM-DD (defaults to today)

  const actualReturnDate = returnDate || new Date().toISOString().split('T')[0];

  const reservation = db.prepare(`
    SELECT r.*, a.daily_penalty_rate 
    FROM reservations r
    JOIN assets a ON r.asset_id = a.id
    WHERE r.id = ?
  `).get(reservationId) as any;

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found.' });
  }

  if (req.user!.role !== 'ADMIN' && reservation.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to return this reservation.' });
  }

  if (reservation.status !== 'CONFIRMED' && reservation.status !== 'CHECKED_OUT') {
    return res.status(400).json({ error: `Cannot return reservation with status '${reservation.status}'.` });
  }

  // Calculate late fee with VIP discount
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(reservation.user_id) as any;
  const userRole = user ? user.role : 'STANDARD';
  const penaltyCalc = calculateLatePenalty(reservation.end_date, actualReturnDate, reservation.daily_penalty_rate, userRole);

  db.prepare(`
    UPDATE reservations 
    SET status = 'RETURNED', 
        actual_return_date = ?, 
        penalty_fee = ?
    WHERE id = ?
  `).run(actualReturnDate, penaltyCalc.penaltyFee, reservationId);

  return res.json({
    message: penaltyCalc.isOverdue 
      ? `Asset returned with late penalty: $${penaltyCalc.penaltyFee.toFixed(2)} (${penaltyCalc.overdueDays} days overdue).`
      : 'Asset returned on time with no penalty fees.',
    penaltyDetails: penaltyCalc
  });
});

// POST Cancel reservation
reservationRouter.post('/:id/cancel', authenticateToken, (req: Request, res: Response) => {
  const reservationId = parseInt(req.params.id as string, 10);
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as any;

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found.' });
  }

  if (req.user!.role !== 'ADMIN' && reservation.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to cancel this reservation.' });
  }

  if (reservation.status === 'RETURNED' || reservation.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Reservation is already closed.' });
  }

  db.prepare("UPDATE reservations SET status = 'CANCELLED' WHERE id = ?").run(reservationId);

  return res.json({ message: 'Reservation cancelled successfully.' });
});

// Admin Approve / Reject endpoints
reservationRouter.post('/:id/approve', authenticateToken, requireRole('ADMIN'), (req: Request, res: Response) => {
  const reservationId = parseInt(req.params.id as string, 10);
  const resRecord = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as any;

  if (!resRecord) return res.status(404).json({ error: 'Reservation not found.' });
  if (resRecord.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot approve reservation in state '${resRecord.status}'` });
  }

  db.prepare("UPDATE reservations SET status = 'CONFIRMED' WHERE id = ?").run(reservationId);
  return res.json({ message: 'Reservation approved.' });
});

reservationRouter.post('/:id/reject', authenticateToken, requireRole('ADMIN'), (req: Request, res: Response) => {
  const reservationId = parseInt(req.params.id as string, 10);
  const resRecord = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as any;

  if (!resRecord) return res.status(404).json({ error: 'Reservation not found.' });

  db.prepare("UPDATE reservations SET status = 'REJECTED' WHERE id = ?").run(reservationId);
  return res.json({ message: 'Reservation rejected.' });
});
