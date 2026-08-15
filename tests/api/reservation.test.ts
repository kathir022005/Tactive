import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/server/app.js';
import { connectDB } from '../../src/server/db/database.js';
import { Reservation, Blackout } from '../../src/server/db/models.js';

let app: any;
let adminToken: string;
let standardToken: string;
let vipToken: string;

let macbook: any;
let sony: any;
let fluke: any;
let dji: any;
let dell: any;

describe('EquipFlow — Complete QA Automation API Test Suite (MongoDB)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    
    // Clear test reservations & blackouts for clean test state
    await Reservation.deleteMany({});
    await Blackout.deleteMany({});

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

    // Fetch seeded assets and map by serial_number
    const assetsRes = await request(app).get('/api/assets');
    const assetList = assetsRes.body.assets;
    macbook = assetList.find((a: any) => a.serial_number === 'MBP-2024-9901');
    sony    = assetList.find((a: any) => a.serial_number === 'SNY-A7IV-0042');
    fluke   = assetList.find((a: any) => a.serial_number === 'FLK-OSC-7712');
    dji     = assetList.find((a: any) => a.serial_number === 'DJI-INS3-8821');
    dell    = assetList.find((a: any) => a.serial_number === 'DELL-U38-3310');
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
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
        .send({ assetId: macbook.id, startDate: '2026-09-01', endDate: '2026-09-05', notes: 'VIP auto-approval test' });

      expect(res.status).toBe(201);
      expect(res.body.reservation.status).toBe('CONFIRMED');
      expect(Boolean(res.body.reservation.is_vip_auto_approved)).toBe(true);
    });

    it('Standard User creates reservation → enters PENDING review queue', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: sony.id, startDate: '2026-09-10', endDate: '2026-09-12', notes: 'Standard pending test' });

      expect(res.status).toBe(201);
      expect(res.body.reservation.status).toBe('PENDING');
    });

    it('Admin can approve a pending reservation', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: dell.id, startDate: '2026-11-01', endDate: '2026-11-03' });

      expect(booking.status).toBe(201);
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
        .send({ assetId: dell.id, startDate: '2026-11-20', endDate: '2026-11-22' });

      expect(booking.status).toBe(201);
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
        .send({ assetId: dell.id, startDate: '2026-12-10', endDate: '2026-12-12' });

      expect(booking.status).toBe(201);
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
      // macbook is booked 2026-09-01 → 2026-09-05 from Happy Path
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: macbook.id, startDate: '2026-09-03', endDate: '2026-09-07' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('conflict');
      expect(res.body.reason).toBeDefined();
    });

    it('QUOTA: Standard user blocked after 3 active reservations (4th attempt must fail)', async () => {
      // Clear standard user's previous reservations for precise quota test
      const stdUserRes = await request(app).get('/api/reservations?mine=true').set('Authorization', `Bearer ${standardToken}`);
      for (const r of stdUserRes.body.reservations) {
        if (r.status === 'PENDING' || r.status === 'CONFIRMED') {
          await request(app).post(`/api/reservations/${r.id}/cancel`).set('Authorization', `Bearer ${standardToken}`);
        }
      }

      // Create 3 active reservations
      await request(app).post('/api/reservations').set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: sony.id, startDate: '2026-10-01', endDate: '2026-10-03' });
      await request(app).post('/api/reservations').set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: fluke.id, startDate: '2026-10-01', endDate: '2026-10-03' });
      await request(app).post('/api/reservations').set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: dell.id, startDate: '2026-10-08', endDate: '2026-10-10' });

      // 4th must be blocked
      const fourth = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: macbook.id, startDate: '2026-10-20', endDate: '2026-10-22' });

      expect(fourth.status).toBe(400);
      expect(fourth.body.error).toContain('quota exceeded');
    });

    it('BLACKOUT: Reservation blocked during admin-declared maintenance window', async () => {
      await request(app).post('/api/admin/blackouts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: dell.id, startDate: '2026-12-20', endDate: '2026-12-31', reason: 'Year-end firmware upgrade' });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: dell.id, startDate: '2026-12-22', endDate: '2026-12-25' });

      expect(res.status).toBe(409);
      expect(res.body.reason).toContain('maintenance blackout');
    });

    it('PENALTY (VIP): 3 days overdue on $30/day asset → $45 (50% VIP discount)', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: dell.id, startDate: '2026-07-20', endDate: '2026-07-28' });

      expect(booking.status).toBe(201);
      const resId = booking.body.reservation.id;

      const returnRes = await request(app)
        .post(`/api/reservations/${resId}/return`)
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ returnDate: '2026-07-31' }); // 3 days overdue

      expect(returnRes.status).toBe(200);
      expect(returnRes.body.penaltyDetails.isOverdue).toBe(true);
      expect(returnRes.body.penaltyDetails.overdueDays).toBe(3);
      // Dell asset daily penalty rate is $30 → $30 * 3 = $90 raw → 50% VIP discount = $45
      expect(returnRes.body.penaltyDetails.penaltyFee).toBe(45.0);
      expect(returnRes.body.penaltyDetails.appliedDiscountPercentage).toBe(50);
    });

    it('PENALTY (Standard): On-time return = $0 penalty, no discount applicable', async () => {
      const booking = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: macbook.id, startDate: '2026-08-05', endDate: '2026-08-10' });

      expect(booking.status).toBe(201);
      const returnRes = await request(app)
        .post(`/api/reservations/${booking.body.reservation.id}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ returnDate: '2026-08-10' });

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
        .send({ assetId: sony.id, startDate: '2026-12-10', endDate: '2026-12-05' });

      expect(res.status).toBe(409);
      expect(res.body.reason).toContain('after end date');
    });

    it('REJECT: Duration over 14-day maximum limit', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: sony.id, startDate: '2026-12-01', endDate: '2026-12-30' });

      expect(res.status).toBe(409);
      expect(res.body.reason).toContain('14 days');
    });

    it('REJECT: Non-existent asset ID returns 404', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: '60c72b2f9b1d8b2b9c8b4567', startDate: '2026-12-01', endDate: '2026-12-05' });

      expect(res.status).toBe(404);
    });

    it('REJECT: Unauthenticated request returns 401', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .send({ assetId: macbook.id, startDate: '2026-12-01', endDate: '2026-12-05' });

      expect(res.status).toBe(401);
    });

    it('REJECT: Standard user cannot create admin blackouts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/blackouts')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ assetId: macbook.id, startDate: '2026-12-01', endDate: '2026-12-05', reason: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
    });

    it('REJECT: Missing required fields triggers Zod 400 validation error', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: macbook.id });

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it('REJECT: Invalid date format triggers validation error', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${vipToken}`)
        .send({ assetId: macbook.id, startDate: '01/12/2026', endDate: '05/12/2026' });

      expect(res.status).toBe(400);
    });

    it('ADMIN: Can update asset product details (PUT /api/assets/:id)', async () => {
      const updateRes = await request(app)
        .put(`/api/assets/${macbook.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'MacBook Pro M3 Max 16" (Updated)', dailyPenaltyRate: 85.0 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.asset.name).toBe('MacBook Pro M3 Max 16" (Updated)');
      expect(updateRes.body.asset.daily_penalty_rate).toBe(85.0);
    });

    it('REJECT: Standard user cannot update asset product details (403 Forbidden)', async () => {
      const updateRes = await request(app)
        .put(`/api/assets/${macbook.id}`)
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ name: 'Unauthorized Change' });

      expect(updateRes.status).toBe(403);
    });
  });
});
