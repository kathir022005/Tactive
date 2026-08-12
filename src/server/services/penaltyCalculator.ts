export interface PenaltyCalculation {
  isOverdue: boolean;
  overdueDays: number;
  dailyRate: number;
  rawPenaltyFee: number;
  discountAmount: number;
  penaltyFee: number;
  appliedDiscountPercentage: number;
}

/**
 * Calculates late penalty fee with optional VIP discount (50% off for VIP role)
 */
export function calculateLatePenalty(
  endDateStr: string,
  actualReturnDateStr: string,
  dailyRate: number,
  userRole: 'STANDARD' | 'VIP' | 'ADMIN' = 'STANDARD'
): PenaltyCalculation {
  const endDate = new Date(endDateStr);
  const actualReturnDate = new Date(actualReturnDateStr);

  endDate.setHours(0, 0, 0, 0);
  actualReturnDate.setHours(0, 0, 0, 0);

  const diffMs = actualReturnDate.getTime() - endDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    const rawPenaltyFee = diffDays * dailyRate;
    const discountPercentage = (userRole === 'VIP' || userRole === 'ADMIN') ? 50 : 0;
    const discountAmount = (rawPenaltyFee * discountPercentage) / 100;
    const finalPenaltyFee = rawPenaltyFee - discountAmount;

    return {
      isOverdue: true,
      overdueDays: diffDays,
      dailyRate,
      rawPenaltyFee,
      discountAmount,
      penaltyFee: finalPenaltyFee,
      appliedDiscountPercentage: discountPercentage
    };
  }

  return {
    isOverdue: false,
    overdueDays: 0,
    dailyRate,
    rawPenaltyFee: 0,
    discountAmount: 0,
    penaltyFee: 0.0,
    appliedDiscountPercentage: 0
  };
}
