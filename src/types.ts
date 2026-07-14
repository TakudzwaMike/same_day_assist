/**
 * Same Day Assist - Production Type Definitions
 * Represents the normalized database schema, user roles, and customer journey.
 */

export type ServiceCategory = 'Security' | 'Electrical' | 'Plumbing' | 'Construction';

export type UserRole = 'Customer' | 'Contractor' | 'Administrator' | 'Super Administrator';

export type JourneyStep =
  | 'PROSPECT'                // 1. Prospective customer
  | 'INTERESTED'              // 2. "I'm Interested" (Enquiry submitted)
  | 'ENQUIRY_RECEIVED'        // 3. Administrator receives enquiry
  | 'ASSESSMENT_SCHEDULED'    // 4. Property Assessment scheduled
  | 'CONTRACTOR_ASSESSING'    // 5. Contractor Assessment active
  | 'ASSESSMENT_UPLOADED'     // 6. Assessment uploaded
  | 'QUOTE_GENERATED'         // 7. Quotation generated
  | 'CUSTOMER_APPROVED'       // 8. Customer approval of quote
  | 'REPAIRS_COMPLETED'       // 9. Onboarding repairs completed
  | 'MEMBERSHIP_ACTIVATED'    // 10. Membership activated (Active member!)
  | 'CUSTOMER_LOGIN'          // 11. Customer logged in to member portal
  | 'REQUEST_ASSISTANCE'      // 12. Request Assistance created
  | 'JOB_CARD_CREATED'        // 13. Job Card Created
  | 'CONTRACTOR_ASSIGNED'     // 14. Contractor Assigned
  | 'LIVE_JOB_UPDATES'        // 15. Live Job Updates (In Route / Arrived / Working)
  | 'COMPLETION_REPORT'       // 16. Completion Report submitted with signature
  | 'CUSTOMER_RATING'         // 17. Customer Rating submitted
  | 'JOB_CLOSED';             // 18. Job Closed

export interface Enquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  serviceCategory: ServiceCategory;
  notes: string;
  status: 'Pending' | 'Scheduled' | 'Assessed' | 'Quoted' | 'Approved' | 'Completed';
  createdAt: string;
}

export interface Assessment {
  id: string;
  enquiryId: string;
  contractorId: string;
  scheduledAt: string;
  completedAt?: string;
  issuesFound: string[];
  photoUrl?: string;
  videoUrl?: string;
  estimatedCost: number;
  status: 'Scheduled' | 'Assessing' | 'Uploaded';
  contractorNotes?: string;
}

export interface LineItem {
  id: string;
  description: string;
  cost: number;
}

export interface Quotation {
  id: string;
  enquiryId: string;
  amount: number;
  lineItems: LineItem[];
  status: 'Pending' | 'Approved' | 'Declined';
  createdAt: string;
  approvedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'Onboarding' | 'Active' | 'Inactive';
  package: 'Gold' | 'Platinum' | 'Diamond';
  memberSince?: string;
  repairsCount: number;
  totalPaid: number;
}

export interface Contractor {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  specialty: ServiceCategory;
  isAvailable: boolean;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: ServiceCategory;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  assignedContractorId?: string;
  status: 'Requested' | 'Assigned' | 'InRoute' | 'Arrived' | 'Completed' | 'Rated' | 'Closed';
  trackerProgress: number; // 0 to 100 for live animation
  rating?: number;
  ratingComment?: string;
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  closedAt?: string;
  contractorNotes?: string;
  contractorSignature?: string; // Base64 digital signature
  completionPhoto?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userType: UserRole;
  action: string;
  details: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  type: 'Onboarding Fee' | 'Monthly Premium' | 'Assistance Co-pay';
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  benefits: string[];
}

export interface AppState {
  currentStep: JourneyStep;
  enquiries: Enquiry[];
  assessments: Assessment[];
  quotations: Quotation[];
  customers: Customer[];
  contractors: Contractor[];
  jobs: Job[];
  payments: Payment[];
  auditLogs: AuditLog[];
  selectedRole: UserRole;
  currentUserId: string; // Active logged-in context
  isLoggedIn?: boolean;
}
