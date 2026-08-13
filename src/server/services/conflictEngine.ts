import { Reservation } from '../db/models.js';
import { Blackout } from '../db/models.js';
import { Types } from 'mongoose';

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
}

export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid calendar date specified.' };
  }
  if (start > end) {
    return { valid: false, error: 'Start date cannot be after end date.' };
  }
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 14) {
    return { valid: false, error: 'Maximum reservation duration is 14 days.' };
  }
  return { valid: true };
}

export async function checkAssetAvailability(
  assetId: string | Types.ObjectId,
  startDate: string,
  endDate: string,
  excludeReservationId?: string
): Promise<ConflictCheckResult> {
  // Date validation
  const dateValidation = validateDateRange(startDate, endDate);
  if (!dateValidation.valid) return { hasConflict: true, reason: dateValidation.error };

  // 1. Check Blackout Periods
  const blackout = await Blackout.findOne({
    asset_id: assetId,
    start_date: { $lte: endDate },
    end_date:   { $gte: startDate },
  });

  if (blackout) {
    return {
      hasConflict: true,
      reason: `Asset is in maintenance blackout (${blackout.start_date} to ${blackout.end_date}): ${blackout.reason}`,
    };
  }

  // 2. Check Overlapping Active Reservations
  const query: any = {
    asset_id:   assetId,
    status:     { $in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] },
    start_date: { $lte: endDate },
    end_date:   { $gte: startDate },
  };

  if (excludeReservationId) {
    query._id = { $ne: new Types.ObjectId(excludeReservationId) };
  }

  const conflictingRes = await Reservation.findOne(query);
  if (conflictingRes) {
    return {
      hasConflict: true,
      reason: `Asset already reserved from ${conflictingRes.start_date} to ${conflictingRes.end_date} (Status: ${conflictingRes.status})`,
    };
  }

  return { hasConflict: false };
}
