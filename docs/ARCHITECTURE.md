# Architecture — EquipFlow Platform

## System Overview

EquipFlow is a **full-stack monorepo** assessment submission built with a Node.js/Express REST API backend, a React single-page application frontend, and a SQLite persistent database layer. All components communicate over HTTP with JWT-authenticated requests.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  BROWSER (React SPA)                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Catalog  │  │ Reservations │  │ Admin Panel  │  │
│  └──────────┘  └──────────────┘  └──────────────┘  │
│         ↕ fetch() + Bearer JWT token                │
└─────────────────────────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────┐
│              EXPRESS REST API (:3000)               │
│  ┌──────────────────────────────────────────────┐  │
│  │   Middleware Stack                           │  │
│  │   cors → express.json → authenticateToken   │  │
│  │   → requireRole → validateBody (Zod)         │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ /auth    │  │ /assets     │  │ /reservations│  │
│  └──────────┘  └─────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │   Domain Services                            │  │
│  │   conflictEngine · quotaEngine               │  │
│  │   penaltyCalculator                          │  │
│  └──────────────────────────────────────────────┘  │
│         ↕ better-sqlite3 prepared statements        │
└─────────────────────────────────────────────────────┘
                      │ SQL
┌─────────────────────▼───────────────────────────────┐
│          SQLite Database (data/equipflow.db)        │
│  users · assets · reservations · blackouts · logs  │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend (React + Vite)

| Component | Responsibility |
|---|---|
| `App.tsx` | Root state orchestrator, API calls, routing |
| `Navbar` | User switcher, live stats, role indicator |
| `AssetCatalog` | Grid display, search/filter, availability bar |
| `BookingModal` | Date picker, duration validator, conflict preview |
| `MyReservations` | Active bookings, return modal, penalty display |
| `AdminPanel` | Approval queue, blackout management, asset registration |

### Backend (Node.js + Express)

| Module | Responsibility |
|---|---|
| `app.ts` | Express app factory, middleware chain, route mounting |
| `authRoutes` | `/login` endpoint, JWT issue, `/me` |
| `assetRoutes` | `GET /assets`, `GET /assets/:id`, `POST /assets` (Admin) |
| `reservationRoutes` | Create, list, return, cancel, approve, reject |
| `adminRoutes` | Blackout CRUD, audit logs |

### Domain Services

| Service | Logic |
|---|---|
| `conflictEngine.ts` | `checkAssetAvailability()` — Checks `(startA ≤ endB) AND (endA ≥ startB)` against active reservations AND blackout windows. Also validates date format and max duration. |
| `quotaEngine.ts` | `checkUserReservationQuota()` — Counts active reservations per user. STANDARD cap at 3. VIP/ADMIN unlimited. |
| `penaltyCalculator.ts` | `calculateLatePenalty()` — Returns `overdueDays × dailyRate × (1 - discountPct)`. VIP discount = 50%. |

---

## Database Schema

```sql
users        (id, username, password_hash, name, role, department)
assets       (id, name, category, serial_number, status, daily_penalty_rate, description, location)
reservations (id, asset_id, user_id, start_date, end_date, status, is_vip_auto_approved, penalty_fee, actual_return_date, notes)
blackouts    (id, asset_id, start_date, end_date, reason)
audit_logs   (id, action, user_id, details, timestamp)
```

---

## Security Architecture

```
Request → CORS check → JWT verify → Role check → Zod schema validation → Controller → Parameterized SQL
```

- JWT secret is configurable via `JWT_SECRET` environment variable
- Passwords are compared directly (demo mode — in production: bcrypt)
- All SQL uses prepared statements (`db.prepare().run()`) — no string concatenation
- Role enforcement is done in middleware before controller execution
