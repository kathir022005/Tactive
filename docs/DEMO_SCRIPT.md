# EquipFlow — 5-Minute Video Presentation Script

## Video Overview (5 Minutes Total)

- **Segment 1 (0:00 - 2:00)**: Problem Statement, Engineering Approach & Solution Architecture
- **Segment 2 (2:00 - 5:00)**: Live System Demonstration (Hosted at https://tactive.onrender.com/)

---

## Segment 1: Problem & Solution Architecture (2 Minutes)

### 0:00 - 0:45 | Problem Statement
"Hello! Today I'm presenting **EquipFlow**, built for the Tactive Assessment. In enterprise organizations, corporate equipment management often suffers from spreadsheet chaos—leading to double-booked assets, unreturned laptops, and heavy manual admin overhead."

### 0:45 - 1:30 | Technical Approach & Architecture
"To solve this, we engineered a full-stack monorepo application:
- **Backend**: Node.js & Express REST API with JWT authentication and Zod schema validation.
- **Database**: Cloud-hosted MongoDB Atlas cluster for scalable persistence.
- **Frontend**: Single-page application built with React 19 and a dark glassmorphism design system.
- **Live Deployment**: Hosted on Render at `https://tactive.onrender.com/`."

### 1:30 - 2:00 | QA & Business Rules
"We enforced 5 core domain rules at the API layer: maximum 3 active reservations per standard user, zero date overlap allowance, max 14-day booking limit, admin maintenance blackouts, and a VIP tier featuring instant auto-approval and a 50% discount on late return penalty fees. Our Vitest test suite achieves 100% pass rate across 19 API integration tests, validated by a deliberate Red Run failure test."

---

## Segment 2: Live System Walkthrough (3 Minutes)

### 2:00 - 2:45 | Login & VIP Auto-Approval Demo
1. Open **https://tactive.onrender.com/**.
2. Use Quick Login as **Jane Doe (VIP User)**.
3. Reserve the **MacBook Pro M3 Max** from Sep 1 to Sep 5.
4. Point out that because Jane is a **VIP User**, the reservation is **auto-confirmed immediately** (status: `CONFIRMED`) without needing admin review.

### 2:45 - 3:30 | Standard User Quota & Admin Queue
1. Switch account to **John Smith (Standard User)**.
2. Reserve the **Sony A7 IV Camera**. Point out that standard bookings enter the **PENDING** queue.
3. Switch to **Admin Account** (`admin` / `admin123`).
4. Open the **Admin Panel** -> **Pending Approvals** tab.
5. Click **Approve ✅**. Show how the reservation status updates live to `CONFIRMED`.

### 3:30 - 4:15 | Late Return Penalty Calculation (VIP 50% Discount)
1. In **My Reservations**, click **Return Asset** on Jane Doe's overdue booking (3 days past end date).
2. Show the automated penalty fee calculation:
   - Raw rate: $30/day × 3 days = $90.
   - **VIP 50% Discount applied**: Final penalty fee = **$45.00**.

### 4:15 - 5:00 | Admin Blackouts & QA Automation Summary
1. Go to **Admin Panel** -> **Maintenance Blackouts**.
2. Declare a blackout on the Dell Monitor for Dec 20–31 ("Firmware Upgrade").
3. Try booking the Dell Monitor during Dec 22–25 -> Show the system returning a **409 Conflict** error.
4. Highlight that all 19 automated tests are green and the code repository is fully documented on GitHub.
"Thank you!"
