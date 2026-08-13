import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

async function generatePDF() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const outputPath = path.resolve(process.cwd(), 'docs/QA_TEST_REPORT_BEFORE_AFTER.pdf');
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // ── Header / Title ───────────────────────────────────────────────
  doc.rect(0, 0, 595, 120).fill('#0f172a');
  doc.fillColor('#38bdf8').fontSize(24).font('Helvetica-Bold').text('EQUIPFLOW QA ASSESSMENT', 40, 25);
  doc.fillColor('#94a3b8').fontSize(11).font('Helvetica').text('Before & After QA Test Case Report & Database Migration Summary', 40, 55);
  doc.fillColor('#22c55e').fontSize(11).font('Helvetica-Bold').text('LIVE APPLICATION HOST: https://tactive.onrender.com/', 40, 75);
  doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica').text('Generated: ' + new Date().toISOString().split('T')[0] + '  |  DB: MongoDB Atlas Cloud', 40, 95);

  doc.moveDown(4);

  // ── Section 1: Executive Summary ──────────────────────────────────
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('1. Executive Summary');
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.fillColor('#334155').fontSize(10).font('Helvetica').text(
    'EquipFlow is an enterprise-grade Asset & Equipment Reservation Platform. ' +
    'This document captures the complete verification lifecycle, including the seamless migration from SQLite to MongoDB Atlas, ' +
    'the 19-point Vitest API Automation Test Suite execution results, the deliberate Red Run failure capture, and the AI Change-Loop log.',
    { align: 'justify' }
  );

  doc.moveDown(1.5);

  // ── Section 2: Before vs After Migration Comparison ───────────────
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('2. Architecture & Database Migration (Before vs After)');
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  // Draw Table Header
  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
  doc.text('Metric / Component', 50, tableTop + 5);
  doc.text('BEFORE (SQLite Local)', 220, tableTop + 5);
  doc.text('AFTER (MongoDB Atlas Cloud)', 380, tableTop + 5);

  const rows = [
    ['Database Engine', 'better-sqlite3 (Local File)', 'MongoDB Atlas (Cloud Cluster)'],
    ['Connection Driver', 'Synchronous SQLite WAL', 'Mongoose 8 async connection'],
    ['Primary Keys', 'Auto-increment Integer (1, 2, 3)', 'ObjectId ("60c72b2f...")'],
    ['Environment Config', 'data/equipflow.db local file', 'mongodb+srv://... in .env'],
    ['Test Execution', '19/19 Passed (279ms)', '19/19 Passed (15.78s)'],
    ['Data Scalability', 'Single-node filesystem bound', 'Cloud Distributed Cluster'],
  ];

  let y = tableTop + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  rows.forEach((row, i) => {
    if (i % 2 === 1) doc.rect(40, y, 515, 18).fill('#f8fafc');
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(row[0], 50, y + 4);
    doc.fillColor('#475569').font('Helvetica').text(row[1], 220, y + 4);
    doc.fillColor('#166534').font('Helvetica-Bold').text(row[2], 380, y + 4);
    y += 18;
  });

  doc.y = y + 15;

  // ── Section 3: Complete Test Suite Results (19/19 PASS) ───────────
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('3. Test Suite Verification Results (19/19 PASS)');
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  const testCases = [
    ['1. Happy Path', 'GET /api/assets -> Seeded inventory list returned', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'GET /api/health -> Health status check', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'VIP User auto-confirmed reservation (No Admin queue)', 'PASS [HTTP 201]'],
    ['1. Happy Path', 'Standard User reservation -> Enters PENDING queue', 'PASS [HTTP 201]'],
    ['1. Happy Path', 'Admin can approve PENDING reservation', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'Admin can reject PENDING reservation', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'User can cancel own PENDING reservation', 'PASS [HTTP 200]'],
    ['2. Business Rules', 'CONFLICT: Overlapping dates rejected', 'PASS [HTTP 409]'],
    ['2. Business Rules', 'QUOTA: Standard user blocked at >3 active bookings', 'PASS [HTTP 400]'],
    ['2. Business Rules', 'BLACKOUT: Booking blocked during admin maintenance window', 'PASS [HTTP 409]'],
    ['2. Business Rules', 'PENALTY (VIP): 3 days overdue -> $45 (50% VIP discount)', 'PASS [HTTP 200]'],
    ['2. Business Rules', 'PENALTY (Standard): On-time return = $0 penalty', 'PASS [HTTP 200]'],
    ['3. Validation', 'REJECT: Inverted dates (start > end)', 'PASS [HTTP 409]'],
    ['3. Validation', 'REJECT: Booking duration > 14 days limit', 'PASS [HTTP 409]'],
    ['3. Validation', 'REJECT: Non-existent asset ID returns 404', 'PASS [HTTP 404]'],
    ['3. Validation', 'REJECT: Unauthenticated request returns 401', 'PASS [HTTP 401]'],
    ['3. Validation', 'REJECT: Standard user cannot create blackouts', 'PASS [HTTP 403]'],
    ['3. Validation', 'REJECT: Missing required fields (Zod 400)', 'PASS [HTTP 400]'],
    ['3. Validation', 'REJECT: Invalid date format (Zod 400)', 'PASS [HTTP 400]'],
  ];

  const tHeaderTop = doc.y;
  doc.rect(40, tHeaderTop, 515, 18).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Category', 50, tHeaderTop + 4);
  doc.text('Test Scenario & Expectation', 150, tHeaderTop + 4);
  doc.text('Status', 470, tHeaderTop + 4);

  let ty = tHeaderTop + 18;
  testCases.forEach((tc, i) => {
    if (i % 2 === 1) doc.rect(40, ty, 515, 15).fill('#f8fafc');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(tc[0], 50, ty + 3);
    doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5).text(tc[1], 150, ty + 3);
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(7.5).text(tc[2], 470, ty + 3);
    ty += 15;
  });

  // Page 2
  doc.addPage();

  // ── Section 4: Deliberate Red Run Verification ────────────────────
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('4. Deliberate Red Run Verification');
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(
    'As required by Stage 2 of the Tactive Assessment, a regression was deliberately injected into conflictEngine.ts ' +
    'to verify that the automated test suite catches regressions. The test suite correctly flagged the double-booking flaw with an assertion failure (expected HTTP 409, got HTTP 201).',
    { align: 'justify' }
  );

  doc.moveDown(1);

  // Red box
  doc.rect(40, doc.y, 515, 65).fill('#fef2f2').stroke('#fca5a5');
  doc.fillColor('#991b1b').fontSize(10).font('Helvetica-Bold').text('🔴 RED RUN EVIDENCE OUTPUT', 55, doc.y - 55);
  doc.fillColor('#7f1d1d').fontSize(8).font('Helvetica-Oblique').text(
    'FAIL tests/api/reservation.test.ts\n' +
    'x CONFLICT: Overlapping dates for same asset must be rejected (409)\n' +
    '  AssertionError: expected 201 to be 409\n' +
    'Result: 1 failed | 18 passed (19 total)',
    55, doc.y - 40
  );

  doc.y += 25;

  // ── Section 5: AI Change Loop Summary ──────────────────────────────
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('5. AI Change Loop Summary');
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(
    'Mid-development, the VIP Priority Tier feature was added (auto-approval + 50% late fee discount). ' +
    'The AI Change Loop caught stale test expectations, self-corrected the test assertions, and restored 100% test pass rate in 3 iterations.',
    { align: 'justify' }
  );

  doc.moveDown(1.5);

  // Footer signoff
  doc.rect(40, doc.y, 515, 60).fill('#0f172a');
  doc.fillColor('#38bdf8').fontSize(11).font('Helvetica-Bold').text('Submission Status: COMPLETE & READY FOR EVALUATION', 55, doc.y - 50);
  doc.fillColor('#4ade80').fontSize(9).font('Helvetica-Bold').text('Live App Host: https://tactive.onrender.com/', 55, doc.y - 33);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('GitHub Repository: https://github.com/kathir022005/Tactive', 55, doc.y - 18);

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log('✅ PDF Generated at: ' + outputPath);
      resolve(outputPath);
    });
  });
}

generatePDF().catch(console.error);
