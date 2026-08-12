import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';

let app: any;
let adminToken: string;
let standardToken: string;
let vipToken: string;

describe('EquipFlow — Complete QA Automation API Test Suite', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = createApp();

    // ── Authenticate all test users ──
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.token;
    expect(adminToken, 'Admin login must succeed').toBeDefined();

    const stdLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'john_smith', password: 'user123' });
    standardToken = stdLogin.body.token;
    expect(standardToken, 'Standard user login must succeed').toBeDefined();

    const vipLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jane_doe', password: 'user123' });
    vipToken = vipLogin.body.token;
    expect(vipToken, 'VIP user login must succeed').toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════
  // 1.  HAPPY PATH — Everything works as expected
  // ═══════════════════════════════════════════════════════════════
  describe('1. Happy Path Scenarios', () => {
    it('GET /api/assets → should return seeded inventory list', async () => {
      const res = await request(app).get('/api/assets');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.assets)).toBe(true);
      expect(res.body.assets.length).toBeGreaterThan(0);
    });

    it('GET /api/health → API health check should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('VIP User creates auto-confirmed reservation (no admin queue)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 1, startDate: '2026-09-01', endDate: '2026-09-05', notes: 'VIP auto-approval test' });

      expect(res.status).toBe(201);
      expect(res.body.reservation.status).toBe('CONFIRMED');
      expect(res.body.reservation.is_vip_auto_approved).toBe(1);
    });

    it('Standard User creates reservation → enters PENDING review queue', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 2, startDate: '2026-09-10', endDate: '2026-09-12', notes: 'Standard pending test' });

      expect(res.status).toBe(201);
      expect(res.body.reservation.status).toBe('PENDING');
    });

    it('Admin can approve a pending reservation', async () => {
      // Create pending booking first
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 5, startDate: '2026-11-01', endDate: '2026-11-03' });

      const resId = booking.body.reservation.id;
      const approve = await request(app)
        .post(`/api/reservations/${resId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approve.status).toBe(200);
      expect(approve.body.message).toContain('approved');
    });

    it('Admin can reject a pending reservation', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 5, startDate: '2026-11-20', endDate: '2026-11-22' });

      const resId = booking.body.reservation.id;
      const reject = await request(app)
        .post(`/api/reservations/${resId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reject.status).toBe(200);
    });

    it('User can cancel their own PENDING reservation', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 5, startDate: '2026-12-10', endDate: '2026-12-12' });

      const cancel = await request(app)
        .post(`/api/reservations/${booking.body.reservation.id}/cancel`)
        .set('Authorization', `Bearer ${standardToken}`);

      expect(cancel.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 2.  BUSINESS RULES & EDGE CASES
  // ═══════════════════════════════════════════════════════════════
  describe('2. Business Rules & Edge Cases', () => {
    it('CONFLICT: Overlapping dates for same asset must be rejected (409)', async () => {
      // Asset 1 is booked 2026-09-01 → 2026-09-05 from Happy Path
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 1, startDate: '2026-09-03', endDate: '2026-09-07' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('conflict');
      expect(res.body.reason).toBeDefined();
    });

    it('QUOTA: Standard user blocked after 3 active reservations (4th attempt must fail)', async () => {
      // john_smith already has 1 active from happy path (assetId 2, pending)
      // Add 2 more to reach quota of 3
      await request(app).post('/api/reservations').set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 3, startDate: '2026-10-01', endDate: '2026-10-03' });
      await request(app).post('/api/reservations').set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 5, startDate: '2026-10-08', endDate: '2026-10-10' });

      // 4th must be blocked
      const fourth = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 1, startDate: '2026-10-20', endDate: '2026-10-22' });

      expect(fourth.status).toBe(400);
      expect(fourth.body.error).toContain('quota exceeded');
    });

    it('BLACKOUT: Reservation blocked during admin-declared maintenance window', async () => {
      // Declare blackout on asset 5 for December
      await request(app).post('/api/admin/blackouts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: 5, startDate: '2026-12-20', endDate: '2026-12-31', reason: 'Year-end firmware upgrade' });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 5, startDate: '2026-12-22', endDate: '2026-12-25' });

      expect(res.status).toBe(409);
      expect(res.body.reason).toContain('maintenance blackout');
    });

    it('PENALTY (VIP): 3 days overdue on $30/day asset → $45 (50% VIP discount)', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 5, startDate: '2026-07-20', endDate: '2026-07-28' });

      expect(booking.status).toBe(201);
      const resId = booking.body.reservation.id;

      const returnRes = await request(app)
        .post(`/api/reservations/${resId}/return`)
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ returnDate: '2026-07-31' }); // 3 days overdue

      expect(returnRes.status).toBe(200);
      expect(returnRes.body.penaltyDetails.isOverdue).toBe(true);
      expect(returnRes.body.penaltyDetails.overdueDays).toBe(3);
      // $30 * 3 = $90 raw → 50% VIP discount = $45
      expect(returnRes.body.penaltyDetails.penaltyFee).toBe(45.0);
      expect(returnRes.body.penaltyDetails.appliedDiscountPercentage).toBe(50);
    });

    it('PENALTY (Standard): On-time return = $0 penalty, no discount applicable', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: 1, startDate: '2026-08-05', endDate: '2026-08-10' });

      const returnRes = await request(app)
        .post(`/api/reservations/${booking.body.reservation.id}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ returnDate: '2026-08-10' }); // Exact return date, no overdue

      expect(returnRes.status).toBe(200);
      expect(returnRes.body.penaltyDetails.isOverdue).toBe(false);
      expect(returnRes.body.penaltyDetails.penaltyFee).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 3.  INVALID INPUTS & SECURITY VALIDATION
  // ═══════════════════════════════════════════════════════════════
  describe('3. Invalid Inputs & Security Validations', () => {
    it('REJECT: Inverted dates — start after end', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 2, startDate: '2026-12-10', endDate: '2026-12-05' });

      expect(res.status).toBe(409);
      expect(res.body.reason).toContain('after end date');
    });

    it('REJECT: Duration over 14-day maximum limit', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 2, startDate: '2026-12-01', endDate: '2026-12-30' });

      expect(res.status).toBe(409);
      expect(res.body.reason).toContain('14 days');
    });

    it('REJECT: Non-existent asset ID returns 404', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 99999, startDate: '2026-12-01', endDate: '2026-12-05' });

      expect(res.status).toBe(404);
    });

    it('REJECT: Unauthenticated request returns 401', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .send({ assetId: 1, startDate: '2026-12-01', endDate: '2026-12-05' });

      expect(res.status).toBe(401);
    });

    it('REJECT: Standard user cannot create admin blackouts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/blackouts')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: 1, startDate: '2026-12-01', endDate: '2026-12-05', reason: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
    });

    it('REJECT: Missing required fields triggers Zod 400 validation error', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 1 }); // missing startDate & endDate

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it('REJECT: Invalid date format triggers validation error', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: 1, startDate: '01/12/2026', endDate: '05/12/2026' }); // wrong format

      expect(res.status).toBe(400);
    });
  });
});
