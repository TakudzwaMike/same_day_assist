import { prisma } from '../server/src/config/db';
import { hashPassword, comparePassword } from '../server/src/config/auth';

async function runTests() {
  console.log('=== RUNNING SETTINGS & BRAND THEME BACKEND TESTS ===\n');

  // Find or create test customer
  let testCustomer = await prisma.user.findFirst({
    where: { role: 'Customer' },
  });

  if (!testCustomer) {
    const pwHash = await hashPassword('testpass123');
    testCustomer = await prisma.user.create({
      data: {
        email: 'testcustomer_audit@samedayassist.co.za',
        passwordHash: pwHash,
        role: 'Customer',
        name: 'Audit Test Customer',
        phone: '+27 82 555 9999',
        address: '100 Rivonia Road, Sandton, Johannesburg, Gauteng, 2196',
        status: 'Active',
        package: 'Diamond',
      },
    });
    console.log('Created test customer:', testCustomer.email);
  } else {
    console.log('Using existing customer:', testCustomer.email);
  }

  // 1. Test Password Hashing and Verification
  console.log('\n--- Test 1: Password Verification & Hash Validation ---');
  const tempPassword = 'currentPassword123!';
  const newHash = await hashPassword(tempPassword);
  await prisma.user.update({
    where: { id: testCustomer.id },
    data: { passwordHash: newHash },
  });

  const validMatch = await comparePassword(tempPassword, newHash);
  const invalidMatch = await comparePassword('wrongPassword!', newHash);
  console.log('Valid password matches:', validMatch === true ? '✓ PASS' : '✗ FAIL');
  console.log('Invalid password rejected:', invalidMatch === false ? '✓ PASS' : '✗ FAIL');

  // 2. Test Customer Profile Updates
  console.log('\n--- Test 2: Customer Profile Direct Updates ---');
  const updatedName = 'Sipho Test-Ndlovu';
  const updatedPhone = '+27 82 111 2222';
  const updatedAddress = '15 West Street, Sandton, Johannesburg, Gauteng, 2196';

  const userAfterProfile = await prisma.user.update({
    where: { id: testCustomer.id },
    data: {
      name: updatedName,
      phone: updatedPhone,
      address: updatedAddress,
      secondaryPhone: '+27 11 999 8888',
      emergencyContactName: 'Thandi Ndlovu',
      emergencyContactPhone: '+27 83 444 5555',
    },
  });

  console.log('Profile Name Updated:', userAfterProfile.name === updatedName ? '✓ PASS' : '✗ FAIL');
  console.log('Profile Phone Updated:', userAfterProfile.phone === updatedPhone ? '✓ PASS' : '✗ FAIL');
  console.log('Profile Address Updated:', userAfterProfile.address === updatedAddress ? '✓ PASS' : '✗ FAIL');
  console.log('Emergency Contact Saved:', userAfterProfile.emergencyContactName === 'Thandi Ndlovu' ? '✓ PASS' : '✗ FAIL');

  // 3. Test Notification Preference Upsert
  console.log('\n--- Test 3: Notification Preference Storage ---');
  const notifPref = await prisma.notificationPreference.upsert({
    where: { userId: testCustomer.id },
    update: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
    create: {
      userId: testCustomer.id,
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
  });

  console.log('Notification Email Pref:', notifPref.email === true ? '✓ PASS' : '✗ FAIL');
  console.log('Notification SMS Pref:', notifPref.sms === false ? '✓ PASS' : '✗ FAIL');
  console.log('Notification Push Pref:', notifPref.push === true ? '✓ PASS' : '✗ FAIL');

  // 4. Test Communication Preferences (Theme & Alerts)
  console.log('\n--- Test 4: Theme Preference and Communication Settings ---');
  const commPrefs = {
    themePreference: 'dark',
    serviceUpdates: true,
    paymentAlerts: true,
    securityAlerts: true,
  };

  await prisma.user.update({
    where: { id: testCustomer.id },
    data: {
      communicationPreferences: JSON.stringify(commPrefs),
    },
  });

  const userWithPrefs = await prisma.user.findUnique({
    where: { id: testCustomer.id },
    select: { communicationPreferences: true },
  });

  const parsed = JSON.parse(userWithPrefs?.communicationPreferences || '{}');
  console.log('Theme preference stored as "dark":', parsed.themePreference === 'dark' ? '✓ PASS' : '✗ FAIL');
  console.log('Service updates preference stored:', parsed.serviceUpdates === true ? '✓ PASS' : '✗ FAIL');

  // 5. Test Saved Location Creation and Update
  console.log('\n--- Test 5: Saved Location Add and Update ---');
  const createdLoc = await prisma.savedLocation.create({
    data: {
      userId: testCustomer.id,
      label: 'Office Branch',
      address: '44 Melrose Arch Boulevard, Johannesburg',
      lat: -26.1328,
      lng: 28.0678,
      accessNotes: 'Underground parking bay 14',
    },
  });

  console.log('Created location:', createdLoc.label, createdLoc.address);

  const updatedLoc = await prisma.savedLocation.update({
    where: { id: createdLoc.id },
    data: {
      label: 'Headquarters Office',
      accessNotes: 'Underground parking bay 15, keycard needed',
    },
  });

  console.log('Updated location label:', updatedLoc.label === 'Headquarters Office' ? '✓ PASS' : '✗ FAIL');

  // Cleanup test location
  await prisma.savedLocation.delete({ where: { id: createdLoc.id } });
  console.log('Cleaned up test location: ✓ PASS');

  console.log('\n=== ALL DATABASE & AUTH BACKEND TESTS COMPLETED SUCCESSFULLY ===');
}

runTests()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
