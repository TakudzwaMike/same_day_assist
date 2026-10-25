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
  await prisma.teamPayout.deleteMany();
  await prisma.teamPenalty.deleteMany();
  await prisma.teamBonus.deleteMany();
  await prisma.teamEarning.deleteMany();
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
  const dispatcher = await prisma.user.create({
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
      date: new Date('2026-09-05T13:00:00Z'),
      notes: 'Assist Plan: Labour & fault finding (R700) covered under plan. Replacement battery hardware (R650) billed to member account.',
    },
  });

  // 4. Completed Jobs (Historical Records with Handover Proof, Media & Replaced Parts)
  await prisma.job.create({
    data: {
      id: 'job-comp-001',
      customerId: bright.id,
      customerType: 'MEMBER',
      serviceType: 'Security Services',
      description: 'Main driveway automated sliding gate stuck midway; safety beams unresponsive during storm.',
      status: 'Service Completed',
      trackerProgress: 100,
      finalAmount: 1850.0,
      paymentStatus: 'Paid',
      servicePerformed: 'Gate rack alignment restored, photocell safety beams replaced, backup battery float tested and operational.',
      assignedContractorId: sipho.id,
      photoBeforeUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60',
      photoAfterUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=60',
      partsReplaced: JSON.stringify([
        { name: 'Centurion Wireless Safety Photon Beams Pair', id: 'PART-BM-402', quantity: 1, cost: 850 },
        { name: '12V 7Ah Deep Cycle SLA Backup Battery', id: 'PART-BAT-127', quantity: 1, cost: 450 }
      ]),
      contractorNotes: 'Conducted manual release override check and obstruction reversal test. Replaced corroded safety beams and tested auto-close sequence 5 times.',
      contractorSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjx0ZXh0IHg9IjEwIiB5PSIyMCIgZm9udC1mYW1pbHk9ImN1cnNpdmUiPk1pa2UgU2lwaG88L3RleHQ+PC9zdmc+',
      rating: 5,
      ratingComment: 'Prompt arrival within 20 mins. Replaced the faulty beams and gate is moving smoothly now!',
      createdAt: new Date('2026-10-20T12:00:00Z'),
      assignedAt: new Date('2026-10-20T12:05:00Z'),
      completedAt: new Date('2026-10-20T14:30:00Z'),
    },
  });

  await prisma.job.create({
    data: {
      id: 'job-comp-002',
      customerId: thabo.id,
      customerType: 'MEMBER',
      serviceType: 'Alarm',
      description: 'North wall perimeter infrared beam triggering continuous false alarms; siren strobe failure.',
      status: 'Service Completed',
      trackerProgress: 100,
      finalAmount: 2200.0,
      paymentStatus: 'Paid',
      servicePerformed: 'Re-aligned Optex twin outdoor beams, cleared overgrown foliage contact, replaced blown siren horn strobe module.',
      assignedContractorId: jan.id,
      photoBeforeUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=60',
      photoAfterUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60',
      partsReplaced: JSON.stringify([
        { name: '15W Weatherproof Outdoor Siren Strobe Module', id: 'PART-SIR-15', quantity: 1, cost: 750 },
        { name: 'Tamper-proof Junction Box IP66', id: 'PART-JB-66', quantity: 2, cost: 250 }
      ]),
      contractorNotes: 'Walk-test completed with client security officer. Event log confirmed clear of tamper loops.',
      contractorSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjx0ZXh0IHg9IjEwIiB5PSIyMCIgZm9udC1mYW1pbHk9ImN1cnNpdmUiPkphbiBkZSBLbGVyazwvdGV4dD48L3N2Zz4=',
      rating: 5,
      ratingComment: 'Thorough inspection and clean handover. No more false alarm triggers.',
      createdAt: new Date('2026-10-22T09:30:00Z'),
      assignedAt: new Date('2026-10-22T09:40:00Z'),
      completedAt: new Date('2026-10-22T11:15:00Z'),
    },
  });

  // 5. Completed Full Technical Assessments & Member Equipment Registers (V2.0)
  const fullTechnicalReportBright = {
    id: 'TA-BRIGHT-01',
    assessmentId: 'ass-bright-01',
    enquiryId: 'enq-101',
    customerId: bright.id,
    customerName: bright.name,
    accountType: 'House',
    version: '2.0',
    assessmentDate: new Date('2026-10-18T10:00:00Z').toISOString(),
    memberInfo: {
      legalFirstName: 'Bright',
      legalLastName: 'Member',
      membershipId: 'SDA-982410',
      primaryPhone: bright.phone,
      alternatePhone: '+27 11 555 7778',
      email: bright.email,
      selectedPackage: 'Diamond Assist Infinite',
      joinDate: '2026-01-01',
      appointmentDateTime: '2026-10-18T10:00:00Z',
      assignedTechnicianId: sipho.id,
      assignedTechnicianName: sipho.name,
      assignedTechnicianEmployeeId: 'SDA-TECH-019',
      status: 'Completed',
      representativeContact: { name: bright.name, phone: bright.phone, relationshipOrTitle: 'Property Owner' },
      propertyAccessPermissionsGranted: true,
      accessPermissionNotes: 'Full perimeter, gate motor and control room access granted by member.'
    },
    addressInfo: {
      propertyType: 'House',
      estateOrComplexName: 'Sunset Valley Estate',
      buildingOrBlock: '',
      unitOrStandNumber: 'Stand 77',
      streetNumber: '77',
      streetName: 'Sunset Boulevard',
      suburb: 'Sandton',
      city: 'Johannesburg',
      regionOrServiceArea: 'Gauteng Central',
      province: 'Gauteng',
      postalCode: '2196',
      hasNoStreetNumberException: false,
      noStreetNumberReason: '',
      gpsCoordinates: { lat: -26.1076, lng: 28.0567 },
      entranceGateToUse: 'Main Resident Gate (North Access)',
      gateAccessInstructions: 'Call via intercom keypad or press resident remote',
      parkingAndNavigationNotes: 'Dedicated visitor bay inside main courtyard',
      propertyEntrancePhotoUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60',
      visibleAddressStandPhotoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=60',
      addressVerifiedWithMember: true
    },
    systems: {
      alarm: {
        presence: 'Installed and fully functional',
        panelBrand: 'Paradox (Spectra / Magellan / EVO)',
        panelModel: 'EVO192 192-Zone High Security',
        panelFirmware: 'v7.12',
        panelSerialNumber: 'PX-EVO-88219-ZA',
        panelLocation: 'Master Security Nook Cabinet',
        zonesSupported: 192,
        zonesUsed: 24,
        partitionsCount: 3,
        enclosurePcbPhotos: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60'],
        systemConfiguration: 'Semi-wireless (hybrid)',
        expanders: [
          { id: 'exp-1', type: 'Remote (hardwired) expander', brandModel: 'Paradox ZX8 8-Zone Module', location: 'Garage Sub-DB', serialNumber: 'ZX8-9921', photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60' }
        ],
        mainsVoltageVAC: 228,
        chargingVoltageVDC: 13.8,
        batterySpec: '12V 8Ah LiFePO4 Lithium Backup',
        batteryCondition: 'Good',
        batteryBackupTestPass: true,
        tamperFaultOk: true,
        keypads: [
          { id: 'kp-1', count: 1, location: 'Front Foyer', brandModel: 'Paradox TM70 7-inch Touchscreen', type: 'Touchscreen', connection: 'Wired', keypadTestPassed: true, backlightFunctional: true, tamperOperational: true, damageOrWaterIngress: 'None' },
          { id: 'kp-2', count: 1, location: 'Master Suite', brandModel: 'Paradox K641+ LCD Keypad', type: 'LCD', connection: 'Wired', keypadTestPassed: true, backlightFunctional: true, tamperOperational: true, damageOrWaterIngress: 'None' }
        ],
        detectors: [
          { id: 'det-1', zoneNumber: 1, descriptiveName: 'Front Entrance Door Contact', location: 'Main Foyer Door', type: 'Door/window contacts', brandModel: 'Magnetic Reed Heavy Duty', connection: 'Wired', testResult: 'Pass' },
          { id: 'det-2', zoneNumber: 2, descriptiveName: 'Formal Lounge PIR', location: 'Lounge North Corner', type: 'PIR/pet-friendly PIR', brandModel: 'Paradox NV5 Digital', connection: 'Wired', testResult: 'Pass' },
          { id: 'det-3', zoneNumber: 3, descriptiveName: 'Driveway Dual Outdoor Beam', location: 'East Boundary Wall', type: 'Indoor/outdoor/roof beams', brandModel: 'Optex AX-100TFR Quad', connection: 'Wireless', testResult: 'Pass' }
        ],
        existingZoneListAvailable: 'Available',
        walkTestCompleted: true,
        zoneSchedule: [
          { zoneNumber: 1, clientExistingName: 'Front Door', verifiedPhysicalName: 'Front Entrance Door Contact', status: 'Matched' },
          { zoneNumber: 2, clientExistingName: 'Lounge PIR', verifiedPhysicalName: 'Formal Lounge PIR', status: 'Matched' },
          { zoneNumber: 3, clientExistingName: 'Driveway Beam', verifiedPhysicalName: 'Driveway Dual Outdoor Beam', status: 'Matched' }
        ],
        functionalTests: { walkTestPassed: true, sirensStrobesFunctional: true, panicDevicesOperational: true, acLossBatteryBackupPassed: true, bypassTamperIndicatorsClear: true, eventLogChecked: true },
        monitoringSignalPath: 'GSM-LTE',
        monitoringTestSuccessful: true,
        mobileAppLinkageOperational: true,
        remoteArmDisarmVerified: true,
        faults: []
      },
      cctv: {
        presence: 'Installed and fully functional',
        recorderType: 'NVR',
        brand: 'Hikvision Digital',
        model: 'DS-7716NI-I4/16P 16-Channel 4K NVR',
        firmwareVersion: 'V4.61.025_220905',
        serialNumber: 'HK-NVR-991204',
        labelPhotos: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=60'],
        channelCapacity: 16,
        activeCamerasCount: 8,
        spareChannelsCount: 8,
        hddCount: 2,
        individualHddCapacitiesTB: [4, 4],
        totalStorageTB: 8,
        driveHealth: 'Good',
        recordingMode: 'Smart AI',
        recordingResolution: '4K Ultra HD (3840x2160)',
        frameRateFps: 25,
        verifiedRetentionDays: 31,
        dateTimeAccurate: true,
        liveViewPlaybackExportTestPass: true,
        recorderPsuUpsBackupPass: true,
        cameras: [
          { id: 'cam-1', cameraNumberName: 'CAM-01: Main Driveway Gate', location: 'Gate Post Facing Street', brand: 'Hikvision', model: 'DS-2CD2087G2-LU ColorVu 8MP Bullet', serialNumber: 'HK-CAM-01', type: 'IP', formFactor: 'Bullet', resolutionMp: '8MP 4K', lensMm: '2.8mm', nightVisionTech: 'Full-colour (ColorVu 24/7)', fixedOrVarifocal: 'Fixed', audioSupport: 'One-way mic', weatherRating: 'IP67', powerType: 'PoE standard', dayNightQualityPass: true, testResult: 'Pass', isVehicleLprAnpr: true },
          { id: 'cam-2', cameraNumberName: 'CAM-02: Front Courtyard', location: 'Garage Eaves Facing South', brand: 'Hikvision', model: 'DS-2CD2387G2-LU ColorVu Turret', serialNumber: 'HK-CAM-02', type: 'IP', formFactor: 'Turret', resolutionMp: '8MP 4K', lensMm: '4.0mm', nightVisionTech: 'Full-colour (ColorVu 24/7)', fixedOrVarifocal: 'Fixed', audioSupport: 'None', weatherRating: 'IP67', powerType: 'PoE standard', dayNightQualityPass: true, testResult: 'Pass', isVehicleLprAnpr: false }
        ],
        cablingType: 'RG59 coaxial (LG59)',
        cablingCondition: 'Good',
        connectorsUsed: 'BNC',
        multiOutputPsuDetails: '9-Way 12V 10A Central Fused Power Box with Battery Float',
        poeSwitchPortCount: 16,
        internetConnectionRouterOk: true,
        mobileAppDisplaysThisPropertyVerified: true,
        authorizedAppUsersCount: 2,
        monitorsCount: 1,
        monitorDetails: 'Samsung 32-inch 1080p LED Monitor in Security Nook',
        monitorConnectionTypes: ['HDMI'],
        signalAccessoriesNotes: 'HDMI Extender over Cat6 verified for kitchen sub-monitor.',
        faults: []
      },
      accessControl: {
        presence: 'Installed and fully functional',
        controllerBrand: 'ZKTeco Enterprise',
        controllerModel: 'inBio260 2-Door IP Controller',
        firmwareVersion: 'v4.3.4',
        serialNumber: 'ZK-AC-10294',
        enclosurePcbPhotos: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60'],
        installationLocation: 'Garage Utility Board',
        supportedDoorsCount: 2,
        activeDoorsCount: 2,
        systemArchitecture: 'networked',
        managementSoftwareNameVersion: 'ZKBioSecurity v5.0',
        powerSupplyBackupPass: true,
        networkConnectionOk: true,
        readers: [
          { id: 'rdr-1', count: 1, doorOrGateName: 'Pedestrian Security Gate', brandModel: 'ZKTeco ProCapture-T Biometric', type: 'Fingerprint', location: 'Pedestrian Post', testResult: 'Pass' }
        ],
        locks: [
          { id: 'lck-1', doorOrGateName: 'Pedestrian Security Gate', lockType: 'Magnetic Lock (Maglock)', holdingForceRatingKg: 280, hasDoorContactSensor: true, hasRequestToExitButton: true, hasEmergencyBreakGlass: true, hasDoorCloser: true, fireInterfaceConnected: true, testResult: 'Pass' }
        ],
        emergencyReleasePass: true,
        powerFailureBehavior: 'Fail-safe (unlocks)',
        doorOpenAlertsFunctional: true,
        faults: []
      },
      intercom: {
        presence: 'Installed and fully functional',
        brandModel: 'Hikvision Modular IP Video Intercom',
        type: 'video',
        connectionType: 'IP / Wi-Fi',
        residenceType: 'single residence',
        entranceStationPhotos: ['https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60'],
        videoMonitorsCount: 2,
        audioOnlyHandsetsCount: 0,
        subStations: [
          { id: 'sub-1', location: 'Kitchen Main Wall', type: 'Video Monitor', model: 'Hikvision DS-KH6320-WTE1 7-inch Touchscreen', micSpeakerTested: true, screenTested: true, callTestPassed: true }
        ],
        triggeredOutputs: [
          { id: 'out-1', nameOrTarget: 'Driveway Main Gate', outputType: 'driveway gate', releasesSuccessfully: true },
          { id: 'out-2', nameOrTarget: 'Pedestrian Gate Electric Strike', outputType: 'electric lock', releasesSuccessfully: true }
        ],
        appConnectionVerified: true,
        remoteGateOpeningTested: true,
        visitorAudioVideoRecordingFunctional: true,
        faults: []
      },
      garageDoors: {
        presence: 'Installed and fully functional',
        doorsCount: 2,
        openingType: 'double',
        doorConstruction: 'sectional',
        material: 'aluminium',
        doorCondition: { springsGood: true, counterbalanceTested: true, rollersHingesLubricated: true, tracksAligned: true, manualMovementSmooth: true, balanceTestPassed: true },
        motorBrandModel: 'Centurion SDO4 Smart T12',
        motorSerialNumber: 'SDO4-SM-202419',
        ratingType: 'residential',
        driveMechanism: 'belt',
        smartFunctionality: true,
        batteryBackupSpec: '24V 2x 12V 3.5Ah Lead Acid',
        backupOperationPass: true,
        remotesCount: 4,
        wallConsolesFunctional: true,
        safetyBeamsFunctional: true,
        courtesyLightOperational: true,
        faults: []
      },
      gateMotors: {
        presence: 'Installed and fully functional',
        gateType: 'sliding',
        gatesCount: 1,
        gateMaterial: 'Steel Palisade with Anti-lift Bracket',
        mechanicsCondition: { wheelsBearingsSmooth: true, trackLevelAndClean: true, rackConditionGood: true, guideRollersSecure: true, endStopsRigid: true, manualResistanceLow: true },
        motorBrandModel: 'Centurion D5-Smart High Speed',
        motorSerialNumber: 'D5S-99210-ZA',
        controllerPcbCondition: 'Good',
        batteryQuantitySpec: '2x 12V 7.2Ah SLA in parallel float',
        batteryChargingVoltageVDC: 13.7,
        chargingCircuitFunctional: true,
        remotesCount: 6,
        gateBeamsOperational: true,
        antiCrushObstructionFunctional: true,
        pedestrianOpeningFunctional: true,
        autoCloseFunctional: true,
        courtesyLightModuleFunctional: true,
        smartWifiGsmModule: 'Centurion G-Ultra GSM Communicator',
        loopDetectorsFunctional: true,
        functionalTests: { openCloseCyclesPassed: true, manualKeyReleasePassed: true, obstructionBeamResponsePassed: true, backupBatterySpeedPassed: true },
        faults: []
      },
      electricFence: {
        presence: 'Installed and fully functional',
        energizerBrandModel: 'Nemtek Druid 15 LCD 5.0J',
        energizerSerialNumber: 'DR15-88219',
        zonesCount: 2,
        outputRatingJoules: 5.0,
        batteryBackupSpec: '12V 7Ah SLA Float',
        measuredFenceVoltageKV: 7.8,
        measuredEarthVoltageKV: 0.1,
        sirenKeypadAppFunctional: true,
        fenceConstruction: { approximateLengthMeters: 140, strandCount: 8, heightAboveWallMeters: 1.0, wireMaterial: 'Braided Stainless Steel', htCableRating: '15kV HT Cable in UV conduit', bobbinsInsulatorsCondition: 'Good', tensionersSpringsTight: true, vegetationClearanceAdequate: true },
        fenceGatesContactsOk: true,
        warningSignsSufficient: true,
        efscocCertificateAvailable: 'Yes',
        efscocCertificateNumber: 'EFS-JHB-2024-8841',
        efscocInstallerDetails: 'Sipho Ndlovu (DOL Certified Installer Reg #EF-8812)',
        complianceIssuesIdentified: 'None. Meets SANS 10222-3 standards.',
        faults: []
      },
      boomGates: {
        presence: 'Not installed',
        boomGatesCount: 0,
        gates: [],
        faults: []
      },
      turnstiles: {
        presence: 'Not installed',
        unitsCount: 0,
        units: [],
        faults: []
      }
    },
    consolidatedFaults: [],
    technicianObservations: 'Comprehensive Version 2.0 full-property technical assessment complete. All 7 installed residential security systems tested and verified under load. Baseline conforms fully to Same Day Assist rules.',
    optionalUpgradesRecommended: 'Recommended replacing garage backup batteries with Lithium packs within the next 18 months.',
    totalPreMembershipRepairsZar: 0,
    outcome: 'All good',
    clientAcknowledgement: {
      clientAgreedWithFindings: true,
      refusalToSign: false,
      signedByName: bright.name,
      signedDate: '2026-10-18T11:30:00Z',
      digitalSignatureUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjx0ZXh0IHg9IjEwIiB5PSIyMCIgZm9udC1mYW1pbHk9ImN1cnNpdmUiPkJyaWdodDwvdGV4dD48L3N2Zz4='
    },
    supervisorReview: {
      status: 'Approved',
      supervisorName: 'Technical Supervisor Mike',
      reviewedAt: '2026-10-18T14:00:00Z',
      supervisorNotes: 'Verified against all 9-system checks. RG59 cable integrity confirmed. Baseline locked.'
    },
    baselineLocked: true,
    baselineLockedAt: '2026-10-18T14:00:00Z'
  };

  await prisma.assessment.create({
    data: {
      id: 'ass-bright-01',
      enquiryId: enq1.id,
      contractorId: sipho.id,
      scheduledAt: new Date('2026-10-18T10:00:00Z'),
      completedAt: new Date('2026-10-18T12:00:00Z'),
      status: 'Uploaded',
      estimatedCost: 0,
      issuesFound: JSON.stringify([]),
      contractorNotes: 'Full systems walk-test verified. Baseline conforms to Same Day Assist rules.',
      structuredData: JSON.stringify(fullTechnicalReportBright),
      outcome: 'All good',
      supervisorStatus: 'Approved',
      supervisorNotes: 'Verified against all 9-system checks. RG59 cable integrity confirmed. Baseline locked.',
      baselineLocked: true,
      baselineLockedAt: new Date('2026-10-18T14:00:00Z'),
    },
  });

  // 6. Seed Realistic Team Earnings, Performance Bonuses, Case Penalties & Payouts
  // A. Technical Responder: Sipho Ndlovu
  await prisma.teamEarning.createMany({
    data: [
      {
        userId: sipho.id,
        type: 'EMERGENCY_CALL_OUT',
        title: 'CCTV IP Camera Sensor & NVR Diagnostics',
        description: 'Client: Bright (Sandton Core Client). Rapid response fault finding and sensor alignment.',
        reference: 'DISP-9921',
        amount: 650.00,
        date: new Date('2026-10-24T11:45:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: sipho.id,
        type: 'JOB_COMPLETION',
        title: 'Main Driveway Automated Sliding Gate Re-alignment',
        description: 'Job #job-comp-001. Photocell safety beams replaced and float battery tested.',
        reference: 'JOB-COMP-001',
        amount: 1850.00,
        date: new Date('2026-10-20T14:30:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: sipho.id,
        type: 'ASSESSMENT_FEE',
        title: 'Full Technical Property Assessment Audit Fee',
        description: 'Comprehensive 9-system hardware register & baseline lock for 77 Sunset Boulevard.',
        reference: 'TA-BRIGHT-01',
        amount: 400.00,
        date: new Date('2026-10-18T12:00:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: sipho.id,
        type: 'EMERGENCY_CALL_OUT',
        title: 'Perimeter Solar Infrared Beam & Alarm Service',
        description: 'Client: Lerato Molefe (Bryanston Estate). Dual beam transmitter replacement.',
        reference: 'DISP-9884',
        amount: 950.00,
        date: new Date('2026-08-12T10:15:00Z'),
        month: '2026-08',
        status: 'PAID',
        paidAt: new Date('2026-08-31T17:00:00Z'),
        paymentRef: 'SDA-EFT-9941',
      },
      {
        userId: sipho.id,
        type: 'ASSESSMENT_FEE',
        title: 'Commercial Property CCTV Risk & Audit Report',
        description: 'Client: Kempton Commercial Hub. Multi-channel NVR and camera angle audit.',
        reference: 'SURV-102',
        amount: 1800.00,
        date: new Date('2026-08-10T14:00:00Z'),
        month: '2026-08',
        status: 'PAID',
        paidAt: new Date('2026-08-31T17:00:00Z'),
        paymentRef: 'SDA-EFT-9941',
      },
      {
        userId: sipho.id,
        type: 'EMERGENCY_CALL_OUT',
        title: 'Security Access Control Gate Battery Swap',
        description: 'Client: Thabo Mokoena (Midrand). 12V 7Ah SLA deep-cycle battery installation.',
        reference: 'DISP-9740',
        amount: 650.00,
        date: new Date('2026-08-08T09:30:00Z'),
        month: '2026-08',
        status: 'PAID',
        paidAt: new Date('2026-08-31T17:00:00Z'),
        paymentRef: 'SDA-EFT-9941',
      },
    ],
  });

  await prisma.teamBonus.createMany({
    data: [
      {
        userId: sipho.id,
        bonusType: 'FAST_RESPONSE_SLA',
        name: 'Rapid Response SLA Bonus (<15m)',
        amount: 350.00,
        reason: 'Qualifying performance: Rapid on-site arrival within 14 minutes on Job #DISP-9921 against 15m SLA target.',
        criteriaMet: '14 min on-site arrival (SLA target: 15 min, 93.3% speed ratio)',
        dateAwarded: new Date('2026-10-24T12:00:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: sipho.id,
        bonusType: 'CUSTOMER_5STAR_RATING',
        name: 'Customer 5-Star Feedback Reward',
        amount: 100.00,
        reason: 'Client Dr. Vernon Adams (Sandhurst): "Outstanding response speed! Sipho arrived within 25 minutes and diagnosed our Centurion gate controller flawlessly."',
        criteriaMet: '5/5 Stars Verified Review Score',
        dateAwarded: new Date('2026-10-24T16:30:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: sipho.id,
        bonusType: 'CUSTOMER_5STAR_RATING',
        name: 'Customer 5-Star Feedback Reward',
        amount: 100.00,
        reason: 'Client Lerato Molefe (Bryanston Estate): "Very polite, professional security wiring repair. Left the intercom neat and tested everything twice."',
        criteriaMet: '5/5 Stars Verified Review Score',
        dateAwarded: new Date('2026-10-22T11:15:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: sipho.id,
        bonusType: 'CUSTOMER_5STAR_RATING',
        name: 'Customer 5-Star Feedback Reward',
        amount: 100.00,
        reason: 'Client Michael van Zyl (Fourways): "Fast fault finding on perimeter electric fence false triggers. Highly recommended."',
        criteriaMet: '5/5 Stars Verified Review Score',
        dateAwarded: new Date('2026-10-20T14:00:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: sipho.id,
        bonusType: 'CUSTOMER_5STAR_RATING',
        name: 'Customer 5-Star Feedback Reward',
        amount: 100.00,
        reason: 'Client Annelize Botha (Rosebank): "Fixed our CCTV infrared night-vision camera issue promptly. 5 stars well deserved."',
        criteriaMet: '5/5 Stars Verified Review Score',
        dateAwarded: new Date('2026-10-17T09:45:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: sipho.id,
        bonusType: 'CUSTOMER_5STAR_RATING',
        name: 'Customer 5-Star Feedback Reward',
        amount: 100.00,
        reason: 'Client Kagiso Khumalo (Midrand): "Prompt arrival and high technical expertise on garage door safety sensors."',
        criteriaMet: '5/5 Stars Verified Review Score',
        dateAwarded: new Date('2026-10-14T15:20:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: sipho.id,
        bonusType: 'FAST_RESPONSE_SLA',
        name: 'Rapid Response SLA Bonus (<15m)',
        amount: 500.00,
        reason: 'Qualifying performance: Rapid on-site arrival within 12 minutes on Job #DISP-9884 (August High-Priority Incident).',
        criteriaMet: '12 min on-site arrival (SLA target: 15 min, 80.0% speed ratio)',
        dateAwarded: new Date('2026-08-12T10:30:00Z'),
        month: '2026-08',
        status: 'PAID',
        isConfirmed: true,
        paidAt: new Date('2026-08-31T17:00:00Z'),
        paymentRef: 'SDA-EFT-9941',
      },
    ],
  });

  await prisma.teamPenalty.createMany({
    data: [
      {
        userId: sipho.id,
        penaltyType: 'SAFETY_AUDIT_NON_COMPLIANCE',
        caseNumber: 'CMP-2026-0814',
        amount: 100.00,
        dateApplied: new Date('2026-10-18T09:30:00Z'),
        month: '2026-10',
        reason: 'Incomplete Safety Earthing Verification',
        ruleOrIncident: 'Technician Service Agreement Clause 8.3 & SANS 10142 Safety Standard Compliance',
        explanation: 'Investigation confirmed technician did not record secondary earth spike resistance test on gate automation enclosure prior to job completion sign-off.',
        originalAmount: 3500.00,
        deductionAmount: 100.00,
        resultingBalance: 3400.00,
        status: 'CONFIRMED',
        acknowledged: true,
        acknowledgedAt: new Date('2026-10-19T09:30:00Z'),
        appealStatus: 'NONE',
      },
      {
        userId: sipho.id,
        penaltyType: 'INCORRECT_LOCATION_TIMESTAMP',
        caseNumber: 'CMP-2026-0922',
        amount: 100.00,
        dateApplied: new Date('2026-10-23T14:15:00Z'),
        month: '2026-10',
        reason: 'Arrival Notice Communication Discrepancy',
        ruleOrIncident: 'Same Day Assist Dispatch Code of Conduct § 4.1 (Accurate Location Timestamping)',
        explanation: 'Technician logged on-site status 35 minutes prior to actual physical entry through main estate security boom.',
        originalAmount: 3400.00,
        deductionAmount: 100.00,
        resultingBalance: 3300.00,
        status: 'PENDING_REVIEW',
        acknowledged: false,
        appealStatus: 'NONE',
      },
    ],
  });

  await prisma.teamPayout.create({
    data: {
      userId: sipho.id,
      payoutRef: 'SDA-EFT-9941',
      amount: 3900.00,
      date: new Date('2026-08-31T17:00:00Z'),
      month: '2026-08',
      bankAccount: 'FNB Corporate Cheque •••• 6892',
      status: 'PAID',
      periodStart: new Date('2026-08-01T00:00:00Z'),
      periodEnd: new Date('2026-08-31T23:59:59Z'),
    },
  });

  // B. Dispatcher: Operations Dispatcher Hub
  await prisma.teamEarning.createMany({
    data: [
      {
        userId: dispatcher.id,
        type: 'DISPATCH_SHIFT_ALLOWANCE',
        title: '12-Hour Operational Control Room Shift',
        description: 'Day Shift (06:00 - 18:00): Full console oversight, 14 incoming alarms orchestrated.',
        reference: 'SHIFT-2026-1024',
        amount: 850.00,
        date: new Date('2026-10-24T18:00:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: dispatcher.id,
        type: 'DISPATCH_SHIFT_ALLOWANCE',
        title: '12-Hour Operational Control Room Shift',
        description: 'Night Shift (18:00 - 06:00): Severe thunderstorm incident routing and armed backup allocation.',
        reference: 'SHIFT-2026-1022',
        amount: 850.00,
        date: new Date('2026-10-22T06:00:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: dispatcher.id,
        type: 'DISPATCH_SHIFT_ALLOWANCE',
        title: '12-Hour Operational Control Room Shift',
        description: 'Day Shift (06:00 - 18:00): Standard dispatch operations and responder tracking.',
        reference: 'SHIFT-2026-1020',
        amount: 850.00,
        date: new Date('2026-10-20T18:00:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: dispatcher.id,
        type: 'JOB_COMPLETION',
        title: 'Armed Emergency Dispatch Coordination #EMG-902',
        description: 'Rapid routing to Sandton Core sector; responder on scene in 13 minutes.',
        reference: 'COORD-EMG-902',
        amount: 120.00,
        date: new Date('2026-10-24T12:00:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: dispatcher.id,
        type: 'JOB_COMPLETION',
        title: 'Armed Emergency Dispatch Coordination #EMG-887',
        description: 'Rapid routing to Bryanston sector; responder on scene in 14 minutes.',
        reference: 'COORD-EMG-887',
        amount: 120.00,
        date: new Date('2026-10-23T15:30:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: dispatcher.id,
        type: 'JOB_COMPLETION',
        title: 'Electrical Responder Dispatch Coordination #ELC-402',
        description: 'Power trip isolation dispatch to Rosebank sector.',
        reference: 'COORD-ELC-402',
        amount: 120.00,
        date: new Date('2026-10-20T10:15:00Z'),
        month: '2026-10',
        status: 'CONFIRMED',
      },
      {
        userId: dispatcher.id,
        type: 'DISPATCH_SHIFT_ALLOWANCE',
        title: '12-Hour Operational Control Room Shift (September Close)',
        description: 'Consolidated end-of-month weekend shift.',
        reference: 'SHIFT-2026-0930',
        amount: 850.00,
        date: new Date('2026-09-30T18:00:00Z'),
        month: '2026-09',
        status: 'PAID',
        paidAt: new Date('2026-10-02T10:00:00Z'),
        paymentRef: 'SDA-EFT-8120',
      },
    ],
  });

  await prisma.teamBonus.createMany({
    data: [
      {
        userId: dispatcher.id,
        bonusType: 'DISPATCHER_SPEED_SLA',
        name: 'Ultra-Fast Dispatch SLA Bonus (<3m)',
        amount: 100.00,
        reason: 'Dispatcher assigned armed responder within 95 seconds of alarm verification on Job #EMG-902.',
        criteriaMet: '95s assignment latency (Target: <180s)',
        dateAwarded: new Date('2026-10-24T12:05:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
      {
        userId: dispatcher.id,
        bonusType: 'DISPATCHER_SPEED_SLA',
        name: 'Ultra-Fast Dispatch SLA Bonus (<3m)',
        amount: 100.00,
        reason: 'Dispatcher assigned responder within 110 seconds on Job #EMG-887.',
        criteriaMet: '110s assignment latency (Target: <180s)',
        dateAwarded: new Date('2026-10-23T15:35:00Z'),
        month: '2026-10',
        status: 'APPROVED',
        isConfirmed: true,
      },
    ],
  });

  await prisma.teamPenalty.create({
    data: {
      userId: dispatcher.id,
      penaltyType: 'SLA_BREACH',
      caseNumber: 'CMP-2026-DISP-01',
      amount: 150.00,
      dateApplied: new Date('2026-10-21T16:00:00Z'),
      month: '2026-10',
      reason: 'Missed High-Priority Alarm Queue Timeout (>5m)',
      ruleOrIncident: 'Control Room Standard Operating Procedure § 2.2: Mandatory 300-Second Alarm Routing Window',
      explanation: 'Console log analysis revealed priority alarm remained unassigned for 380 seconds during shift handover.',
      originalAmount: 2910.00,
      deductionAmount: 150.00,
      resultingBalance: 2760.00,
      status: 'CONFIRMED',
      acknowledged: true,
      acknowledgedAt: new Date('2026-10-22T08:00:00Z'),
      appealStatus: 'NONE',
    },
  });

  await prisma.teamPayout.create({
    data: {
      userId: dispatcher.id,
      payoutRef: 'SDA-EFT-8120',
      amount: 850.00,
      date: new Date('2026-10-02T10:00:00Z'),
      month: '2026-09',
      bankAccount: 'Standard Bank Current •••• 4190',
      status: 'PAID',
      periodStart: new Date('2026-09-01T00:00:00Z'),
      periodEnd: new Date('2026-09-30T23:59:59Z'),
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
