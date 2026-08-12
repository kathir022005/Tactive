# Stage 2 — Deliberate Red Run Report & Failure Capture

## Overview
As mandated by Section 2 (Stage 2) of the **Tactive Assessment Brief**, an automated test suite that always passes proves nothing. To prove the validity of our test suite, this report documents a **deliberate red run** where a regression was intentionally introduced into the domain conflict engine and caught by the automated test suite.

---

## Injected Code Regression

**Target File**: [`src/server/services/conflictEngine.ts`](file:///c:/Users/kathi/Downloads/Tactive/src/server/services/conflictEngine.ts)  
**Flaw Details**: Disabled the date overlap detection logic inside `checkAssetAvailability()`, allowing double-booking of equipment during conflicting time windows.

```diff
-  if (conflictingRes) {
-    return {
-      hasConflict: true,
-      reason: `Asset already reserved from ${conflictingRes.start_date} to ${conflictingRes.end_date}`,
-      conflictingReservationId: conflictingRes.id
-    };
-  }
+  // DELIBERATE REGRESSION INJECTED FOR QA ASSESSMENT RED RUN
+  // Skipping conflict rejection logic...
+  console.log('[RED RUN BUG INJECTED] Ignored date overlap conflict!');
```

---

## Test Suite Execution Outcome

- **Overall Status**: **`FAILED (RED RUN CONFIRMED)`**
- **Triggered Test**: `CRITICAL: Should REJECT overlapping date reservation for same asset`
- **Expected Status**: `HTTP 409 Conflict`
- **Actual Received**: `HTTP 201 Created` (Double booking succeeded due to injected bug)

### Captured Terminal Output Logs

```text

[1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90mC:/Users/kathi/Downloads/Tactive[39m

[90mstdout[2m | tests/api/reservation.test.ts[2m > [22m[2mEquipFlow — Complete QA Automation API Test Suite[2m > [22m[2m2. Business Rules & Edge Cases[2m > [22m[2mCONFLICT: Overlapping dates for same asset must be rejected (409)
[22m[39m[RED RUN BUG INJECTED] Ignored date overlap conflict!

 [31m❯[39m tests/api/reservation.test.ts [2m([22m[2m19 tests[22m[2m | [22m[31m1 failed[39m[2m)[22m[32m 219[2mms[22m[39m
       [32m✓[39m GET /api/assets → should return seeded inventory list[32m 10[2mms[22m[39m
       [32m✓[39m GET /api/health → API health check should return ok[32m 6[2mms[22m[39m
       [32m✓[39m VIP User creates auto-confirmed reservation (no admin queue)[32m 9[2mms[22m[39m
       [32m✓[39m Standard User creates reservation → enters PENDING review queue[32m 7[2mms[22m[39m
       [32m✓[39m Admin can approve a pending reservation[32m 18[2mms[22m[39m
       [32m✓[39m Admin can reject a pending reservation[32m 14[2mms[22m[39m
       [32m✓[39m User can cancel their own PENDING reservation[32m 10[2mms[22m[39m
[31m       [31m×[31m CONFLICT: Overlapping dates for same asset must be rejected (409)[39m[32m 14[2mms[22m[39m
       [32m✓[39m QUOTA: Standard user blocked after 3 active reservations (4th attempt must fail)[32m 15[2mms[22m[39m
       [32m✓[39m BLACKOUT: Reservation blocked during admin-declared maintenance window[32m 10[2mms[22m[39m
       [32m✓[39m PENALTY (VIP): 3 days overdue on $30/day asset → $45 (50% VIP discount)[32m 10[2mms[22m[39m
       [32m✓[39m PENALTY (Standard): On-time return = $0 penalty, no discount applicable[32m 9[2mms[22m[39m
       [32m✓[39m REJECT: Inverted dates — start after end[32m 5[2mms[22m[39m
       [32m✓[39m REJECT: Duration over 14-day maximum limit[32m 4[2mms[22m[39m
       [32m✓[39m REJECT: Non-existent asset ID returns 404[32m 6[2mms[22m[39m
       [32m✓[39m REJECT: Unauthenticated request returns 401[32m 3[2mms[22m[39m
       [32m✓[39m REJECT: Standard user cannot create admin blackouts (403 Forbidden)[32m 5[2mms[22m[39m
       [32m✓[39m REJECT: Missing required fields triggers Zod 400 validation error[32m 9[2mms[22m[39m
       [32m✓[39m REJECT: Invalid date format triggers validation error[32m 4[2mms[22m[39m

[2m Test Files [22m [1m[31m1 failed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m18 passed[39m[22m[90m (19)[39m
[2m   Start at [22m 21:32:21
[2m   Duration [22m 994ms[2m (transform 155ms, setup 0ms, import 546ms, tests 219ms, environment 0ms)[22m


```

---

## Conclusion & Diagnostic Summary

1. **Detection Effectiveness**: The Vitest API automation suite immediately flagged the double-booking flaw with an assertion error (`expected 201 to be 409`).
2. **System Resiliency**: The code was restored to original working state immediately after capture (`npm run test` returned 100% green).
3. **Verification Command**: Run `npm run test:red` anytime to reproduce this deliberate failure report automatically.
