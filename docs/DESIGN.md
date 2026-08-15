# EquipFlow — UI/UX & Design System Architecture

## 1. Overview & Aesthetics

EquipFlow uses a **Dark Glassmorphism UI System** designed for enterprise productivity with state-of-the-art aesthetics.

- **Theme Base**: Deep obsidian/space grey `#0a0a0f` with semi-transparent frosted glass panels (`backdrop-filter: blur(16px)`).
- **Typography**: Inter (UI elements) + JetBrains Mono (serial numbers, IDs, status metrics).
- **Color Tokens**:
  - Primary Accent: Electric Blue `#3b82f6` (actions, interactive buttons)
  - Success / Available: Emerald Green `#22c55e` (active equipment, approved status)
  - Warning / Maintenance: Amber `#f59e0b` (blackout windows, pending approval)
  - VIP Role Accent: Violet / Purple `#8b5cf6` (auto-approval badges, 50% discount tags)
  - Danger / Rejected: Crimson Red `#ef4444` (rejected requests, penalty warnings)

---

## 2. Key Components

### 1. `Login.tsx` & `Register.tsx`
- Glassmorphic card container with quick-login shortcuts for assessment evaluators (Admin, VIP, Standard).
- Form inputs with real-time validation and error badges.

### 2. `Navbar.tsx`
- Sticky top navigation bar.
- Role badge indicator showing active user role (`ADMIN`, `VIP`, or `STANDARD`).
- Live system metrics pill (Available Assets count, Pending Requests count).

### 3. `AssetCatalog.tsx`
- Grid view of all corporate assets.
- Live search & filtering by category (Laptops, AV Equipment, Testing Devices, Drones, Peripherals).
- Instant availability indicator & daily late penalty rate tags.

### 4. `BookingModal.tsx`
- Contextual modal for equipment reservation.
- Real-time date validation (max 14 days duration, start <= end).
- VIP auto-approval badge preview.

### 5. `MyReservations.tsx`
- Reservation tracking list sorted by creation date.
- Real-time return modal with late fee penalty calculation (including 50% VIP discount logic).

### 6. `AdminPanel.tsx`
- Pending approval queue with 1-click Approve/Reject actions.
- Maintenance blackout window management tool.
- Asset inventory registration modal.

---

## 3. Responsive Breakpoints

- **Desktop (≥ 1024px)**: Multi-column asset grid, full admin table layout.
- **Tablet (768px - 1023px)**: 2-column responsive grid with collapsed navbar stats.
- **Mobile (< 768px)**: Single column fluid layout with stacked controls.
