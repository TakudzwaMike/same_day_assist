import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_URL && !metaEnv.VITE_API_URL.includes('loca.lt')) {
    return metaEnv.VITE_API_URL;
  }
  if (Capacitor.isNativePlatform()) {
    return 'http://10.0.2.2:5000/api';
  }
  return '/api';
};

const BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('sda_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('sda_refresh_token');
  }

  private setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('sda_access_token', accessToken);
    if (refreshToken) localStorage.setItem('sda_refresh_token', refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('sda_access_token');
    localStorage.removeItem('sda_refresh_token');
    localStorage.removeItem('sda_user');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const { accessToken } = await res.json();
        this.setTokens(accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const maxRetries = 3;
    let delay = 1000;
    let res: Response | null = null;
    let fetchError: any = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        fetchError = null;
        if (res.ok || res.status < 500) {
          break;
        }
      } catch (err: any) {
        fetchError = err;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    if (fetchError) {
      throw new Error('Connection failed. Please check your network connection.');
    }

    if (!res) {
      throw new Error('No response received from the server.');
    }

    const currentToken = this.getToken();
    const isDemoToken = Boolean(currentToken && currentToken.startsWith('demo-token-'));

    if (res.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      if (!isDemoToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        } else {
          this.clearTokens();
          window.location.href = '/';
          throw new Error('Your session has expired. Please log in again.');
        }
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const serverMsg = data.error;
      switch (res.status) {
        case 401:
          throw new Error(serverMsg || 'Authentication required. Please log in.');
        case 403:
          throw new Error(serverMsg || 'Access denied. You do not have permissions for this action.');
        case 404:
          throw new Error(serverMsg || 'The requested resource could not be found.');
        case 409:
          throw new Error(serverMsg || 'A conflict occurred. This record may already exist.');
        case 422:
          throw new Error(serverMsg || 'Validation failed. Please verify your input data.');
        case 429:
          throw new Error(serverMsg || 'Too many requests. Please try again in a few minutes.');
        case 500:
        default:
          throw new Error(serverMsg || 'The operations center server experienced an internal issue.');
      }
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('sda_user', JSON.stringify(data.user));
    return data.user;
  }

  async register(payload: {
    name: string; email: string; phone: string; address: string;
    serviceCategory?: string; notes?: string; password: string; role?: string; adminSecret?: string;
  }) {
    const data = await this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ role: 'Customer', serviceCategory: 'Security', ...payload }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('sda_user', JSON.stringify(data.user));
    return data.user;
  }

  async onboarding(payload: any) {
    const data = await this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('sda_user', JSON.stringify(data.user));
    return data.user;
  }

  async updateProfile(updates: any) {
    return this.request<{ pendingApproval: boolean; user?: any; message?: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getNotificationPreferences() {
    return this.request<{
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
      serviceUpdates: boolean;
      paymentAlerts: boolean;
      securityAlerts: boolean;
    }>('/auth/notifications');
  }

  async updateNotificationPreferences(payload: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    serviceUpdates?: boolean;
    paymentAlerts?: boolean;
    securityAlerts?: boolean;
  }) {
    return this.request<{
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
      serviceUpdates: boolean;
      paymentAlerts: boolean;
      securityAlerts: boolean;
    }>('/auth/notifications', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateThemePreference(theme: 'dark' | 'light') {
    return this.request<{ theme: string; message: string }>('/auth/theme', {
      method: 'PATCH',
      body: JSON.stringify({ theme }),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Saved Locations
  async getSavedLocations() { return this.request<any[]>('/locations'); }
  async addSavedLocation(data: { label: string; address: string; lat: number; lng: number; accessNotes?: string }) {
    return this.request<any>('/locations', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateSavedLocation(id: string, data: { label?: string; address?: string; lat?: number; lng?: number; accessNotes?: string }) {
    return this.request<any>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteSavedLocation(id: string) {
    return this.request<{ success: boolean }>(`/locations/${id}`, { method: 'DELETE' });
  }

  // Authorised Contacts
  async getAuthorisedContacts() { return this.request<any[]>('/contacts'); }
  async addAuthorisedContact(data: { name: string; email: string; phone: string; position: string; permissions?: string }) {
    return this.request<any>('/contacts', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteAuthorisedContact(id: string) {
    return this.request<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' });
  }

  // Profile Requests (Admin)
  async getProfileRequests() { return this.request<any[]>('/profile-requests'); }
  async approveProfileRequest(id: string) {
    return this.request<{ success: boolean }>(`/profile-requests/${id}/approve`, { method: 'POST' });
  }
  async rejectProfileRequest(id: string, rejectionReason?: string) {
    return this.request<{ success: boolean }>(`/profile-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejectionReason }) });
  }
  async overrideProfileLock(userId: string) {
    return this.request<{ success: boolean; message: string }>(`/profile-requests/override-lock/${userId}`, { method: 'POST' });
  }

  // Live GPS stream update
  async updateJobLocation(jobId: string, payload: { lat: number; lng: number; estimatedArrivalMinutes?: number; distanceRemainingKm?: number }) {
    return this.request<{ success: boolean }>(`/jobs/${jobId}/location`, { method: 'PATCH', body: JSON.stringify(payload) });
  }


  // Enquiries
  async getEnquiries() { return this.request<any[]>('/enquiries'); }
  async scheduleAssessment(enquiryId: string, contractorId: string) {
    return this.request(`/enquiries/${enquiryId}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ contractorId }),
    });
  }

  // Assessments
  async getMyAssessments() { return this.request<any[]>('/assessments/my'); }
  async startAssessment(id: string) {
    return this.request(`/assessments/${id}/start`, { method: 'PATCH' });
  }
  async uploadAssessment(id: string, payload: any) {
    return this.request(`/assessments/${id}/upload`, { method: 'POST', body: JSON.stringify(payload) });
  }

  // Quotations
  async getMyQuotations() { return this.request<any[]>('/quotations/my'); }
  async getAllQuotations() { return this.request<any[]>('/quotations'); }
  async createQuotation(payload: any) {
    return this.request('/quotations', { method: 'POST', body: JSON.stringify(payload) });
  }
  async approveQuotation(id: string) {
    return this.request(`/quotations/${id}/approve`, { method: 'PATCH' });
  }
  async declineQuotation(id: string) {
    return this.request(`/quotations/${id}/decline`, { method: 'PATCH' });
  }

  // Vehicles
  async getVehicles() { return this.request<any[]>('/vehicles'); }
  async addVehicle(data: { make: string; model: string; year?: number | string; licensePlate: string; color?: string; vinNumber?: string; notes?: string }) {
    return this.request<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateVehicle(id: string, data: any) {
    return this.request<any>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteVehicle(id: string) {
    return this.request<{ success: boolean; message: string }>(`/vehicles/${id}`, { method: 'DELETE' });
  }

  // Jobs
  async getMyJobs() { return this.request<any[]>('/jobs/my'); }
  async getAllJobs() { return this.request<any[]>('/jobs'); }
  async createJob(payload: any) {
    return this.request('/jobs', { method: 'POST', body: JSON.stringify(payload) });
  }
  async createEmergencyNonMemberJob(payload: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    serviceType: string;
    description: string;
    urgency?: string;
    additionalNotes?: string;
    consentAgreed?: boolean;
    photoUrl?: string;
  }) {
    return this.request<{ success: boolean; message: string; job: any; callOutFee?: number }>('/jobs/emergency-non-member', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async getEmergencyNonMemberJob(id: string) {
    return this.request<any>(`/jobs/emergency-non-member/${id}`);
  }
  async setJobServiceAmount(jobId: string, payload: { finalAmount: number; servicePerformed?: string; status?: string }) {
    return this.request<any>(`/jobs/${jobId}/service-amount`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
  async payEmergencyService(jobId: string, payload: { 
    paymentMethod?: string; 
    cardLast4?: string;
    transactionRef?: string;
    gatewayReference?: string;
    simulateFailure?: boolean;
  }) {
    return this.request<{ success: boolean; message: string; payment: any; invoice?: any; job: any }>(`/jobs/emergency-non-member/${jobId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async assignContractor(jobId: string, contractorId: string) {
    return this.request(`/jobs/${jobId}/assign`, { method: 'PATCH', body: JSON.stringify({ contractorId }) });
  }
  async updateJobStatus(jobId: string, status: string) {
    return this.request(`/jobs/${jobId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }
  async updateLocation(jobId: string, lat: number, lng: number) {
    return this.request(`/jobs/${jobId}/location`, { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
  }
  async completeJob(jobId: string, payload: any) {
    return this.request(`/jobs/${jobId}/complete`, { method: 'POST', body: JSON.stringify(payload) });
  }
  async rateJob(jobId: string, rating: number, ratingComment?: string) {
    return this.request(`/jobs/${jobId}/rate`, { method: 'POST', body: JSON.stringify({ rating, ratingComment }) });
  }
  async closeJob(jobId: string) {
    return this.request(`/jobs/${jobId}/close`, { method: 'PATCH' });
  }

  // Payments
  async getAllPayments() { return this.request<any[]>('/payments'); }
  async initiatePayment(type: string, amount: number) {
    return this.request<any>('/payments/initiate', { method: 'POST', body: JSON.stringify({ type, amount }) });
  }

  // Reports
  async getDashboard() { return this.request<any>('/reports/dashboard'); }
  async getContractorReport() { return this.request<any[]>('/reports/contractors'); }
  async getRevenueReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.request<any>(`/reports/revenue?${params}`);
  }
  async getCustomerTimeline(customerId: string) {
    return this.request<any>(`/reports/customers/${customerId}/timeline`);
  }

  // Audit Logs
  async getAuditLogs(params?: { limit?: number; offset?: number; action?: string }) {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.action) qs.set('action', params.action);
    return this.request<any>(`/audit-logs?${qs}`);
  }

  // File upload
  async uploadFile(file: File, meta?: { jobId?: string; assessmentId?: string; quotationId?: string; customerId?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (meta?.jobId) formData.append('jobId', meta.jobId);
    if (meta?.assessmentId) formData.append('assessmentId', meta.assessmentId);
    if (meta?.quotationId) formData.append('quotationId', meta.quotationId);
    if (meta?.customerId) formData.append('customerId', meta.customerId);

    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  // PDF downloads
  getPDFUrl(type: 'quotation' | 'invoice' | 'completion', id: string): string {
    return `${BASE_URL}/pdf/${type}/${id}`;
  }

  // Get cached user
  getCachedUser() {
    const u = localStorage.getItem('sda_user');
    return u ? JSON.parse(u) : null;
  }

  // Contractor Verification & Compliance
  async applyVerification(payload: any) {
    return this.request<any>('/verification/apply', { method: 'POST', body: JSON.stringify(payload) });
  }
  async getVerificationApplications() {
    return this.request<any[]>('/verification/applications');
  }
  async approveVerification(contractorId: string) {
    return this.request<any>(`/verification/${contractorId}/approve`, { method: 'POST' });
  }
  async requestVerificationInfo(contractorId: string, notes: string) {
    return this.request<any>(`/verification/${contractorId}/request-info`, { method: 'POST', body: JSON.stringify({ notes }) });
  }
  async rejectVerification(contractorId: string, reason: string) {
    return this.request<any>(`/verification/${contractorId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  }
  async awardProviderBadge(contractorId: string, payload: { title: string; category?: string; iconName?: string }) {
    return this.request<any>(`/verification/${contractorId}/award-badge`, { method: 'POST', body: JSON.stringify(payload) });
  }

  // 8D Ratings & CSAT
  async submitJobRating(jobId: string, ratingData: any) {
    return this.request<any>(`/ratings/job/${jobId}`, { method: 'POST', body: JSON.stringify(ratingData) });
  }
  async getContractorRatings(contractorId: string) {
    return this.request<any>(`/ratings/contractor/${contractorId}`);
  }

  // In-App Messaging
  async getJobMessages(jobId: string) {
    return this.request<any[]>(`/messages/job/${jobId}`);
  }
  async sendJobMessage(jobId: string, text: string, attachmentUrl?: string, recipientId?: string) {
    return this.request<any>(`/messages/job/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ text, attachmentUrl, recipientId }),
    });
  }

  // Digital Wallet
  async getWalletBalance() {
    return this.request<any>('/wallet/balance');
  }
  async topUpWallet(amount: number, description?: string) {
    return this.request<any>('/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  // Memberships & Benefits
  async getMembershipPlans() {
    return this.request<any[]>('/memberships/plans');
  }
  async getMyBenefitSummary() {
    return this.request<any>('/memberships/my');
  }
  async changeMembershipPlan(planId: string, customerId?: string, reason?: string) {
    return this.request<any>('/memberships/change-plan', {
      method: 'POST',
      body: JSON.stringify({ planId, customerId, reason }),
    });
  }
  async getCustomerBenefitSummary(userId: string) {
    return this.request<any>(`/memberships/customer/${userId}`);
  }
  async adminOverrideDeduction(userId: string, payload: { amount: number; description: string; reference?: string; reason?: string }) {
    return this.request<any>(`/memberships/customer/${userId}/override-deduction`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async overrideCustomerDeduction(userId: string, payload: { amount: number; reason?: string; description?: string }) {
    return this.adminOverrideDeduction(userId, {
      amount: payload.amount,
      description: payload.description || 'Administrative manual adjustment',
      reason: payload.reason,
    });
  }
  async adminResetBenefitPeriod(userId: string) {
    return this.request<any>(`/memberships/customer/${userId}/reset-period`, {
      method: 'POST',
    });
  }
  async resetCustomerBenefitPeriod(userId: string) {
    return this.adminResetBenefitPeriod(userId);
  }
  async changeMyPlan(planId: string) {
    return this.changeMembershipPlan(planId);
  }

  // Claims
  async getMyClaims() {
    return this.request<any[]>('/claims/my');
  }
  async getAllClaims(params?: { status?: string; search?: string; plan?: string; serviceType?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.plan) qs.set('plan', params.plan);
    if (params?.serviceType) qs.set('serviceType', params.serviceType);
    return this.request<any[]>(`/claims?${qs}`);
  }
  async getClaim(id: string) {
    return this.request<any>(`/claims/${id}`);
  }
  async createClaim(payload: {
    serviceType: string;
    description: string;
    vehicleOrProperty?: string;
    contractorName?: string;
    amountClaimed: number;
    jobId?: string;
    supportingDocs?: any;
  }) {
    return this.request<any>('/claims', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async calculateCoverage(payload: { userId?: string; amount?: number; totalAmount?: number; partsAmount?: number; labourAmount?: number; serviceType?: string }) {
    return this.request<any>('/claims/calculate-coverage', {
      method: 'POST',
      body: JSON.stringify({
        userId: payload.userId,
        amount: payload.amount ?? payload.totalAmount ?? 0,
        totalAmount: payload.amount ?? payload.totalAmount ?? 0,
        partsAmount: payload.partsAmount,
        labourAmount: payload.labourAmount,
        serviceType: payload.serviceType,
      }),
    });
  }
  async reviewClaim(id: string, payload: any) {
    return this.request<any>(`/claims/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Invoices
  async getMyInvoices() {
    return this.request<any[]>('/invoices/my');
  }
  async getAllInvoices(params?: { search?: string; paymentStatus?: string; plan?: string; dateFrom?: string; dateTo?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
    if (params?.plan) qs.set('plan', params.plan);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    return this.request<any[]>(`/invoices?${qs}`);
  }
  async getInvoice(id: string) {
    return this.request<any>(`/invoices/${id}`);
  }
  async createInvoice(payload: any) {
    return this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async payInvoice(id: string, payload: { paymentMethod?: string; cardLast4?: string }) {
    return this.request<any>(`/invoices/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Payments & 3-Stage Membership Activation Lifecycle
  async getPaymentSchedule(planId: string, startDate?: string, billingDay?: number) {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (billingDay) qs.set('billingDay', billingDay.toString());
    return this.request<any>(`/payments/schedule/${planId}?${qs}`);
  }

  async getMyPayments() {
    return this.request<{ payments: any[]; timeline: any }>('/payments/my');
  }

  async getPaymentTimeline(userId?: string) {
    const path = userId ? `/payments/timeline/${userId}` : '/payments/timeline';
    return this.request<any>(path);
  }

  async payActivationStage(payload?: { paymentId?: string; paymentMethod?: string; simulateFailure?: boolean } | string) {
    const body = typeof payload === 'string' ? { paymentId: payload } : (payload || {});
    return this.request<any>('/payments/pay-activation', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async retryPayment(paymentId: string, paymentMethod = 'Card') {
    return this.request<any>(`/payments/${paymentId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  }

  async getAllPaymentsAdmin(params?: { status?: string; stage?: string; customerId?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.stage) qs.set('stage', params.stage);
    if (params?.customerId) qs.set('customerId', params.customerId);
    return this.request<any[]>(`/payments/admin/all?${qs}`);
  }

  async triggerAdminBilling(payload: { customerId?: string; membershipId?: string } | string) {
    const body = typeof payload === 'string' ? { customerId: payload } : payload;
    return this.request<any>('/payments/admin/trigger-billing', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async systemReseed(password: string) {
    return this.request<any>('/auth/system/reseed', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}


export const api = new ApiClient();

