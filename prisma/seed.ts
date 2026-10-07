import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.benefitTransaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.fileRecord.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const standardHash = await bcrypt.hash('demo-passcode', saltRounds);

  // Seed Users
  // 1. Customer: Lerato Molefe (Onboarding)
  const lerato = await prisma.user.create({
    data: {
      email: 'lerato@molefefamily.co.za',
      passwordHash: standardHash,
      role: 'Customer',
      name: 'Lerato Molefe',
      phone: '+27 82 123 4567',
      address: '12 West Street, Sandown, Sandton',
      status: 'Active',
      package: 'Diamond',
      memberSince: '2026-01-10',
      repairsCount: 1,
      totalPaid: 1500.0,
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
    },
  });

  // 2. Customer: Thabo Mokoena (Active)
  const thabo = await prisma.user.create({
    data: {
      email: 'thabo@mokoenaholdings.com',
      passwordHash: standardHash,
      role: 'Customer',
      name: 'Thabo Mokoena',
      phone: '+27 72 456 7890',
      address: '88 Grayston Drive, Sandton',
      status: 'Active',
      package: 'Platinum',
      memberSince: '2026-01-15',
      repairsCount: 2,
      totalPaid: 3594.0,
      notificationSettings: {
        create: {
          email: true,
          sms: false,
          push: true,
          inApp: true,
        },
      },
    },
  });

  // 2b. Customer: Bright (User Side)
  const brightHash = await bcrypt.hash('12345', saltRounds);
  const bright = await prisma.user.create({
    data: {
      email: 'bright@samedayassist.co.za',
      passwordHash: brightHash,
      role: 'Customer',
      name: 'Bright',
      phone: '+27 82 555 7777',
      address: '77 Sunset Boulevard, Sandton',
      status: 'Active',
      package: 'Diamond',
      memberSince: '2026-01-01',
      repairsCount: 1,
      totalPaid: 2500.0,
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'bright@samedayassist',
      passwordHash: brightHash,
      role: 'Customer',
      name: 'Bright',
      phone: '+27 82 555 7777',
      address: '77 Sunset Boulevard, Sandton',
      status: 'Active',
      package: 'Diamond',
      memberSince: '2026-01-01',
      repairsCount: 1,
      totalPaid: 2500.0,
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
    },
  });

  // 3. Contractors / Field Responders
  const sipho = await prisma.user.create({
    data: {
      email: 'sipho.ndlovu@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Contractor',
      name: 'Sipho Ndlovu',
      phone: '+27 82 555 0192',
      address: 'Sandton Core, JHB',
      specialty: 'Security',
      rating: 4.9,
      isAvailable: true,
      lat: -26.1076,
      lng: 28.0567,
      certifications: JSON.stringify(['PSIRA Grade A Security Officer', 'Armed Response Certified', 'First Aid Level 1']),
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
    },
  });

  const jan = await prisma.user.create({
    data: {
      email: 'jan.deklerk@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Contractor',
      name: 'Jan de Klerk',
      phone: '+27 71 555 3049',
      address: 'Rosebank Central, JHB',
      specialty: 'Electrical',
      rating: 4.8,
      isAvailable: true,
      lat: -26.1438,
      lng: 28.0425,
      certifications: JSON.stringify(['SABS Red Seal Electrician', 'Installation Rules Wireman\'s License']),
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: false,
          inApp: true,
        },
      },
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah.naidoo@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Contractor',
      name: 'Sarah Naidoo',
      phone: '+27 83 555 4920',
      address: 'Midrand Industrial, JHB',
      specialty: 'Plumbing',
      rating: 4.7,
      isAvailable: true,
      lat: -25.9870,
      lng: 28.1250,
      certifications: JSON.stringify(['PIRB Registered Plumber', 'Solar Geyser Qualified Surveyor']),
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: 'marcus.nkosi@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Contractor',
      name: 'Marcus Nkosi',
      phone: '+27 76 555 9321',
      address: 'Randburg North, JHB',
      specialty: 'Construction',
      rating: 4.9,
      isAvailable: true,
      lat: -26.0911,
      lng: 27.9989,
      certifications: JSON.stringify(['NHBRC Registered Builder', 'Health & Safety Officer']),
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
    },
  });

  // 4. Administrators
  await prisma.user.create({
    data: {
      email: 'controlroom@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Administrator',
      name: 'Control Room Hub',
      phone: '+27 11 555 9111',
      address: 'Sandton Office Park, Sandton',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Administrator',
      name: 'Operations Manager',
      phone: '+27 11 555 9112',
      address: 'Sandton Office Park, Sandton',
    },
  });

  // 5. Dispatcher / Operations
  await prisma.user.create({
    data: {
      email: 'dispatcher@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Dispatcher',
      name: 'Operations Dispatcher Hub',
      phone: '+27 82 555 1212',
      address: 'Operations Center, Sandton',
    },
  });

  // 6. Super Administrator (Developer)
  await prisma.user.create({
    data: {
      email: 'developer@samedayassist.co.za',
      passwordHash: standardHash,
      role: 'Super Administrator',
      name: 'Lead Architect',
      phone: '+27 82 555 9999',
      address: 'Soweto Tech Hub, Orlando East',
    },
  });

  // 7. Super Administrator (Mike)
  const mikeHash = await bcrypt.hash('12345', saltRounds);

  await prisma.user.create({
    data: {
      email: 'mike@samedayassist.co.za',
      passwordHash: mikeHash,
      role: 'Super Administrator',
      name: 'Mike',
      phone: '+27 82 555 1000',
      address: 'Sandton Office Park, Sandton',
    },
  });

  await prisma.user.create({
    data: {
      email: 'mike@samedayassist',
      passwordHash: mikeHash,
      role: 'Super Administrator',
      name: 'Mike',
      phone: '+27 82 555 1000',
      address: 'Sandton Office Park, Sandton',
    },
  });

  // Seed Enquiries
  const enq1 = await prisma.enquiry.create({
    data: {
      id: 'enq-101',
      customerName: 'Lerato Molefe',
      email: 'lerato@molefefamily.co.za',
      phone: '+27 82 123 4567',
      address: '12 West Street, Sandown, Sandton',
      serviceCategory: 'Security',
      notes: 'Interested in the Diamond package. Need CCTV, Alarm Systems, and Electric Fence assessed for my home.',
      status: 'Pending',
      createdAt: new Date('2026-07-07T08:30:00Z'),
    },
  });

  const enq2 = await prisma.enquiry.create({
    data: {
      id: 'enq-102',
      customerName: 'David Harrison',
      email: 'david.h@harrisonlaw.co.za',
      phone: '+27 83 987 6543',
      address: '45 Rivonia Road, Morningside, Sandton',
      serviceCategory: 'Electrical',
      notes: 'Inquiring about Platinum. Frequent power surges and need automated gate assessment.',
      status: 'Scheduled',
      createdAt: new Date('2026-07-06T14:15:00Z'),
    },
  });

  // Create a Scheduled Assessment for Enquiry 2
  await prisma.assessment.create({
    data: {
      id: 'ass-102',
      enquiryId: enq2.id,
      contractorId: jan.id,
      scheduledAt: new Date('2026-07-08T09:00:00Z'),
      status: 'Scheduled',
      estimatedCost: 0,
      issuesFound: JSON.stringify([]),
    },
  });

  // Seed Memberships, Claims, Invoices, and Benefit Transactions
  // 1. Bright: ASSIST PLUS (R1,499/mo, R15,000 annual benefit)
  const brightMembership = await prisma.membership.create({
    data: {
      userId: bright.id,
      planId: 'assist_plus',
      planName: 'Assist Plus',
      monthlyPrice: 1499,
      annualBenefit: 15000,
      benefitYearStart: new Date('2026-01-01T00:00:00Z'),
      benefitYearEnd: new Date('2026-12-31T23:59:59Z'),
      status: 'Active',
    },
  });

  // Bright Opening Benefit Transaction
  await prisma.benefitTransaction.create({
    data: {
      membershipId: brightMembership.id,
      userId: bright.id,
      date: new Date('2026-01-01T08:00:00Z'),
      reference: 'OPENING-2026',
      description: 'Opening Annual Assistance Benefit Allocation',
      credit: 15000,
      debit: 0,
      balance: 15000,
    },
  });

  // Bright Claim 1: SDA-000124 (01 October 2026) — Vehicle / Gate Motor Repair
  const brightClaim1 = await prisma.claim.create({
    data: {
      claimNumber: 'SDA-000124',
      userId: bright.id,
      membershipId: brightMembership.id,
      serviceType: 'Security Services',
      description: 'Vehicle perimeter barrier and automated gate motor actuator repair',
      vehicleOrProperty: '77 Sunset Boulevard Main Driveway',
      contractorName: 'Sipho Ndlovu (Apex CCTV & Security)',
      amountClaimed: 2500,
      amountApproved: 2500,
      amountDeductedFromBenefit: 2500,
      customerResponsibility: 0,
      status: 'Completed',
      submittedAt: new Date('2026-10-01T09:15:00Z'),
      reviewedAt: new Date('2026-10-01T10:00:00Z'),
      completedAt: new Date('2026-10-01T14:30:00Z'),
    },
  });

  // Bright Invoice 1
  const brightInv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'SDA-INV-000124',
      userId: bright.id,
      membershipId: brightMembership.id,
      claimId: brightClaim1.id,
      customerName: bright.name,
      customerEmail: bright.email,
      customerAddress: bright.address,
      membershipPlan: 'Assist Plus',
      serviceRequested: 'Vehicle Gate Barrier & Actuator Repair',
      technicianName: 'Sipho Ndlovu (Apex CCTV & Security)',
      parts: 1500,
      labour: 1000,
      otherCharges: 0,
      subtotal: 2500,
      taxVat: 375,
      total: 2500,
      amountCoveredByBenefit: 2500,
      amountPayableByCustomer: 0,
      paymentStatus: 'Paid',
      invoiceStatus: 'Settled',
      paidAt: new Date('2026-10-01T14:30:00Z'),
      date: new Date('2026-10-01T14:30:00Z'),
      notes: '100% covered under member annual assistance benefit. Customer payable: R0.00',
    },
  });

  // Bright Benefit Transaction 1 (Debit R2,500 -> Balance R12,500)
  await prisma.benefitTransaction.create({
    data: {
      membershipId: brightMembership.id,
      userId: bright.id,
      claimId: brightClaim1.id,
      invoiceId: brightInv1.id,
      date: new Date('2026-10-01T14:30:00Z'),
      reference: 'SDA-000124',
      description: 'Vehicle & Barrier Repair Claim #SDA-000124',
      credit: 0,
      debit: 2500,
      balance: 12500,
    },
  });

  // Bright Claim 2: SDA-000137 (15 October 2026) — Electrical Repair
  const brightClaim2 = await prisma.claim.create({
    data: {
      claimNumber: 'SDA-000137',
      userId: bright.id,
      membershipId: brightMembership.id,
      serviceType: 'Electrical Assistance',
      description: 'High-voltage perimeter fence power supply unit diagnostic and fault finding',
      vehicleOrProperty: '77 Sunset Boulevard North Perimeter',
      contractorName: 'Jan de Klerk',
      amountClaimed: 1000,
      amountApproved: 1000,
      amountDeductedFromBenefit: 1000,
      customerResponsibility: 0,
      status: 'Completed',
      submittedAt: new Date('2026-10-15T11:00:00Z'),
      reviewedAt: new Date('2026-10-15T11:30:00Z'),
      completedAt: new Date('2026-10-15T15:00:00Z'),
    },
  });

  // Bright Invoice 2
  const brightInv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'SDA-INV-000137',
      userId: bright.id,
      membershipId: brightMembership.id,
      claimId: brightClaim2.id,
      customerName: bright.name,
      customerEmail: bright.email,
      customerAddress: bright.address,
      membershipPlan: 'Assist Plus',
      serviceRequested: 'Perimeter Power Supply Diagnostic',
      technicianName: 'Jan de Klerk',
      parts: 0,
      labour: 1000,
      otherCharges: 0,
      subtotal: 1000,
      taxVat: 150,
      total: 1000,
      amountCoveredByBenefit: 1000,
      amountPayableByCustomer: 0,
      paymentStatus: 'Paid',
      invoiceStatus: 'Settled',
      paidAt: new Date('2026-10-15T15:00:00Z'),
      date: new Date('2026-10-15T15:00:00Z'),
      notes: '100% covered under member annual assistance benefit. Customer payable: R0.00',
    },
  });

  // Bright Benefit Transaction 2 (Debit R1,000 -> Balance R11,500)
  await prisma.benefitTransaction.create({
    data: {
      membershipId: brightMembership.id,
      userId: bright.id,
      claimId: brightClaim2.id,
      invoiceId: brightInv2.id,
      date: new Date('2026-10-15T15:00:00Z'),
      reference: 'SDA-000137',
      description: 'Electrical Repair Claim #SDA-000137',
      credit: 0,
      debit: 1000,
      balance: 11500,
    },
  });

  // 2. Thabo Mokoena: ASSIST PRO (R2,999/mo, R40,000 annual benefit)
  const thaboMembership = await prisma.membership.create({
    data: {
      userId: thabo.id,
      planId: 'assist_pro',
      planName: 'Assist Pro',
      monthlyPrice: 2999,
      annualBenefit: 40000,
      benefitYearStart: new Date('2026-01-15T00:00:00Z'),
      benefitYearEnd: new Date('2027-01-14T23:59:59Z'),
      status: 'Active',
    },
  });

  await prisma.benefitTransaction.create({
    data: {
      membershipId: thaboMembership.id,
      userId: thabo.id,
      date: new Date('2026-01-15T08:00:00Z'),
      reference: 'OPENING-2026',
      description: 'Opening Annual Assistance Benefit Allocation (Assist Pro)',
      credit: 40000,
      debit: 0,
      balance: 40000,
    },
  });

  const thaboClaim = await prisma.claim.create({
    data: {
      claimNumber: 'SDA-CLM-000088',
      userId: thabo.id,
      membershipId: thaboMembership.id,
      serviceType: 'Plumbing Assistance',
      description: 'Main burst pipe emergency isolation and structural repair',
      vehicleOrProperty: '88 Grayston Drive Commercial Complex',
      contractorName: 'Sarah Naidoo',
      amountClaimed: 4500,
      amountApproved: 4500,
      amountDeductedFromBenefit: 4500,
      customerResponsibility: 0,
      status: 'Completed',
      submittedAt: new Date('2026-08-10T14:00:00Z'),
      reviewedAt: new Date('2026-08-10T14:30:00Z'),
      completedAt: new Date('2026-08-10T18:00:00Z'),
    },
  });

  const thaboInv = await prisma.invoice.create({
    data: {
      invoiceNumber: 'SDA-INV-000088',
      userId: thabo.id,
      membershipId: thaboMembership.id,
      claimId: thaboClaim.id,
      customerName: thabo.name,
      customerEmail: thabo.email,
      customerAddress: thabo.address,
      membershipPlan: 'Assist Pro',
      serviceRequested: 'Burst Water Pipe Emergency Isolation',
      technicianName: 'Sarah Naidoo',
      parts: 2200,
      labour: 2300,
      otherCharges: 0,
      subtotal: 4500,
      taxVat: 675,
      total: 4500,
      amountCoveredByBenefit: 4500,
      amountPayableByCustomer: 0,
      paymentStatus: 'Paid',
      invoiceStatus: 'Settled',
      paidAt: new Date('2026-08-10T18:00:00Z'),
      date: new Date('2026-08-10T18:00:00Z'),
      notes: 'Fully covered under annual benefit. Customer payable: R0.00',
    },
  });

  await prisma.benefitTransaction.create({
    data: {
      membershipId: thaboMembership.id,
      userId: thabo.id,
      claimId: thaboClaim.id,
      invoiceId: thaboInv.id,
      date: new Date('2026-08-10T18:00:00Z'),
      reference: 'SDA-CLM-000088',
      description: 'Plumbing Repair Claim #SDA-CLM-000088',
      credit: 0,
      debit: 4500,
      balance: 35500,
    },
  });

  // 3. Lerato Molefe: ASSIST (R799/mo, R0 Parts Benefit)
  const leratoMembership = await prisma.membership.create({
    data: {
      userId: lerato.id,
      planId: 'assist',
      planName: 'Assist',
      monthlyPrice: 799,
      annualBenefit: 0,
      benefitYearStart: new Date('2026-01-10T00:00:00Z'),
      benefitYearEnd: new Date('2027-01-09T23:59:59Z'),
      status: 'Active',
    },
  });

  await prisma.benefitTransaction.create({
    data: {
      membershipId: leratoMembership.id,
      userId: lerato.id,
      date: new Date('2026-01-10T08:00:00Z'),
      reference: 'OPENING-2026',
      description: 'Opening Annual Assistance Benefit Allocation (Assist - R0 Parts Benefit)',
      credit: 0,
      debit: 0,
      balance: 0,
    },
  });

  // Lerato Claim demonstrating R0 Parts Benefit: Labour is covered, parts are billed to member account
  const leratoClaim = await prisma.claim.create({
    data: {
      claimNumber: 'SDA-CLM-000042',
      userId: lerato.id,
      membershipId: leratoMembership.id,
      serviceType: 'Security Services',
      description: 'Alarm panel diagnostics and sensor backup battery replacement',
      vehicleOrProperty: '12 West Street Residence',
      contractorName: 'Marcus Nkosi',
      amountClaimed: 1350,
      amountApproved: 1350,
      amountDeductedFromBenefit: 0,
      customerResponsibility: 650, // parts cost billed to member
      status: 'Completed',
      submittedAt: new Date('2026-09-05T10:00:00Z'),
      reviewedAt: new Date('2026-09-05T10:30:00Z'),
      completedAt: new Date('2026-09-05T13:00:00Z'),
    },
  });

  const leratoInv = await prisma.invoice.create({
    data: {
      invoiceNumber: 'SDA-INV-000042',
      userId: lerato.id,
      membershipId: leratoMembership.id,
      claimId: leratoClaim.id,
      customerName: lerato.name,
      customerEmail: lerato.email,
      customerAddress: lerato.address,
      membershipPlan: 'Assist',
      serviceRequested: 'Alarm Panel Diagnostic & Battery Replacement',
      technicianName: 'Marcus Nkosi',
      parts: 650,
      labour: 700,
      otherCharges: 0,
      subtotal: 1350,
      taxVat: 202.5,
      total: 1350,
      amountCoveredByBenefit: 0,
      amountPayableByCustomer: 650,
      paymentStatus: 'Paid',
      invoiceStatus: 'Settled',
      paidAt: new Date('2026-09-05T13:00:00Z'),
      date: new Date('2026-09-05T13:00:00Z'),
      notes: 'Assist Plan: Labour & fault finding (R700) covered under plan. Replacement battery hardware (R650) billed to member account.',
    },
  });

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
