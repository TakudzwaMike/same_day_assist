import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
  if (Capacitor.isNativePlatform()) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv.VITE_API_URL) {
      return metaEnv.VITE_API_URL;
    }
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

    if (res.status === 401 && endpoint !== '/auth/refresh') {
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
    serviceCategory: string; notes?: string; password: string;
  }) {
    const data = await this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('sda_user', JSON.stringify(data.user));
    return data.user;
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

  // Jobs
  async getMyJobs() { return this.request<any[]>('/jobs/my'); }
  async getAllJobs() { return this.request<any[]>('/jobs'); }
  async createJob(payload: any) {
    return this.request('/jobs', { method: 'POST', body: JSON.stringify(payload) });
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
  async getMyPayments() { return this.request<any[]>('/payments/my'); }
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
