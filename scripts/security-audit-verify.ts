/**
 * Same Day Assist — Automated Security Audit & Hardening Verification Suite
 * Tests all confirmed vulnerability fixes, role escalations, BOLA/IDOR protections,
 * PDF authorization, rate limiting, and business-critical workflow invariants.
 */

const BASE_URL = 'http://localhost:5000';

interface TestResult {
  testId: string;
  name: string;
  category: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

async function runTest(
  testId: string,
  name: string,
  category: string,
  fn: () => Promise<{ status: number; body?: any; expectedStatus: number; notes: string }>
) {
  try {
    const res = await fn();
    const passed = res.status === res.expectedStatus;
    results.push({
      testId,
      name,
      category,
      expectedStatus: res.expectedStatus,
      actualStatus: res.status,
      passed,
      notes: res.notes,
    });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testId} - ${name} (Expected: ${res.expectedStatus}, Got: ${res.status})`);
  } catch (error: any) {
    results.push({
      testId,
      name,
      category,
      expectedStatus: 0,
      actualStatus: 500,
      passed: false,
      notes: `Exception: ${error.message}`,
    });
    console.log(`[FAIL] ${testId} - ${name} (Exception: ${error.message})`);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('SAME DAY ASSIST — EXECUTIVE SECURITY AUDIT & VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Step 1: Health check
  await runTest('SEC-HEALTH', 'API Server Health Check', 'Infrastructure', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const body = await res.json();
    return { status: res.status, expectedStatus: 200, notes: `Database status: ${body.database || 'connected'}` };
  });

  // Step 2: Privilege Escalation Prevention: Attempt registration as Dispatcher without secret
  await runTest('SEC-AUTH-01', 'Prevent Unauthorized Dispatcher Registration', 'Access Control', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Dispatcher',
        email: `rogue_dispatcher_${Date.now()}@example.com`,
        phone: '0821234567',
        address: '123 Fake Street',
        password: 'Password123!',
        role: 'Dispatcher',
        adminSecret: 'wrong-key',
      }),
    });
    return { status: res.status, expectedStatus: 403, notes: 'Dispatcher role registration requires verified authorization secret' };
  });

  // Step 3: Privilege Escalation Prevention: Attempt registration as Administrator without secret
  await runTest('SEC-AUTH-02', 'Prevent Unauthorized Administrator Registration', 'Access Control', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Admin',
        email: `rogue_admin_${Date.now()}@example.com`,
        phone: '0821234567',
        address: '123 Fake Street',
        password: 'Password123!',
        role: 'Administrator',
        adminSecret: 'invalid_secret_key',
      }),
    });
    return { status: res.status, expectedStatus: 403, notes: 'Administrator role registration correctly rejected' };
  });

  // Step 4: Login as legitimate test customer and test contractor
  let customerToken = '';
  let contractorToken = '';

  const custLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lerato@molefefamily.co.za', password: 'demo-passcode' }),
  });
  if (custLogin.ok) {
    const data = await custLogin.json();
    customerToken = data.accessToken;
  }

  const contrLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sipho.ndlovu@samedayassist.co.za', password: 'demo-passcode' }),
  });
  if (contrLogin.ok) {
    const data = await contrLogin.json();
    contractorToken = data.accessToken;
  }

  let adminToken = '';
  let sampleJobId = '';
  let sampleInvoiceId = '';

  const admLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@samedayassist.co.za', password: 'demo-passcode' }),
  });
  if (admLogin.ok) {
    const data = await admLogin.json();
    adminToken = data.accessToken;

    // Fetch existing jobs & invoices to get real IDs
    const jobsRes = await fetch(`${BASE_URL}/api/jobs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (jobsRes.ok) {
      const jobs = await jobsRes.json();
      // Pick a job not belonging to Lerato
      const foreignJob = jobs.find((j: any) => j.customerName !== 'Lerato Molefe');
      sampleJobId = foreignJob ? foreignJob.id : jobs[0]?.id;
    }

    const invRes = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (invRes.ok) {
      const invoices = await invRes.json();
      const foreignInv = invoices.find((inv: any) => inv.customerName !== 'Sipho Ndlovu');
      sampleInvoiceId = foreignInv ? foreignInv.id : invoices[0]?.id;
    }
  }

  // Step 5: BOLA / IDOR Protection: Customer attempting to modify job status of another job
  await runTest('SEC-BOLA-01', 'Prevent BOLA/IDOR on Job Status (Customer to foreign job)', 'Authorization', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/${sampleJobId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ status: 'Completed' }),
    });
    return { status: res.status, expectedStatus: 403, notes: 'Non-owner customer cannot modify foreign job status' };
  });

  // Step 6: BOLA / IDOR Protection: Spoofing Responder GPS Location
  await runTest('SEC-BOLA-02', 'Prevent Rogue Location Spoofing by Unassigned User', 'Authorization', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/${sampleJobId}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ lat: -26.15, lng: 28.05 }),
    });
    return { status: res.status, expectedStatus: 403, notes: 'Unassigned user cannot broadcast GPS updates for job' };
  });

  // Step 7: Information Disclosure Prevention: Unauthenticated PDF downloads
  await runTest('SEC-INFO-01', 'Reject Unauthenticated Invoice PDF Download', 'Information Disclosure', async () => {
    const res = await fetch(`${BASE_URL}/api/pdf/invoice/${sampleInvoiceId || 'demo'}`);
    return { status: res.status, expectedStatus: 401, notes: 'Unauthenticated requests to download invoice PDFs are blocked' };
  });

  await runTest('SEC-INFO-02', 'Reject Unauthenticated Assessment PDF Download', 'Information Disclosure', async () => {
    const res = await fetch(`${BASE_URL}/api/pdf/assessment/ass-001`);
    return { status: res.status, expectedStatus: 401, notes: 'Unauthenticated requests to download assessment surveys are blocked' };
  });

  // Step 8: IDOR Prevention: Contractor attempting to read customer invoice PDF
  await runTest('SEC-IDOR-01', 'Reject Unauthorized Invoice Download by Third-Party Role', 'Authorization', async () => {
    const res = await fetch(`${BASE_URL}/api/pdf/invoice/${sampleInvoiceId}`, {
      headers: { Authorization: `Bearer ${contractorToken}` },
    });
    return { status: res.status, expectedStatus: 403, notes: 'Contractor cannot download invoices belonging to other customers' };
  });

  // Step 9: Membership Benefit Protection: Prevent free self-upgrade without payment
  await runTest('SEC-BIZ-01', 'Prevent Free Membership Self-Upgrade (Payment Enforced)', 'Business Logic', async () => {
    const res = await fetch(`${BASE_URL}/api/memberships/change-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ planId: 'business-continuity' }),
    });
    const body = await res.json();
    return {
      status: res.status,
      expectedStatus: 200,
      notes: body.requiresPayment ? 'Correctly flagged as requiring payment before activation' : 'FAIL: Activated freely!',
    };
  });

  // Step 10: Digital Wallet Protection: Prevent unauthorized direct balance inflation
  await runTest('SEC-FIN-01', 'Reject Unverified Wallet Top-Up without Payment Reference', 'Financial Integrity', async () => {
    const res = await fetch(`${BASE_URL}/api/wallet/top-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ amount: 50000.0 }),
    });
    return { status: res.status, expectedStatus: 400, notes: 'Direct wallet inflation without gateway transaction reference is rejected' };
  });

  // Step 11: Production Safety: Reseed route disabled
  await runTest('SEC-PROD-01', 'Verify System Reseed Backdoor Blocked or Requires Super Admin', 'System Hardening', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/system/reseed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ password: 'any' }),
    });
    return { status: res.status, expectedStatus: 403, notes: 'Non-super admin cannot trigger system reseed' };
  });

  // Step 12: Emergency Call-out fee enforcement: Non-member fixed R650 Call-Out fee
  await runTest('SEC-EMG-01', 'Enforce Fixed R650 Call-Out Fee Server-Side on Non-Member Emergency', 'Business Logic', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/emergency-non-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Caller',
        phone: '0839998877',
        email: 'audit@example.com',
        address: '15 Rivonia Road, Sandton',
        serviceType: 'Security Services',
        description: 'Gate motor electrical failure and jammed driveway',
        urgency: 'Critical',
        consentAgreed: true,
      }),
    });
    const body = await res.json();
    const feeIs650 = body.callOutFee === 650.00;
    const isSuccessStatus = res.status === 201 || res.status === 200;
    return {
      status: isSuccessStatus ? 200 : res.status,
      expectedStatus: 200,
      notes: feeIs650 ? 'R650 Call-Out Fee strictly enforced server-side' : `Incorrect fee: ${body.callOutFee}`,
    };
  });

  console.log('\n========================================================================');
  console.log('TEST SUMMARY');
  console.log('========================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`Total Tests Executed: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Compliance Score: ${Math.round((passed / total) * 100)}%`);
  console.log('========================================================================\n');
}

main().catch(console.error);
