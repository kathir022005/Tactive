import { User, Reservation } from '../db/models.js';

export const STANDARD_USER_QUOTA = 3;

export interface QuotaCheckResult {
  allowed: boolean;
  activeCount: number;
  maxQuota: number;
  reason?: string;
}

export async function checkUserReservationQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await User.findById(userId).select('role name').lean();

  if (!user) {
    return { allowed: false, activeCount: 0, maxQuota: 0, reason: 'User not found.' };
  }

  // VIP & ADMIN users have unlimited quota
  if (user.role === 'VIP' || user.role === 'ADMIN') {
    return { allowed: true, activeCount: 0, maxQuota: Infinity };
  }

  // Count active reservations for STANDARD users
  const activeCount = await Reservation.countDocuments({
    user_id: userId,
    status:  { $in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] },
  });

  if (activeCount >= STANDARD_USER_QUOTA) {
    return {
      allowed: false,
      activeCount,
      maxQuota: STANDARD_USER_QUOTA,
      reason: `Standard user quota exceeded (${activeCount}/${STANDARD_USER_QUOTA} active reservations). Return an asset before making a new booking.`,
    };
  }

  return { allowed: true, activeCount, maxQuota: STANDARD_USER_QUOTA };
}
