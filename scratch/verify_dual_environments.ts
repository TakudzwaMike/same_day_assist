import http from 'http';
import https from 'https';

async function makeRequest(baseUrl: string, path: string, method = 'GET', body: any = null, token?: string): Promise<{ status: number; data: any }> {
  const isHttps = baseUrl.startsWith('https');
  const client = isHttps ? https : http;
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const postData = body ? JSON.stringify(body) : null;
    if (postData) headers['Content-Length'] = String(Buffer.byteLength(postData));

    const req = client.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode || 0, data: parsed });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testEnvironment(baseUrl: string) {
  const envResults: Record<string, boolean> = {};

  // 1. Health
  try {
    const res = await makeRequest(baseUrl, '/api/health');
    envResults['Health & Database'] = res.status === 200 && res.data.database === 'connected';
  } catch {
    envResults['Health & Database'] = false;
  }

  // 2. All 6 Plans
  try {
    const res = await makeRequest(baseUrl, '/api/memberships/plans');
    envResults['Membership Plans (6 Plans)'] = res.status === 200 && Array.isArray(res.data) && res.data.length === 6 && res.data.some((p: any) => p.id === 'assist_plus');
  } catch {
    envResults['Membership Plans (6 Plans)'] = false;
  }

  // 3. Payment 20/40/40 Schedule
  try {
    const res = await makeRequest(baseUrl, '/api/payments/schedule/assist_plus');
    envResults['Payment Structure (20/40/40)'] = res.status === 200 && res.data.breakdown?.initialAmount === 299.8 && res.data.stages?.length === 4;
  } catch {
    envResults['Payment Structure (20/40/40)'] = false;
  }

  // 4. Customer Login
  let customerToken = '';
  try {
    const res = await makeRequest(baseUrl, '/api/auth/login', 'POST', {
      email: 'lerato@molefefamily.co.za',
      password: 'demo-passcode'
    });
    envResults['Customer Authentication'] = res.status === 200 && !!res.data.accessToken;
    customerToken = res.data.accessToken;
  } catch {
    envResults['Customer Authentication'] = false;
  }

  // 5. Admin Login
  let adminToken = '';
  try {
    const res = await makeRequest(baseUrl, '/api/auth/login', 'POST', {
      email: 'admin@samedayassist.co.za',
      password: 'demo-passcode'
    });
    envResults['Admin Authentication'] = res.status === 200 && !!res.data.accessToken && (res.data.user.role === 'Administrator' || res.data.user.role === 'Super Administrator');
    adminToken = res.data.accessToken;
  } catch {
    envResults['Admin Authentication'] = false;
  }

  // 6. Customer Dashboard & Profile (Authenticated)
  try {
    const res = await makeRequest(baseUrl, '/api/auth/me', 'GET', null, customerToken);
    envResults['Customer Dashboard & Profile'] = res.status === 200 && res.data.email === 'lerato@molefefamily.co.za';
  } catch {
    envResults['Customer Dashboard & Profile'] = false;
  }

  // 7. Benefits Summary
  try {
    const res = await makeRequest(baseUrl, '/api/memberships/my', 'GET', null, customerToken);
    envResults['Benefit Balance & Tracking'] = res.status === 200 && typeof res.data.remainingBenefit === 'number';
  } catch {
    envResults['Benefit Balance & Tracking'] = false;
  }

  // 8. Invoices Endpoint (Customer & Admin)
  try {
    const resCust = await makeRequest(baseUrl, '/api/invoices/my', 'GET', null, customerToken);
    const resAdmin = await makeRequest(baseUrl, '/api/invoices', 'GET', null, adminToken);
    envResults['Invoice Management'] = resCust.status === 200 && Array.isArray(resCust.data) && resAdmin.status === 200 && Array.isArray(resAdmin.data);
  } catch {
    envResults['Invoice Management'] = false;
  }

  // 9. Claims Endpoint (Customer & Admin)
  try {
    const resCust = await makeRequest(baseUrl, '/api/claims/my', 'GET', null, customerToken);
    const resAdmin = await makeRequest(baseUrl, '/api/claims', 'GET', null, adminToken);
    envResults['Claims Processing'] = resCust.status === 200 && Array.isArray(resCust.data) && resAdmin.status === 200 && Array.isArray(resAdmin.data);
  } catch {
    envResults['Claims Processing'] = false;
  }

  // 10. Emergency Non-Member Intake & Tracking
  try {
    const emergencyPayload = {
      name: 'NonMember Live Verifier',
      phone: '+27 82 999 1234',
      address: '77 Rivonia Road, Sandton',
      serviceType: 'Security Services',
      description: 'Urgent gate motor fault test'
    };
    const res = await makeRequest(baseUrl, '/api/jobs/emergency-non-member', 'POST', emergencyPayload);
    const createdJob = res.data.job;
    const trackingRes = createdJob?.id ? await makeRequest(baseUrl, `/api/jobs/emergency-non-member/${createdJob.id}`, 'GET') : null;
    envResults['Emergency Assistance (Non-Member)'] = res.status === 201 && !!createdJob && trackingRes?.status === 200;
  } catch {
    envResults['Emergency Assistance (Non-Member)'] = false;
  }

  // 11. Admin Command Hub & Dispatch
  try {
    const res = await makeRequest(baseUrl, '/api/jobs', 'GET', null, adminToken);
    envResults['Admin Command Hub & Dispatch'] = res.status === 200 && Array.isArray(res.data);
  } catch {
    envResults['Admin Command Hub & Dispatch'] = false;
  }

  // 12. PDF Route verification
  try {
    const res = await makeRequest(baseUrl, '/api/pdf/invoice/non-existent-id');
    envResults['PDF Generation Services'] = res.status === 404 && res.data?.error === 'Invoice record not found';
  } catch {
    envResults['PDF Generation Services'] = false;
  }

  return envResults;
}

async function run() {
  console.log('Testing LOCALHOST (http://localhost:5000)...');
  const localResults = await testEnvironment('http://localhost:5000');

  console.log('Testing VESSEL (https://same-day-assist.vercel.app)...');
  const vesselResults = await testEnvironment('https://same-day-assist.vercel.app');

  console.log('\n========================================================================================');
  console.log('SAME DAY ASSIST — COMPREHENSIVE LOCALHOST VS VESSEL FUNCTIONAL COMPARISON');
  console.log('========================================================================================\n');

  console.log('Feature'.padEnd(36) + ' | ' + 'Localhost'.padEnd(10) + ' | ' + 'Vessel'.padEnd(10) + ' | ' + 'Result');
  console.log('----------------------------------------------------------------------------------------');

  const allFeatures = Object.keys(localResults);
  let allPass = true;

  for (const feature of allFeatures) {
    const loc = localResults[feature] ? 'PASS' : 'FAIL';
    const ves = vesselResults[feature] ? 'PASS' : 'FAIL';
    const match = (loc === 'PASS' && ves === 'PASS') ? 'PASS' : 'FAIL';
    if (match === 'FAIL') allPass = false;

    console.log(feature.padEnd(36) + ' | ' + loc.padEnd(10) + ' | ' + ves.padEnd(10) + ' | ' + match);
  }

  console.log('----------------------------------------------------------------------------------------');
  console.log('FINAL SYNCHRONIZATION STATUS: ' + (allPass ? 'FULLY SYNCHRONIZED — VERIFIED' : 'ISSUES REMAIN'));
  console.log('========================================================================================\n');
}

run();
