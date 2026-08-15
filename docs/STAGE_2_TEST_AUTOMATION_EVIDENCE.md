# Stage 2 — Test Automation Evidence
EquipFlow Asset Reservation System · Tactive Internship Assessment

---

## Test Suite Overview

- **Framework**: Vitest + Supertest (API & Integration tests), Playwright (E2E browser tests)
- **Location**: `tests/api/reservation.test.ts`
- **API Tests**: 19 tests covering domain business rules, edge cases, and security validations against Express REST API & MongoDB Atlas database stack
- **Total**: 19 tests, 19 passing on a clean run (15 sec 78 ms)

---

## Coverage Matrix

| Rule | Normal path | Edge case | Invalid input |
|---|---|---|---|
| **Asset Availability & Conflicts** | Reserve available asset succeeds | Overlapping start/end date boundary | Non-existent asset ID → 404 |
| **Reservation Quota** | Order under limit (1 or 2 active) | Exactly 3 active reservations succeeds | 4th reservation attempt rejected → 400 |
| **Duration Limit** | Booking duration ≤ 14 days succeeds | Exactly 14 days reservation succeeds | Duration > 14 days rejected → 409 |
| **Maintenance Blackout** | Reserve outside blackout window | Booking adjacent to blackout boundary | Booking inside admin blackout window → 409 |
| **VIP Tier & Auto-Approval** | VIP booking auto-confirms (CONFIRMED) | VIP role privilege check | Standard user booking enters PENDING queue |
| **Late Penalty Fee** | On-time return → $0 penalty | Overdue return → 50% VIP fee discount | Inverted dates (start > end) → 409 |
| **Auth & Authorization** | Valid Bearer JWT token succeeds | Token expiration handling | Missing token → 401; Standard user blackout creation → 403 |

---

## Deliberate Red Run

### What we broke
The date-overlap conflict check in `conflictEngine.ts` was commented out, simulating a real regression (e.g. someone accidentally removes date validation during a refactor):

```typescript
// DELIBERATE REGRESSION INJECTED FOR QA ASSESSMENT RED RUN
// if (conflictingRes) {
//   return { hasConflict: true, reason: `Asset already reserved from ${conflictingRes.start_date} to ${conflictingRes.end_date}` };
// }
```

### Result
**1 test failed, 18 passed** (19 total, 994 ms).

- `CONFLICT: Overlapping dates for same asset must be rejected (409)` — expected HTTP 409 Conflict with message containing "conflict"; instead received HTTP 201 Created (double booking allowed).

### Why the failure matters
With the conflict check gone, double-booking equipment was allowed by the system. Without automated test assertions targeting exact status codes (`409`) and conflict error payloads, double bookings would silently reach production, leading to overlapping equipment reservations and operational chaos. Our test suite caught the regression immediately.

### Fix
Restored the conflict checking logic in `conflictEngine.ts` and re-ran the full suite.

**Result after fix: 19 tests passed, 19 total (15 sec 78 ms).**

---

## What This Demonstrates

- **The suite is not "always green" by construction** — it fails when core domain code is broken, and the failure message is specific enough to pinpoint the exact broken function (`checkAssetAvailability`).
- **Strict Domain Contract Validation** — tests assert on exact HTTP status codes (`409`, `400`, `401`, `403`, `404`, `201`), role-based access controls, and detailed response error messages.
