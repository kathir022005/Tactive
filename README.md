# EquipFlow — AI-Powered Equipment & Asset Reservation System
### Tactive Internship Hiring Assessment Submission

<div align="center">

![Live Host](https://img.shields.io/badge/Live%20Demo-tactive.onrender.com-22c55e?style=for-the-badge&logo=render)
![Build](https://img.shields.io/badge/Build-Passing-34d399?style=for-the-badge&logo=typescript)
![Tests](https://img.shields.io/badge/Tests-19%2F19%20Passing-34d399?style=for-the-badge&logo=vitest)
![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?style=for-the-badge&logo=mongodb)

### 🌐 Live Application Host: [https://tactive.onrender.com/](https://tactive.onrender.com/)

</div>

---

## 🚀 Quick Access

- **Live Host URL:** [https://tactive.onrender.com/](https://tactive.onrender.com/)
- **GitHub Repository:** [https://github.com/kathir022005/Tactive](https://github.com/kathir022005/Tactive)
- **PDF Assessment Report:** [`docs/QA_TEST_REPORT_BEFORE_AFTER.pdf`](file:///docs/QA_TEST_REPORT_BEFORE_AFTER.pdf)

### Run Locally:
```bash
git clone https://github.com/kathir022005/Tactive.git
cd Tactive
npm install
npm run dev      # Server on :3000 with MongoDB Atlas connection
```

---

## 📋 Assessment Requirements Mapping

| Requirement | Status | Implementation |
|---|---|---|
| Real scenario with business rules | ✅ | Equipment reservation with 5 domain rules |
| Automated test suite (Happy + Edge + Invalid) | ✅ | 19 tests across 3 groups |
| Deliberate Red Run with captured output | ✅ | `npm run test:red` → `docs/RED_RUN_REPORT.md` |
| AI Change Loop (new feature → fail → fix) | ✅ | VIP Tier feature — `docs/AI_CHANGE_LOOP_LOG.md` |
| Security (auth, validation, no secrets) | ✅ | JWT + Zod + parameterized SQL |
| Architecture Documentation | ✅ | `docs/ARCHITECTURE.md` |
| Design Documentation | ✅ | `docs/DESIGN.md` |
| User Guide | ✅ | `docs/USER_GUIDE.md` |
| Presentation Deck | ✅ | `docs/PRESENTATION.html` |
| Demo Script | ✅ | `docs/DEMO_SCRIPT.md` |

---

## 🛠️ All Available Commands

```bash
npm run dev          # Launch full stack (backend + vite dev proxy)
npm run build        # Production build (client + server)
npm run test:unit    # Run 19 Vitest API integration tests
npm run test:e2e     # Run Playwright browser E2E tests
npm run test:red     # Deliberate red run + capture failure evidence
```

---

## 🏗️ Core Business Rules (Tested & Enforced)

| Rule | Constraint | Enforced By |
|---|---|---|
| **Conflict Detection** | No double-booking same asset in overlapping dates | `conflictEngine.ts` |
| **User Quota** | Standard users: max 3 active reservations | `quotaEngine.ts` |
| **Blackout Windows** | Admin can block assets for maintenance | `conflictEngine.ts` (blackout join) |
| **Duration Limit** | Max 14 days per reservation | `conflictEngine.ts` → `validateDateRange()` |
| **Date Validity** | Start must not be after end date | `conflictEngine.ts` → `validateDateRange()` |
| **Late Fee Penalty** | Per-day rate × overdue days | `penaltyCalculator.ts` |
| **VIP Priority** | Auto-confirmed, 50% late fee discount | `reservationRoutes.ts` + `penaltyCalculator.ts` |

---

## 👥 Default Test Accounts

| Username | Password | Role | Behaviour |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | Full access, no quota, approves bookings |
| `jane_doe` | `user123` | VIP | Auto-confirmed, 50% penalty discount |
| `john_smith` | `user123` | STANDARD | 3-booking quota, pending approval queue |
| `alice_wong` | `user123` | STANDARD | Same as john_smith |

---

## 🗂️ Project Structure

```
Tactive/
├── src/
│   ├── server/
│   │   ├── db/          database.ts (SQLite schema + seed)
│   │   ├── middleware/  auth.ts, validation.ts (JWT + Zod)
│   │   ├── routes/      authRoutes, assetRoutes, reservationRoutes, adminRoutes
│   │   ├── services/    conflictEngine, quotaEngine, penaltyCalculator
│   │   └── app.ts, index.ts
│   └── client/
│       ├── components/  Navbar, AssetCatalog, BookingModal, MyReservations, AdminPanel
│       ├── styles/      index.css (Premium dark glassmorphism design system)
│       ├── types.ts, App.tsx, main.tsx
├── tests/
│   ├── api/             reservation.test.ts (19 Vitest tests)
│   ├── e2e/             reservation.spec.ts (Playwright browser tests)
│   └── scripts/         run-red-run.ts
├── docs/                ARCHITECTURE, DESIGN, USER_GUIDE, AI_CHANGE_LOOP_LOG, PRESENTATION
└── README.md
```

---

## 🧪 Test Coverage Summary

**19 API Integration Tests across 3 groups:**

### Group 1 — Happy Path (6 tests)
- Asset inventory load
- Health check endpoint
- VIP auto-confirmed booking
- Standard user pending booking  
- Admin approve workflow
- Admin reject workflow

### Group 2 — Business Rules & Edge Cases (5 tests)
- Overlap conflict detection (409)
- Standard user quota enforcement (400)
- Maintenance blackout window (409)
- VIP late fee with 50% discount
- On-time return = $0 penalty

### Group 3 — Invalid Inputs & Security (8 tests)
- Inverted date range rejection
- Duration limit (>14 days) rejection
- Non-existent asset ID
- Unauthenticated request (401)
- Standard user blackout attempt (403)
- Missing required fields (Zod 400)
- Invalid date format (400)
- CORS / header validation

---

## 🔐 Security Measures

- **JWT Authentication** — Bearer token on all protected routes
- **Role-Based Access Control** — `STANDARD / VIP / ADMIN` roles enforced per endpoint
- **Zod Input Validation** — Schema-level validation before any DB operation
- **Parameterized SQL Queries** — SQLite3 prepared statements, no injection risk
- **No Secrets in Repo** — JWT secret is env-configurable via `process.env.JWT_SECRET`

---

*Built for the Tactive Software Engineering Internship Assessment · 2026*
