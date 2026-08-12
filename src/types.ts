/**
 * Same Day Assist - Enterprise Type Definitions
 * Service-agnostic platform supporting Security, Emergency & Mobility, Home & Facility, and Maintenance.
 */

export type ServiceCategory =
  | 'Security Services'
  | 'Security Systems Assistance'
  | 'Solar Systems Assistance'
  | 'Electrical Assistance'
  | 'Plumbing Assistance'
  | 'Armed Response'
  | 'VIP Protection'
  | 'Event Security'
  | 'Alarm Response'
  | 'CCTV Monitoring'
  | 'Guarding Services'
  | 'Patrol Services'
  | 'Cleaning Services'
  | 'Plumbing'
  | 'Electrical Services'
  | 'Locksmith Services'
  | 'Towing Services'
  | 'Roadside Assistance'
  | 'Medical Assistance'
  | 'Emergency Home Assistance'
  | 'Maintenance Services';

export type UserRole = 'Customer' | 'Contractor' | 'Dispatcher' | 'Administrator' | 'Super Administrator';

export type JobStatus =
  | 'Request Received'
  | 'Request Under Review'
  | 'Service Provider Assigned'
  | 'Preparing for Dispatch'
  | 'Dispatched'
  | 'En Route'
  | 'Arrived'
  | 'Service In Progress'
  | 'Service Completed';

export interface SavedLocation {
  id: string;
  userId: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  accessNotes?: string;
  createdAt: string;
}

export interface AuthorisedContact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  permissions: 'Full' | 'Dispatch Only' | 'Billing Only';
  createdAt: string;
}

export interface ProfileUpdateRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  proposedChanges: Record<string, any>;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface JobRating {
  id: string;
  jobId: string;
  customerId: string;
  contractorId: string;
  professionalism: number;
  punctuality: number;
  responseTime: number;
  communication: number;
  qualityOfWork: number;
  friendliness: number;
  problemResolution: number;
  overallSatisfaction: number;
  writtenFeedback?: string;
  photoBeforeUrl?: string;
  photoAfterUrl?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  senderRole: 'Customer' | 'Contractor' | 'Dispatcher' | 'Administrator';
  text: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'TopUp' | 'Payment' | 'Refund' | 'Bonus Reward';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface ProviderAward {
  id: string;
  contractorId: string;
  title: string;
  category: string;
  iconName: string;
  awardedAt: string;
}

export interface ContractorVerificationPayload {
  yearsOfExperience: number;
  businessLicenseUrl?: string;
  taxClearanceUrl?: string;
  insuranceProofUrl?: string;
  policeClearanceUrl?: string;
  tradeQualificationsUrl?: string;
  coverageAreas: string[];
}


export interface OnboardingPayload {
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  idNumber?: string;
  accountType: 'Individual' | 'Business';
  companyName?: string;
  companyRegNumber?: string;
  vatNumber?: string;
  industry?: string;
  address: string;
  preferredContactMethod: 'Email' | 'SMS' | 'WhatsApp' | 'Push';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredServices: ServiceCategory[];
  communicationPreferences?: {
    marketing: boolean;
    smsAlerts: boolean;
    emailInvoices: boolean;
  };
  password: string;
  savedLocations?: Array<{
    label: string;
    address: string;
    lat: number;
    lng: number;
    accessNotes?: string;
  }>;
}

export type CustomerStatus =
  | 'APPLICATION_STARTED'
  | 'APPLICATION_SUBMITTED'
  | 'WAITING_FOR_SURVEY'
  | 'SURVEY_ASSIGNED'
  | 'SURVEY_SCHEDULED'
  | 'SURVEY_IN_PROGRESS'
  | 'SURVEY_COMPLETED'
  | 'ADMIN_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_APPROVED'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'WAITING_FOR_ACTIVATION'
  | 'ACTIVE';

export interface SurveyReport {
  id: string;
  enquiryId: string;
  customerId?: string;
  customerName?: string;
  inspectorId: string;
  inspectorName: string;
  propertyAssessment: string;
  safetyObservations: string;
  complianceObservations: string;
  existingSystems: string;
  risksIdentified: string;
  recommendedActions: string;
  photos: string[];
  recommendation: 'RECOMMEND_APPROVAL' | 'RECOMMEND_REVISION' | 'RECOMMEND_REJECT';
  inspectionDate: string;
  submittedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  idNumber?: string;
  accountType?: 'Individual' | 'Business';
  companyName?: string;
  companyRegNumber?: string;
  vatNumber?: string;
  secondaryPhone?: string;
  preferredContactMethod?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  lastProfileUpdateAt?: string;
  status: CustomerStatus | 'Onboarding' | 'Active' | 'Suspended' | 'Expired';
  onboardingStatus?: CustomerStatus;
  surveyRequested?: boolean;
  surveyInspectorId?: string;
  surveyInspectorName?: string;
  surveyScheduledDate?: string;
  surveyReport?: SurveyReport;
  adminReviewNotes?: string;
  initialPaymentAmount?: number;
  initialPaymentPaidAt?: string;
  activationScheduledDate?: string;
  package: 'Gold' | 'Platinum' | 'Diamond';
  memberSince?: string;
  repairsCount: number;
  totalPaid: number;
  savedLocations?: SavedLocation[];
  authorisedContacts?: AuthorisedContact[];
}

export interface Contractor {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  specialty: ServiceCategory | string;
  isAvailable: boolean;
  verificationStatus?: 'Pending Review' | 'Approved' | 'Information Requested' | 'Rejected';
  verificationNotes?: string;
  verifiedAt?: string;
  yearsOfExperience?: number;
  businessLicenseUrl?: string;
  taxClearanceUrl?: string;
  insuranceProofUrl?: string;
  policeClearanceUrl?: string;
  tradeQualificationsUrl?: string;
  coverageAreaJson?: string;
  badgeTitles?: string[];
  isFeatured?: boolean;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  providerAwards?: ProviderAward[];
}

export interface VehicleInfo {
  make: string;
  model: string;
  licensePlate: string;
  color: string;
}

export interface Job {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceType: ServiceCategory | string;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  assignedContractorId?: string;
  assignedContractor?: {
    id: string;
    name: string;
    phone: string;
    specialty?: string;
    rating?: number;
  };
  status: JobStatus | string;
  trackerProgress: number; // 0 to 100
  vehicleInfo?: VehicleInfo;
  currentLat?: number;
  currentLng?: number;
  estimatedArrivalMinutes?: number;
  distanceRemainingKm?: number;

  // Live Milestone Photos
  photoBeforeUrl?: string;
  photoDuringUrl?: string;
  photoAfterUrl?: string;

  rating?: number;
  ratingComment?: string;
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  closedAt?: string;
  contractorNotes?: string;
  contractorSignature?: string;
  completionPhoto?: string;
  jobRatings?: JobRating[];
  chatMessages?: ChatMessage[];
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

export interface Enquiry {
  id: string;
  customerId?: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  accountType?: 'Individual' | 'Business';
  serviceCategory: ServiceCategory | string;
  notes: string;
  status: CustomerStatus | 'Pending' | 'Scheduled' | 'Assessed' | 'Quoted' | 'Approved' | 'Completed';
  surveyRequested?: boolean;
  surveyInspectorId?: string;
  surveyInspectorName?: string;
  surveyScheduledDate?: string;
  surveyReport?: SurveyReport;
  adminReviewNotes?: string;
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

export type JourneyStep =
  | 'PROSPECT'
  | 'INTERESTED'
  | 'ENQUIRY_RECEIVED'
  | 'ASSESSMENT_SCHEDULED'
  | 'CONTRACTOR_ASSESSING'
  | 'ASSESSMENT_UPLOADED'
  | 'QUOTE_GENERATED'
  | 'CUSTOMER_APPROVED'
  | 'REPAIRS_COMPLETED'
  | 'MEMBERSHIP_ACTIVATED'
  | 'CUSTOMER_LOGIN'
  | 'REQUEST_ASSISTANCE'
  | 'JOB_CARD_CREATED'
  | 'CONTRACTOR_ASSIGNED'
  | 'LIVE_JOB_UPDATES'
  | 'COMPLETION_REPORT'
  | 'CUSTOMER_RATING'
  | 'JOB_CLOSED';

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
  currentUserId: string;
  isLoggedIn?: boolean;
}


