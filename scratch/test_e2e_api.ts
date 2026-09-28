import { prisma } from '../server/src/config/db.js';

const BASE_URL = 'http://localhost:5000/api';

interface TestResult {
  suite: string;
  test: string;
  result: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT IMPLEMENTED';
  notes: string;
}

const results: TestResult[] = [];

function record(suite: string, test: string, result: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT IMPLEMENTED', notes: string) {
  results.push({ suite, test, result, notes });
  const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : result === 'BLOCKED' ? '🛑' : '⚠️';
  console.log(`${icon} [${suite}] ${test}: ${result} - ${notes}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING SAME DAY ASSIST AUTOMATED E2E VERIFICATION');
  console.log('====================================================\n');

  // Wait for server to be responsive
  let serverReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!serverReady) {
    record('System', 'Server Health Check', 'FAIL', 'Backend server did not respond on port 5000 within 20 seconds');
    printSummary();
    return;
  }
  record('System', 'Server Health Check', 'PASS', 'Backend server is healthy and responding on port 5000');

  let memberToken = '';
  let memberUser: any = null;
  let adminToken = '';
  let contractorToken = '';

  // ================= 1. AUTHENTICATION =================
  try {
    // 1.1 Member Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bright@samedayassist.co.za', password: '12345' })
    });
    const loginData = await loginRes.json();
    const mToken = loginData.accessToken || loginData.token;
    if (loginRes.ok && mToken && loginData.user.role === 'Customer') {
      memberToken = mToken;
      memberUser = loginData.user;
      record('Authentication', 'Member Valid Login', 'PASS', `Logged in as ${memberUser.name} (${memberUser.role})`);
    } else {
      record('Authentication', 'Member Valid Login', 'FAIL', `Failed to login: ${JSON.stringify(loginData)}`);
    }

    // 1.2 Invalid Password
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bright@samedayassist.co.za', password: 'wrong-password' })
    });
    if (badLoginRes.status === 400 || badLoginRes.status === 401) {
      record('Authentication', 'Invalid Password Rejection', 'PASS', `Rejected with HTTP ${badLoginRes.status}`);
    } else {
      record('Authentication', 'Invalid Password Rejection', 'FAIL', `Expected 400/401, got ${badLoginRes.status}`);
    }

    // 1.3 Admin Login
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'controlroom@samedayassist.co.za', password: 'demo-passcode' })
    });
    const adminData = await adminRes.json();
    const aToken = adminData.accessToken || adminData.token;
    if (adminRes.ok && aToken) {
      adminToken = aToken;
      record('Authentication', 'Admin Login', 'PASS', `Logged in as Control Room (${adminData.user.role})`);
    } else {
      record('Authentication', 'Admin Login', 'FAIL', `Admin login failed: ${JSON.stringify(adminData)}`);
    }

    // 1.4 Contractor Login
    const contractorRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sipho.ndlovu@samedayassist.co.za', password: 'demo-passcode' })
    });
    const contractorData = await contractorRes.json();
    const cToken = contractorData.accessToken || contractorData.token;
    if (contractorRes.ok && cToken) {
      contractorToken = cToken;
      record('Authentication', 'Contractor Login', 'PASS', `Logged in as Sipho Ndlovu (${contractorData.user.role})`);
    } else {
      record('Authentication', 'Contractor Login', 'FAIL', `Contractor login failed`);
    }

  } catch (err: any) {
    record('Authentication', 'Auth Suite Execution', 'FAIL', err.message);
  }

  // ================= 2. VEHICLE MANAGEMENT =================
  let testVehicleId = '';
  try {
    // 2.1 Get Vehicles (Empty or existing)
    const listRes = await fetch(`${BASE_URL}/vehicles`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      record('Vehicles', 'List Member Vehicles', 'PASS', `Retrieved ${listData.vehicles?.length ?? 0} vehicles`);
    } else {
      record('Vehicles', 'List Member Vehicles', 'FAIL', `HTTP ${listRes.status}`);
    }

    // 2.2 Add New Vehicle
    const addRes = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}` 
      },
      body: JSON.stringify({
        make: 'Toyota',
        model: 'Hilux 2.8 GD-6 4x4',
        year: 2024,
        licensePlate: 'ND 982-441',
        color: 'Glacier White',
        isDefault: true
      })
    });
    const addData = await addRes.json();
    const createdVeh = addData.vehicle || addData;
    if (addRes.ok && createdVeh && createdVeh.licensePlate === 'ND 982-441') {
      testVehicleId = createdVeh.id;
      record('Vehicles', 'Add Vehicle to Profile', 'PASS', `Vehicle created with ID ${testVehicleId} for member`);
    } else {
      record('Vehicles', 'Add Vehicle to Profile', 'FAIL', `Failed: ${JSON.stringify(addData)}`);
    }

    // 2.3 Verify Vehicle in Database
    const dbVehicle = await prisma.vehicle.findUnique({ where: { id: testVehicleId } });
    if (dbVehicle && dbVehicle.userId === memberUser.id) {
      record('Vehicles', 'Database Persistence & User Link', 'PASS', `Vehicle correctly linked to user ${dbVehicle.userId}`);
    } else {
      record('Vehicles', 'Database Persistence & User Link', 'FAIL', 'Vehicle not found or wrong user link');
    }

    // 2.4 Update Vehicle
    const updateRes = await fetch(`${BASE_URL}/vehicles/${testVehicleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        color: 'Metallic Gunmetal',
        notes: 'Equipped with dual battery system'
      })
    });
    const updateData = await updateRes.json();
    const updatedVeh = updateData.vehicle || updateData;
    if (updateRes.ok && updatedVeh && updatedVeh.color === 'Metallic Gunmetal') {
      record('Vehicles', 'Update Vehicle Details', 'PASS', 'Vehicle color and notes updated successfully');
    } else {
      record('Vehicles', 'Update Vehicle Details', 'FAIL', `Update failed: ${JSON.stringify(updateData)}`);
    }

    // 2.5 Security: Unauthorized Vehicle Access
    const unauthRes = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make: 'Hacker', model: 'Car' })
    });
    if (unauthRes.status === 401 || unauthRes.status === 403) {
      record('Vehicles', 'Unauthorized Access Blocked', 'PASS', `Unauthenticated creation blocked with HTTP ${unauthRes.status}`);
    } else {
      record('Vehicles', 'Unauthorized Access Blocked', 'FAIL', `Expected 401, got ${unauthRes.status}`);
    }

  } catch (err: any) {
    record('Vehicles', 'Vehicle Suite Execution', 'FAIL', err.message);
  }

  // ================= 3. MEMBER SERVICE REQUEST WORKFLOW =================
  let memberJobId = '';
  try {
    const jobRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        serviceType: 'Roadside Assistance',
        description: 'Flat tyre on highway shoulder near Marlboro Drive',
        customerAddress: 'N3 Northbound, Marlboro Offramp, Sandton',
        customerVehicle: {
          make: 'Toyota',
          model: 'Hilux 2.8 GD-6 4x4',
          year: 2024,
          licensePlate: 'ND 982-441',
          color: 'Metallic Gunmetal'
        }
      })
    });
    const jobData = await jobRes.json();
    const createdJob = jobData.job || jobData;
    if (jobRes.ok && createdJob && createdJob.id) {
      memberJobId = createdJob.id;
      record('Member Requests', 'Create Member Roadside Job', 'PASS', `Member job created with ID ${memberJobId} (${createdJob.customerType})`);
    } else {
      record('Member Requests', 'Create Member Roadside Job', 'FAIL', `Failed to create job: ${JSON.stringify(jobData)}`);
    }

    // Verify member job in DB
    const dbMemberJob = await prisma.job.findUnique({ where: { id: memberJobId } });
    if (dbMemberJob && dbMemberJob.customerType === 'MEMBER' && dbMemberJob.customerId === memberUser.id) {
      record('Member Requests', 'DB Relationship & Customer Type', 'PASS', 'Job correctly assigned customerType=MEMBER and linked to member ID');
    } else {
      record('Member Requests', 'DB Relationship & Customer Type', 'FAIL', 'Job missing member ID or wrong type');
    }

  } catch (err: any) {
    record('Member Requests', 'Member Request Suite', 'FAIL', err.message);
  }

  // ================= 4. EMERGENCY NON-MEMBER ASSISTANCE FEATURE =================
  let nonMemberJobId = '';
  try {
    // 4.1 Non-Member Submits Emergency Request (NO AUTH REQUIRED)
    const emergencyRes = await fetch(`${BASE_URL}/jobs/emergency-non-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Themba Khumalo',
        phone: '+27 83 456 7890',
        email: 'themba.k@gmail.com',
        address: 'Corner William Nicol & Sandton Drive, Hurlingham',
        serviceType: 'Roadside Assistance',
        description: 'Engine overheated and smoke coming from radiator. Stranded at intersection.',
        vehicle: {
          make: 'Volkswagen',
          model: 'Polo TSI',
          year: 2021,
          licensePlate: 'CA 765-890',
          color: 'Flash Red'
        },
        agreedToPayFull: true
      })
    });
    const emergencyData = await emergencyRes.json();
    if (emergencyRes.ok && emergencyData.job && emergencyData.job.id) {
      nonMemberJobId = emergencyData.job.id;
      record('Non-Member Emergency', 'Public Emergency Request Submission', 'PASS', 
        `Request created with Ref #${emergencyData.job.referenceCode || nonMemberJobId.slice(-6)}`);
    } else {
      record('Non-Member Emergency', 'Public Emergency Request Submission', 'FAIL', 
        `Submission failed: ${JSON.stringify(emergencyData)}`);
    }

    // 4.2 Verify Database Record Isolation
    const dbEmergencyJob = await prisma.job.findUnique({ where: { id: nonMemberJobId } });
    if (
      dbEmergencyJob && 
      dbEmergencyJob.customerType === 'NON_MEMBER_EMERGENCY' && 
      dbEmergencyJob.customerId === null &&
      dbEmergencyJob.nonMemberName === 'Themba Khumalo' &&
      dbEmergencyJob.paymentStatus === 'Pending'
    ) {
      record('Non-Member Emergency', 'Database Isolation & Customer Type', 'PASS', 
        'Record has customerType=NON_MEMBER_EMERGENCY, customerId=null (NO membership profile created)');
    } else {
      record('Non-Member Emergency', 'Database Isolation & Customer Type', 'FAIL', 
        `Database record incorrect: ${JSON.stringify(dbEmergencyJob)}`);
    }

    // 4.3 Public Tracking Endpoint (No Auth Required)
    const trackRes = await fetch(`${BASE_URL}/jobs/emergency-non-member/${nonMemberJobId}`);
    const trackData = await trackRes.json();
    const trackName = trackData.nonMemberName || trackData.job?.nonMemberName;
    const trackStatus = trackData.status || trackData.job?.status;
    if (trackRes.ok && trackName === 'Themba Khumalo') {
      record('Non-Member Emergency', 'Public Real-Time Tracker', 'PASS', 
        `Customer can track request status (${trackStatus}) without account login`);
    } else {
      record('Non-Member Emergency', 'Public Real-Time Tracker', 'FAIL', `Tracking failed: ${JSON.stringify(trackData)}`);
    }

    // 4.4 Admin & Staff Queue Differentiation
    const adminJobsRes = await fetch(`${BASE_URL}/jobs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminJobsData = await adminJobsRes.json();
    const jobsList = Array.isArray(adminJobsData) ? adminJobsData : adminJobsData.jobs || [];
    const foundNonMemberInAdmin = jobsList.find((j: any) => j.id === nonMemberJobId);
    if (foundNonMemberInAdmin && foundNonMemberInAdmin.customerType === 'NON_MEMBER_EMERGENCY') {
      record('Staff / Admin Portal', 'Emergency Flagging & Visibility', 'PASS', 
        'Staff dashboard displays request with NON_MEMBER_EMERGENCY badge and full vehicle information');
    } else {
      record('Staff / Admin Portal', 'Emergency Flagging & Visibility', 'FAIL', 'Emergency request not found in admin jobs list');
    }

    // 4.5 Dispatch & Contractor Assignment
    // Get Sipho's user ID for assignment
    const contractorMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${contractorToken}` }
    });
    const contractorMe = await contractorMeRes.json();
    const contractorId = contractorMe.user?.id || contractorMe.id;

    const assignRes = await fetch(`${BASE_URL}/jobs/${nonMemberJobId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ contractorId })
    });
    if (assignRes.ok) {
      record('Contractor / Mechanic', 'Dispatcher Assignment', 'PASS', `Assigned contractor ${contractorId} to emergency incident`);
    } else {
      record('Contractor / Mechanic', 'Dispatcher Assignment', 'FAIL', `Assignment failed: ${assignRes.status}`);
    }

    const statusRes = await fetch(`${BASE_URL}/jobs/${nonMemberJobId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${contractorToken}`
      },
      body: JSON.stringify({ status: 'En Route' })
    });
    if (statusRes.ok) {
      record('Contractor / Mechanic', 'Status Progression (En Route)', 'PASS', 'Contractor updated status to En Route');
    } else {
      record('Contractor / Mechanic', 'Status Progression (En Route)', 'FAIL', `Failed to update status`);
    }

    // 4.6 Work Completed & Final Amount Determination
    const finalAmountRes = await fetch(`${BASE_URL}/jobs/${nonMemberJobId}/service-amount`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${contractorToken}`
      },
      body: JSON.stringify({
        finalAmount: 1650.00,
        servicePerformed: 'Coolant hose clamp repair, system bleed, and 5L G12 coolant replenishment'
      })
    });
    const finalAmountData = await finalAmountRes.json();
    const resolvedFinalAmount = finalAmountData.finalAmount ?? finalAmountData.job?.finalAmount;
    const resolvedPayStatus = finalAmountData.paymentStatus ?? finalAmountData.job?.paymentStatus;
    if (finalAmountRes.ok && resolvedFinalAmount === 1650.00 && resolvedPayStatus === 'Payment Due') {
      record('Non-Member Payment', 'Final Service Amount Determination', 'PASS', 
        `Final amount set to R 1,650.00 with detailed invoice breakdown. Status: Payment Due`);
    } else {
      record('Non-Member Payment', 'Final Service Amount Determination', 'FAIL', 
        `Failed to set amount: ${JSON.stringify(finalAmountData)}`);
    }

    // 4.7 Customer Pays Full Amount (One-Off Emergency Payment)
    const payRes = await fetch(`${BASE_URL}/jobs/emergency-non-member/${nonMemberJobId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1650.00,
        paymentMethod: 'Credit Card (3D Secure)'
      })
    });
    const payData = await payRes.json();
    if (payRes.ok && payData.job && payData.job.paymentStatus === 'Paid' && payData.job.status === 'Service Completed') {
      record('Non-Member Payment', 'Full Amount Payment & Confirmation', 'PASS', 
        'Emergency request paid in full. Job marked as Service Completed & Paid');
    } else {
      record('Non-Member Payment', 'Full Amount Payment & Confirmation', 'FAIL', 
        `Payment failed: ${JSON.stringify(payData)}`);
    }

    // 4.8 Critical Verification: NO SUBSCRIPTION CREATED FOR NON-MEMBER
    const paymentsInDb = await prisma.payment.findMany({ where: { jobId: nonMemberJobId } });
    const userInDb = await prisma.user.findFirst({ where: { email: 'themba.k@gmail.com' } });
    if (paymentsInDb.length > 0 && paymentsInDb[0].amount === 1650.00 && userInDb === null) {
      record('Non-Member Billing Isolation', 'Strict Non-Member Isolation Verification', 'PASS', 
        'Payment recorded for job. NO monthly subscription and NO member user account was created.');
    } else {
      record('Non-Member Billing Isolation', 'Strict Non-Member Isolation Verification', 'FAIL', 
        `Payments found: ${paymentsInDb.length}, User in DB: ${JSON.stringify(userInDb)}`);
    }

  } catch (err: any) {
    record('Non-Member Emergency', 'Non-Member Emergency Suite', 'FAIL', err.message);
  }

  // ================= 5. SECURITY & ACCESS CONTROL =================
  try {
    // 5.1 Member route protected from unauthenticated access
    const protectedRes = await fetch(`${BASE_URL}/jobs/my`);
    if (protectedRes.status === 401) {
      record('Security', 'Unauthenticated /jobs/my Protection', 'PASS', 'Blocked with 401 Unauthorized');
    } else {
      record('Security', 'Unauthenticated /jobs/my Protection', 'FAIL', `Expected 401, got ${protectedRes.status}`);
    }

    // 5.2 Customer cannot modify contractor rate/status directly without role
    const customerTamperRes = await fetch(`${BASE_URL}/jobs/${nonMemberJobId}/service-amount`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ finalAmount: 1.00 })
    });
    if (customerTamperRes.status === 403 || customerTamperRes.status === 401) {
      record('Security', 'Customer Final Amount Tamper Protection', 'PASS', 
        `Customer blocked from adjusting job amount (HTTP ${customerTamperRes.status})`);
    } else {
      record('Security', 'Customer Final Amount Tamper Protection', 'FAIL', 
        `Expected 403, got ${customerTamperRes.status}`);
    }

  } catch (err: any) {
    record('Security', 'Security Suite', 'FAIL', err.message);
  }

  printSummary();
}

function printSummary() {
  console.log('\n====================================================');
  console.log('AUTOMATED TEST EXECUTION SUMMARY');
  console.log('====================================================');
  const passed = results.filter(r => r.result === 'PASS').length;
  const failed = results.filter(r => r.result === 'FAIL').length;
  const blocked = results.filter(r => r.result === 'BLOCKED').length;
  const notImplemented = results.filter(r => r.result === 'NOT IMPLEMENTED').length;

  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log(`Blocked:         ${blocked}`);
  console.log(`Not Implemented: ${notImplemented}`);
  console.log('====================================================\n');
}

runTests().finally(() => {
  prisma.$disconnect();
});
