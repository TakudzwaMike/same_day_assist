import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
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
      status: 'Onboarding',
      package: 'Diamond',
      repairsCount: 0,
      totalPaid: 0,
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

  // 5. Super Administrator (Developer)
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

  // Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        id: 'log-001',
        timestamp: new Date('2026-07-07T08:30:00Z'),
        userType: 'Customer',
        action: 'Enquiry Created',
        details: 'Customer Lerato Molefe submitted an online enquiry for Security assessment.',
      },
      {
        id: 'log-002',
        timestamp: new Date('2026-07-07T09:00:00Z'),
        userType: 'Administrator',
        action: 'Enquiry Received',
        details: 'System registered and queued Lerato Molefe\'s enquiry for property assessment.',
      },
    ],
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
