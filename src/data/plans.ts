export interface MembershipPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualBenefit: number;
  partsBenefitDescription: string;
  badge?: string;
  description: string;
  benefits: string[];
  limitations: string[];
  whatYouReceive: string[];
  isPartsBenefitZero?: boolean;
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'assist',
    name: 'Assist',
    monthlyPrice: 799,
    annualBenefit: 0,
    partsBenefitDescription: 'R0 Parts Benefit',
    badge: 'Essential Labour',
    description: 'Rapid emergency response, fault finding, and certified technician labour for cost-conscious members.',
    benefits: [
      'Same-day assistance',
      'Labour & fault finding',
      "Parts & replacements on member's account",
    ],
    limitations: [
      'R0 Parts Benefit — all parts, spares, and hardware replacements are billed to the member account',
      'Does not provide an annual monetary benefit allowance for hardware',
    ],
    whatYouReceive: [
      'Immediate priority dispatch for emergency callouts',
      '100% covered labor and diagnostics for fault finding',
      'Itemised trade invoices for approved hardware replacements',
    ],
    isPartsBenefitZero: true,
  },
  {
    id: 'assist_plus',
    name: 'Assist Plus',
    monthlyPrice: 1499,
    annualBenefit: 15000,
    partsBenefitDescription: 'R15,000 / year',
    badge: 'Most Popular',
    description: 'Ideal for standard residential homes needing emergency coverage and parts allowance.',
    benefits: [
      'Same-day assistance',
      'Repairs & replacements up to R15,000 per year',
      'Electrical & plumbing when introduced',
    ],
    limitations: [
      'Benefit capped at R15,000 per 12-month membership period',
      'Costs exceeding R15,000 are the responsibility of the member',
    ],
    whatYouReceive: [
      'Up to R15,000 annual assistance benefit for parts and repairs',
      'Priority certified contractor dispatch',
      'Zero co-pay on services covered within your annual benefit balance',
    ],
  },
  {
    id: 'assist_pro',
    name: 'Assist Pro',
    monthlyPrice: 2999,
    annualBenefit: 40000,
    partsBenefitDescription: 'R40,000 / year',
    badge: 'Comprehensive',
    description: 'Enhanced coverage for larger homes and complex residential security infrastructure.',
    benefits: [
      'Same-day assistance',
      'Repairs & replacements up to R40,000 per year',
      'Electrical & plumbing when introduced',
    ],
    limitations: [
      'Benefit capped at R40,000 per 12-month membership period',
      'Costs exceeding R40,000 are the responsibility of the member',
    ],
    whatYouReceive: [
      'Up to R40,000 annual assistance benefit for repairs and components',
      'Guaranteed same-day SLA response',
      'Full electrical, plumbing & security system diagnostics',
    ],
  },
  {
    id: 'assist_elite',
    name: 'Assist Elite',
    monthlyPrice: 3499,
    annualBenefit: 60000,
    partsBenefitDescription: 'R60,000 / year',
    badge: 'Executive',
    description: 'Premium protection designed for high-value properties and multi-system installations.',
    benefits: [
      'Same-day assistance',
      'Repairs & replacements up to R60,000 per year',
      'Electrical & plumbing when introduced',
    ],
    limitations: [
      'Benefit capped at R60,000 per 12-month membership period',
      'Costs exceeding R60,000 are the responsibility of the member',
    ],
    whatYouReceive: [
      'Up to R60,000 annual assistance benefit allowance',
      'VIP dispatch routing and rapid response priority',
      'Full coverage of replacement automation motors, boards, and sensors',
    ],
  },
  {
    id: 'residential_advanced',
    name: 'Residential Advanced',
    monthlyPrice: 4999,
    annualBenefit: 80000,
    partsBenefitDescription: 'R80,000 / year',
    badge: 'Estate Living',
    description: 'Extensive annual allowance for luxury estates, multi-building residences, and farms.',
    benefits: [
      'Same-day assistance',
      'Repairs & replacements up to R80,000 per year',
      'Electrical & plumbing when introduced',
    ],
    limitations: [
      'Benefit capped at R80,000 per 12-month membership period',
      'Costs exceeding R80,000 are the responsibility of the member',
    ],
    whatYouReceive: [
      'Up to R80,000 annual assistance benefit allowance',
      'Multi-structure perimeter, CCTV, and electrical response',
      'Dedicated operations management support',
    ],
  },
  {
    id: 'business_advanced',
    name: 'Business Advanced',
    monthlyPrice: 8999,
    annualBenefit: 150000,
    partsBenefitDescription: 'R150,000 / year',
    badge: 'Commercial Enterprise',
    description: 'Maximum coverage for commercial facilities, offices, retail centres, and industrial operations.',
    benefits: [
      'Same-day assistance',
      'Repairs & replacements up to R150,000 per year',
      'Electrical & plumbing when introduced',
    ],
    limitations: [
      'Benefit capped at R150,000 per 12-month membership period',
      'Costs exceeding R150,000 are the responsibility of the business',
    ],
    whatYouReceive: [
      'Up to R150,000 annual assistance benefit allowance',
      'Commercial access control, perimeter, and power assistance',
      'Custom corporate billing and consolidated monthly reporting',
    ],
  },
];

export const PLANS = MEMBERSHIP_PLANS;

export function getPlan(id: string): MembershipPlan {
  const norm = (id || '').toLowerCase().replace(/[\s-]/g, '_');
  return MEMBERSHIP_PLANS.find(p => p.id === norm) || MEMBERSHIP_PLANS[1];
}

