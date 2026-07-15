import { Contractor, ServicePackage, Enquiry, Customer, AuditLog } from '../types';

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-gold',
    name: 'Gold Assist Shield',
    price: 349,
    benefits: [
      'Covers Security (Access Control, Alarm Systems)',
      'Covers Electrical emergency response',
      '24/7 Priority Emergency Panic Button',
      'Maximum 45-minute response time SLA',
      'Up to 3 callouts per year with R0 co-payment'
    ]
  },
  {
    id: 'pkg-platinum',
    name: 'Platinum Assist Elite',
    price: 599,
    benefits: [
      'Covers Security, Electrical, and Plumbing',
      'Includes Electric Fence & Gate Automation assessment',
      '24/7 Dedicated Dispatcher access',
      'Maximum 30-minute response time SLA',
      'Up to 6 callouts per year with R0 co-payment',
      'Annual preventative safety assessment'
    ]
  },
  {
    id: 'pkg-diamond',
    name: 'Diamond Assist Infinite',
    price: 999,
    benefits: [
      'Full coverage: Security, Electrical, Plumbing & Construction',
      'Covers CCTV, Garage Automation, Video & Audio Intercoms',
      'Guaranteed 15-minute emergency security response SLA',
      'Unlimited callouts with premium parts replacement guarantee',
      'Semi-annual full physical structural & risk assessment',
      'VIP priority staging on multi-disaster event schedules'
    ]
  }
];

export const INITIAL_CONTRACTORS: Contractor[] = [
  {
    id: 'con-001',
    name: 'Sipho Ndlovu',
    phone: '+27 82 555 0192',
    email: 'sipho.ndlovu@samedayassist.co.za',
    rating: 4.9,
    specialty: 'Security',
    isAvailable: true,
    location: {
      lat: 35,
      lng: 40,
      address: 'Sandton Core, JHB'
    }
  },
  {
    id: 'con-002',
    name: 'Jan de Klerk',
    phone: '+27 71 555 3049',
    email: 'jan.deklerk@samedayassist.co.za',
    rating: 4.8,
    specialty: 'Electrical',
    isAvailable: true,
    location: {
      lat: 60,
      lng: 25,
      address: 'Rosebank Central, JHB'
    }
  },
  {
    id: 'con-003',
    name: 'Sarah Naidoo',
    phone: '+27 83 555 4920',
    email: 'sarah.naidoo@samedayassist.co.za',
    rating: 4.7,
    specialty: 'Plumbing',
    isAvailable: true,
    location: {
      lat: 20,
      lng: 65,
      address: 'Midrand Industrial, JHB'
    }
  },
  {
    id: 'con-004',
    name: 'Marcus Nkosi',
    phone: '+27 76 555 9321',
    email: 'marcus.nkosi@samedayassist.co.za',
    rating: 4.9,
    specialty: 'Construction',
    isAvailable: true,
    location: {
      lat: 75,
      lng: 70,
      address: 'Randburg North, JHB'
    }
  }
];

export const INITIAL_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-101',
    customerName: 'Lerato Molefe',
    email: 'lerato@molefefamily.co.za',
    phone: '+27 82 123 4567',
    address: '12 West Street, Sandown, Sandton',
    serviceCategory: 'Security',
    notes: 'Interested in the Diamond package. Need CCTV, Alarm Systems, and Electric Fence assessed for my home.',
    status: 'Pending',
    createdAt: '2026-07-07T08:30:00Z'
  },
  {
    id: 'enq-102',
    customerName: 'David Harrison',
    email: 'david.h@harrisonlaw.co.za',
    phone: '+27 83 987 6543',
    address: '45 Rivonia Road, Morningside, Sandton',
    serviceCategory: 'Electrical',
    notes: 'Inquiring about Platinum. Frequent power surges and need automated gate assessment.',
    status: 'Scheduled',
    createdAt: '2026-07-06T14:15:00Z'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-201',
    name: 'Lerato Molefe',
    email: 'lerato@molefefamily.co.za',
    phone: '+27 82 123 4567',
    address: '12 West Street, Sandown, Sandton',
    status: 'Onboarding',
    package: 'Diamond',
    repairsCount: 0,
    totalPaid: 0
  },
  {
    id: 'cust-202',
    name: 'Thabo Mokoena',
    email: 'thabo@mokoenaholdings.com',
    phone: '+27 72 456 7890',
    address: '88 Grayston Drive, Sandton',
    status: 'Active',
    package: 'Platinum',
    memberSince: '2026-01-15',
    repairsCount: 2,
    totalPaid: 3594
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-07-07T08:30:00Z',
    userType: 'Customer',
    action: 'Enquiry Created',
    details: 'Customer Lerato Molefe submitted an online enquiry for Security assessment.'
  },
  {
    id: 'log-002',
    timestamp: '2026-07-07T09:00:00Z',
    userType: 'Administrator',
    action: 'Enquiry Received',
    details: 'System registered and queued Lerato Molefe\'s enquiry for property assessment.'
  }
];
