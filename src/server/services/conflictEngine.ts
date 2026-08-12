import { db } from '../db/database.js';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  conflictingReservationId?: number;
  conflictingBlackoutId?: number;
}

/**
 * Validates whether dates are structurally valid and start <= end
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid calendar date specified.' };
  }

  if (start > end) {
    return { valid: false, error: 'Start date cannot be after end date.' };
  }

  // Prevent booking more than 14 days duration
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 14) {
    return { valid: false, error: 'Maximum reservation duration is 14 days.' };
  }

  return { valid: true };
}

/**
 * Checks for date overlap against active reservations and blackout periods
 */
export function checkAssetAvailability(
  assetId: number,
  startDate: string,
  endDate: string,
  excludeReservationId?: number
): ConflictCheckResult {
  // Validate basic date range integrity first
  const dateValidation = validateDateRange(startDate, endDate);
  if (!dateValidation.valid) {
    return { hasConflict: true, reason: dateValidation.error };
  }

  // 1. Check Blackout Periods
  const blackoutQuery = `
    SELECT id, reason, start_date, end_date 
    FROM blackouts 
    WHERE asset_id = ? 
      AND (start_date <= ? AND end_date >= ?)
  `;
  const blackout = db.prepare(blackoutQuery).get(assetId, endDate, startDate) as { id: number; reason: string; start_date: string; end_date: string } | undefined;

  if (blackout) {
    return {
      hasConflict: true,
      reason: `Asset is in maintenance blackout (${blackout.start_date} to ${blackout.end_date}): ${blackout.reason}`,
      conflictingBlackoutId: blackout.id
    };
  }

  // 2. Check Overlapping Active Reservations
  let reservationQuery = `
    SELECT id, start_date, end_date, status 
    FROM reservations 
    WHERE asset_id = ? 
      AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_OUT')
      AND (start_date <= ? AND end_date >= ?)
  `;
  const params: any[] = [assetId, endDate, startDate];

  if (excludeReservationId) {
    reservationQuery += ` AND id != ?`;
    params.push(excludeReservationId);
  }

  const conflictingRes = db.prepare(reservationQuery).get(...params) as { id: number; start_date: string; end_date: string; status: string } | undefined;

  if (conflictingRes) {
    return {
      hasConflict: true,
      reason: `Asset already reserved from ${conflictingRes.start_date} to ${conflictingRes.end_date} (Status: ${conflictingRes.status})`,
      conflictingReservationId: conflictingRes.id
    };
  }

  return { hasConflict: false };
}
