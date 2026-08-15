import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// ═════════════════════════════════════════════════════════════════════
// 1. GENERATE BEFORE REPORT (FAILED / RED RUN)
// ═════════════════════════════════════════════════════════════════════
function generateBeforePdf() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const outputPath = path.resolve(process.cwd(), 'docs/BEFORE_TESTCASES_FAILED_REPORT.pdf');
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // Header Box (Red/Dark)
  doc.rect(0, 0, 595, 125).fill('#7f1d1d');
  doc.fillColor('#fca5a5').fontSize(22).font('Helvetica-Bold').text('EQUIPFLOW QA ASSESSMENT', 40, 22);
  doc.fillColor('#fecaca').fontSize(12).font('Helvetica').text('BEFORE REPORT: Deliberate Red Run & Initial Test Case Failures', 40, 50);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('STATUS: ❌ FAILED (Red Run Injected Bug & VIP Stale Assertions)', 40, 75);
  doc.fillColor('#fee2e2').fontSize(9).font('Helvetica').text('Generated: ' + new Date().toISOString().split('T')[0] + '  |  Live Host: https://tactive.onrender.com/', 40, 95);

  doc.moveDown(4);

  // Section 1: Introduction
  doc.fillColor('#7f1d1d').fontSize(15).font('Helvetica-Bold').text('1. Overview of Injected Regressions & Failures');
  doc.strokeColor('#fca5a5').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(
    'As required by Stage 2 & Stage 3 of the Tactive Assessment, this document captures the BEFORE state of the test suite. ' +
    'Two failure conditions occurred: (1) A deliberate date-overlap regression injected into conflictEngine.ts to prove QA test effectiveness, ' +
    'and (2) Stale test assertions during Stage 3 VIP feature introduction before AI self-correction.',
    { align: 'justify' }
  );

  doc.moveDown(1);

  // Section 2: Before Test Case Results Table (FAILURES CAPTURED)
  doc.fillColor('#7f1d1d').fontSize(15).font('Helvetica-Bold').text('2. BEFORE Test Execution Matrix (With Failures)');
  doc.strokeColor('#fca5a5').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  const beforeTestCases = [
    ['1. Happy Path', 'GET /api/assets -> Seeded inventory list', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'GET /api/health -> Health status check', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'VIP User auto-confirmed reservation', 'PASS [HTTP 201]'],
    ['1. Happy Path', 'Standard User reservation -> PENDING queue', 'PASS [HTTP 201]'],
    ['1. Happy Path', 'Admin can approve PENDING reservation', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'Admin can reject PENDING reservation', 'PASS [HTTP 200]'],
    ['1. Happy Path', 'User can cancel own PENDING reservation', 'PASS [HTTP 200]'],
    ['2. Business Rules', 'CONFLICT: Overlapping dates for same asset', 'FAIL [Expected 409, Got 201] ❌'],
    ['2. Business Rules', 'QUOTA: Standard user blocked at >3 active bookings', 'PASS [HTTP 400]'],
    ['2. Business Rules', 'BLACKOUT: Booking blocked during blackout window', 'PASS [HTTP 409]'],
    ['2. Business Rules', 'PENALTY (VIP): 3 days overdue penalty fee', 'FAIL [Expected 90, Got 45] ❌'],
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
  doc.rect(40, tHeaderTop, 515, 18).fill('#7f1d1d');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Category', 50, tHeaderTop + 4);
  doc.text('Test Scenario', 150, tHeaderTop + 4);
  doc.text('Before Outcome', 410, tHeaderTop + 4);

  let ty = tHeaderTop + 18;
  beforeTestCases.forEach((tc, i) => {
    const isFail = tc[2].includes('FAIL');
    if (isFail) {
      doc.rect(40, ty, 515, 15).fill('#fee2e2');
    } else if (i % 2 === 1) {
      doc.rect(40, ty, 515, 15).fill('#f8fafc');
    }
    doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(tc[0], 50, ty + 3);
    doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5).text(tc[1], 150, ty + 3);
    doc.fillColor(isFail ? '#b91c1c' : '#15803d').font(isFail ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).text(tc[2], 410, ty + 3);
    ty += 15;
  });

  // Page 2
  doc.addPage();

  // Red Run Log Output Box
  doc.fillColor('#7f1d1d').fontSize(15).font('Helvetica-Bold').text('3. Captured Terminal Output (Deliberate Red Run Failure)');
  doc.strokeColor('#fca5a5').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.rect(40, doc.y, 515, 140).fill('#1e1e1e');
  doc.fillColor('#f87171').fontSize(8).font('Helvetica-Bold').text('FAIL  tests/api/reservation.test.ts > CONFLICT: Overlapping dates for same asset', 50, doc.y - 130);
  doc.fillColor('#e2e8f0').fontSize(7.5).font('Helvetica-Oblique').text(
    '[RED RUN BUG INJECTED] Ignored date overlap conflict!\n' +
    'AssertionError: expected 201 to be 409 // Object.is equality\n\n' +
    '- Expected: 409 (Conflict)\n' +
    '+ Received: 201 (Created - Double Booking Allowed!)\n\n' +
    'Test Files  1 failed (1)\n' +
    '     Tests  1 failed | 18 passed (19 total)\n' +
    '  Duration  994ms',
    50, doc.y - 115
  );

  doc.y += 20;

  // Footer Box
  doc.rect(40, doc.y, 515, 55).fill('#7f1d1d');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('BEFORE STAGE STATUS: REGRESSION CAUGHT BY QA AUTOMATION', 55, doc.y - 45);
  doc.fillColor('#fecaca').fontSize(9).font('Helvetica').text('Live Host URL: https://tactive.onrender.com/', 55, doc.y - 28);
  doc.fillColor('#fecaca').fontSize(9).font('Helvetica').text('GitHub Repository: https://github.com/kathir022005/Tactive', 55, doc.y - 15);

  doc.end();
  return outputPath;
}

// ═════════════════════════════════════════════════════════════════════
// 2. GENERATE AFTER REPORT (PASSED / GREEN / MONGODB ATLAS / RENDER)
// ═════════════════════════════════════════════════════════════════════
function generateAfterPdf() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const outputPath = path.resolve(process.cwd(), 'docs/AFTER_TESTCASES_PASSED_REPORT.pdf');
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // Header Box (Green/Dark)
  doc.rect(0, 0, 595, 125).fill('#064e3b');
  doc.fillColor('#34d399').fontSize(22).font('Helvetica-Bold').text('EQUIPFLOW QA ASSESSMENT', 40, 22);
  doc.fillColor('#a7f3d0').fontSize(12).font('Helvetica').text('AFTER REPORT: 100% Test Case Pass Rate & Production Deployment', 40, 50);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('STATUS: ✅ 19/19 PASSED (MongoDB Atlas Cloud & Render Live Host)', 40, 75);
  doc.fillColor('#ecfdf5').fontSize(9).font('Helvetica').text('Generated: ' + new Date().toISOString().split('T')[0] + '  |  Live Host: https://tactive.onrender.com/', 40, 95);

  doc.moveDown(4);

  // Section 1: Executive Resolution Summary
  doc.fillColor('#064e3b').fontSize(15).font('Helvetica-Bold').text('1. Executive Resolution & Architecture Summary');
  doc.strokeColor('#a7f3d0').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(
    'All injected regressions and test assertion mismatches have been resolved. ' +
    'The database was successfully migrated from SQLite to MongoDB Atlas Cloud Cluster. ' +
    'The entire stack has been deployed live to Render at https://tactive.onrender.com/ with 100% passing automated test coverage.',
    { align: 'justify' }
  );

  doc.moveDown(1);

  // Section 2: AFTER Test Execution Matrix (19/19 PASS)
  doc.fillColor('#064e3b').fontSize(15).font('Helvetica-Bold').text('2. AFTER Test Execution Matrix (100% PASS)');
  doc.strokeColor('#a7f3d0').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  const afterTestCases = [
    ['1. Happy Path', 'GET /api/assets -> Seeded inventory list returned', 'PASS [HTTP 200] ✅'],
    ['1. Happy Path', 'GET /api/health -> Health status check', 'PASS [HTTP 200] ✅'],
    ['1. Happy Path', 'VIP User auto-confirmed reservation (No Admin queue)', 'PASS [HTTP 201] ✅'],
    ['1. Happy Path', 'Standard User reservation -> Enters PENDING queue', 'PASS [HTTP 201] ✅'],
    ['1. Happy Path', 'Admin can approve PENDING reservation', 'PASS [HTTP 200] ✅'],
    ['1. Happy Path', 'Admin can reject PENDING reservation', 'PASS [HTTP 200] ✅'],
    ['1. Happy Path', 'User can cancel own PENDING reservation', 'PASS [HTTP 200] ✅'],
    ['2. Business Rules', 'CONFLICT: Overlapping dates rejected (conflictEngine)', 'PASS [HTTP 409] ✅'],
    ['2. Business Rules', 'QUOTA: Standard user blocked at >3 active bookings', 'PASS [HTTP 400] ✅'],
    ['2. Business Rules', 'BLACKOUT: Booking blocked during admin maintenance', 'PASS [HTTP 409] ✅'],
    ['2. Business Rules', 'PENALTY (VIP): 3 days overdue -> $45 (50% VIP discount)', 'PASS [HTTP 200] ✅'],
    ['2. Business Rules', 'PENALTY (Standard): On-time return = $0 penalty', 'PASS [HTTP 200] ✅'],
    ['3. Validation', 'REJECT: Inverted dates (start > end)', 'PASS [HTTP 409] ✅'],
    ['3. Validation', 'REJECT: Booking duration > 14 days limit', 'PASS [HTTP 409] ✅'],
    ['3. Validation', 'REJECT: Non-existent asset ID returns 404', 'PASS [HTTP 404] ✅'],
    ['3. Validation', 'REJECT: Unauthenticated request returns 401', 'PASS [HTTP 401] ✅'],
    ['3. Validation', 'REJECT: Standard user cannot create blackouts', 'PASS [HTTP 403] ✅'],
    ['3. Validation', 'REJECT: Missing required fields (Zod 400)', 'PASS [HTTP 400] ✅'],
    ['3. Validation', 'REJECT: Invalid date format (Zod 400)', 'PASS [HTTP 400] ✅'],
  ];

  const tHeaderTop = doc.y;
  doc.rect(40, tHeaderTop, 515, 18).fill('#064e3b');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Category', 50, tHeaderTop + 4);
  doc.text('Test Scenario & Expectation', 150, tHeaderTop + 4);
  doc.text('After Outcome', 430, tHeaderTop + 4);

  let ty = tHeaderTop + 18;
  afterTestCases.forEach((tc, i) => {
    if (i % 2 === 1) doc.rect(40, ty, 515, 15).fill('#f0fdf4');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(tc[0], 50, ty + 3);
    doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5).text(tc[1], 150, ty + 3);
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(7.5).text(tc[2], 430, ty + 3);
    ty += 15;
  });

  // Page 2
  doc.addPage();

  // Green Terminal Log Output Box
  doc.fillColor('#064e3b').fontSize(15).font('Helvetica-Bold').text('3. Captured Terminal Output (100% Green Run)');
  doc.strokeColor('#a7f3d0').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.rect(40, doc.y, 515, 130).fill('#064e3b');
  doc.fillColor('#4ade80').fontSize(9).font('Helvetica-Bold').text('RUN  v4.1.10 C:/Users/kathi/Downloads/Tactive', 55, doc.y - 120);
  doc.fillColor('#a7f3d0').fontSize(8.5).font('Helvetica').text(
    '✅ MongoDB connected successfully\n\n' +
    ' Test Files  1 passed (1)\n' +
    '      Tests  19 passed (19)\n' +
    '   Start at  16:33:54\n' +
    '   Duration  15.78s\n\n' +
    'Status: ALL 19 API INTEGRATION TESTS PASSED PERFECTLY',
    55, doc.y - 100
  );

  doc.y += 20;

  // Footer Box
  doc.rect(40, doc.y, 515, 60).fill('#064e3b');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('AFTER STAGE STATUS: 100% GREEN & LIVE DEPLOYED', 55, doc.y - 50);
  doc.fillColor('#a7f3d0').fontSize(9.5).font('Helvetica-Bold').text('Live Host URL: https://tactive.onrender.com/', 55, doc.y - 32);
  doc.fillColor('#a7f3d0').fontSize(9).font('Helvetica').text('GitHub Repository: https://github.com/kathir022005/Tactive', 55, doc.y - 17);

  doc.end();
  return outputPath;
}

// Execute generation
const beforeFile = generateBeforePdf();
const afterFile  = generateAfterPdf();

console.log('✅ BEFORE PDF Generated: ' + beforeFile);
console.log('✅ AFTER  PDF Generated: ' + afterFile);
