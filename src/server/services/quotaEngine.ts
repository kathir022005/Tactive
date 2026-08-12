import { db } from '../db/database.js';

export const STANDARD_USER_QUOTA = 3;

export interface QuotaCheckResult {
  allowed: boolean;
  activeCount: number;
  maxQuota: number;
  reason?: string;
}

export function checkUserReservationQuota(userId: number): QuotaCheckResult {
  const user = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(userId) as { id: number; role: string; name: string } | undefined;

  if (!user) {
    return { allowed: false, activeCount: 0, maxQuota: 0, reason: 'User not found.' };
  }

  // VIP & ADMIN users have unlimited quota
  if (user.role === 'VIP' || user.role === 'ADMIN') {
    return { allowed: true, activeCount: 0, maxQuota: Infinity };
  }

  // Count active reservations for STANDARD users
  const activeCountRes = db.prepare(`
    SELECT COUNT(*) as count 
    FROM reservations 
    WHERE user_id = ? 
      AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_OUT')
  `).get(userId) as { count: number };

  const activeCount = activeCountRes.count;

  if (activeCount >= STANDARD_USER_QUOTA) {
    return {
      allowed: false,
      activeCount,
      maxQuota: STANDARD_USER_QUOTA,
      reason: `Standard user quota exceeded (${activeCount}/${STANDARD_USER_QUOTA} active reservations). Return an asset before making a new booking.`
    };
  }

  return {
    allowed: true,
    activeCount,
    maxQuota: STANDARD_USER_QUOTA
  };
}
