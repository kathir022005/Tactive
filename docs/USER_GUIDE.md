# EquipFlow — User Guide

## 1. Getting Started

### Running the Application Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (frontend + backend)
npm run dev

# 3. Open your browser at:
http://localhost:3000
```

---

## 2. Login / Register

### Login Page
On first load, you will see the **Login Screen**. You can:
- Enter a **username and password** manually
- Use the **Quick Login** buttons for instant access during assessment/demo

| Button | Role | Credentials |
|---|---|---|
| Admin | Full Access | `admin` / `admin123` |
| VIP User | Auto-Approve + 50% Late Fee Discount | `jane_doe` / `user123` |
| Standard User | Normal Access + 3-booking Quota | `john_smith` / `user123` |

### Register Page
New users can self-register with:
- **Username** (must be unique)
- **Full Name**
- **Department**
- **Password**

All new accounts are assigned the `STANDARD` role by default. Admin must manually elevate to `VIP` or `ADMIN`.

---

## 3. Asset Catalog

The **Asset Catalog** is the main screen for all users after login. It displays:

- All available and unavailable equipment
- **Status badge** (Available 🟢 / Reserved 🔴 / Maintenance 🟡)
- Daily late penalty rate per item
- Location and category of each asset

### Search & Filter
- **Search box**: Type to filter by asset name or category
- **Category filter**: Dropdown to show only one category (Laptops, Cameras, A/V Equipment, etc.)
- **Status filter**: Show only Available, or show all items

### Booking an Asset
1. Click the **"Reserve"** button on any available asset.
2. A **Booking Modal** will appear. Fill in:
   - **Start Date** (today or a future date)
   - **End Date** (max 14 days after start)
   - **Notes** (optional — purpose of booking)
3. The system will automatically check for:
   - Date conflicts with existing reservations
   - Admin maintenance blackout windows
   - Your current active booking quota
4. Click **Confirm Reservation** to submit.

> **VIP Users**: Your reservation will be instantly confirmed (green ✅).
> **Standard Users**: Your reservation enters PENDING status and requires Admin approval.

---

## 4. My Reservations

Navigate to **"My Reservations"** tab to see all your active and past bookings.

### Reservation Statuses

| Status | Meaning |
|---|---|
| 🟡 PENDING | Awaiting Admin approval |
| 🟢 CONFIRMED | Approved and active |
| 🔴 REJECTED | Declined by Admin |
| ⚫ RETURNED | Equipment returned |
| 🚫 CANCELLED | Cancelled by you |

### Returning Equipment
1. On any **CONFIRMED** reservation, click the **"Return"** button.
2. Enter the **actual return date**.
3. If returned after the end date, the system will automatically calculate the **late penalty fee**.
   - VIP users receive a **50% discount** on the penalty.
   - Standard users pay the **full daily rate**.

### Cancelling a Reservation
You can cancel any reservation that is still in **PENDING** status before it gets approved.

---

## 5. Admin Panel (Admin users only)

Click the **"Admin"** tab to access the Admin Panel.

### Pending Approvals
- A queue of all pending reservation requests from Standard users.
- Click **Approve ✅** to confirm the booking.
- Click **Reject ❌** to decline — the equipment becomes available again.

### Maintenance Blackouts
- Create time windows during which a specific asset cannot be booked by anyone.
- Select the **asset**, **start date**, **end date**, and a **reason** (e.g., "Annual servicing").
- Any booking request that overlaps with a blackout window will be automatically rejected.

### Asset Management
- Add new equipment to the inventory.
- Set the asset's name, category, serial number, location, and **daily late penalty rate**.

---

## 6. Business Rules Summary

| Rule | Limit | Who it applies to |
|---|---|---|
| Max active reservations | 3 | Standard Users |
| Max booking duration | 14 days | All Users |
| Auto-confirmation | Instant | VIP & Admin Users |
| Late fee discount | 50% off | VIP & Admin Users |
| Blackout window enforcement | System-wide | All Users |
| Admin approval required | Yes (PENDING queue) | Standard Users |

---

## 7. Running the Test Suite

```bash
# Run all unit/API tests
npm run test

# Run only API tests
npm run test:unit

# Run the deliberate red run (proves tests catch regressions)
npm run test:red
```

Expected output for a passing run:
```
✓ tests/api/reservation.test.ts (19 tests)
Test Files  1 passed (1)
     Tests  19 passed (19)
```
