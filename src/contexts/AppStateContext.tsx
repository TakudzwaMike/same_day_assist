import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getSocket, onNewJob, onJobUpdated } from '../services/socket';
import { useAuth } from './AuthContext';
import { AppState, Enquiry, Assessment, Quotation, Customer, Contractor, Job, Payment, AuditLog, JourneyStep } from '../types';
import { INITIAL_CONTRACTORS, INITIAL_ENQUIRIES, INITIAL_CUSTOMERS } from '../data/staticData';

interface AppStateContextType {
  state: AppState;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createEnquiry: (payload: { name: string; email: string; phone: string; address: string; serviceCategory: any; notes?: string }) => Promise<void>;
  scheduleAssessment: (enquiryId: string, contractorId: string) => Promise<void>;
  startAssessment: (assessmentId: string) => Promise<void>;
  uploadAssessment: (assessmentId: string, payload: { issuesFound: string[]; estimatedCost: number; contractorNotes?: string; photoUrl?: string }) => Promise<void>;
  createQuotation: (payload: { enquiryId: string; lineItems: { description: string; cost: number }[] }) => Promise<void>;
  approveQuotation: (quotationId: string) => Promise<void>;
  declineQuotation: (quotationId: string) => Promise<void>;
  createJob: (payload: { serviceType: any; description: string; photoUrl?: string }) => Promise<void>;
  assignContractor: (jobId: string, contractorId: string) => Promise<void>;
  updateJobStatus: (jobId: string, status: string) => Promise<void>;
  updateContractorLocation: (jobId: string, lat: number, lng: number) => Promise<void>;
  completeJob: (jobId: string, payload: { contractorNotes: string; contractorSignature: string; completionPhoto?: string }) => Promise<void>;
  rateJob: (jobId: string, rating: number, ratingComment?: string) => Promise<void>;
  closeJob: (jobId: string) => Promise<void>;
  initiatePayment: (type: string, amount: number) => Promise<void>;
  clearError: () => void;
  updateState: (newState: Partial<AppState>) => void;
  addAuditLogLocal: (action: string, details: string) => void;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    const cached = localStorage.getItem('sda_app_state');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          selectedRole: user?.role || parsed.selectedRole || 'Customer',
          currentUserId: user?.id || parsed.currentUserId || '',
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      currentStep: 'PROSPECT',
      enquiries: INITIAL_ENQUIRIES,
      assessments: [],
      quotations: [],
      customers: INITIAL_CUSTOMERS,
      contractors: INITIAL_CONTRACTORS,
      jobs: [],
      payments: [],
      auditLogs: [],
      selectedRole: 'Customer',
      currentUserId: '',
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const updateState = useCallback((newState: Partial<AppState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem('sda_app_state', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addAuditLogLocal = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toISOString(),
      userType: state.selectedRole,
      action,
      details,
    };
    setState(prev => {
      const updated = {
        ...prev,
        auditLogs: [newLog, ...prev.auditLogs],
      };
      localStorage.setItem('sda_app_state', JSON.stringify(updated));
      return updated;
    });
  }, [state.selectedRole]);

  // Unified data refresher from APIs
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      // Parallel fetches for standard user resources
      const promises: Promise<any>[] = [];
      let isClient = user?.role === 'Customer';
      let isAdmin = user?.role === 'Administrator' || user?.role === 'Super Administrator';
      let isContractor = user?.role === 'Contractor';
      let isDispatcher = user?.role === 'Dispatcher';

      if (isClient) {
        promises.push(api.getMyJobs().catch(() => []));
        promises.push(api.getMyQuotations().catch(() => []));
        promises.push(api.getMyAssessments().catch(() => []));
        promises.push(api.getMyPayments().catch(() => []));
      } else if (isAdmin) {
        promises.push(api.getAllJobs().catch(() => []));
        promises.push(api.getEnquiries().catch(() => []));
        promises.push(api.getAllQuotations().catch(() => []));
        promises.push(api.getAllPayments().catch(() => []));
        if (user?.role === 'Super Administrator') {
          promises.push(api.getAuditLogs({ limit: 100 }).catch(() => ({ logs: [] })));
        } else {
          promises.push(Promise.resolve({ logs: [] }));
        }
      } else if (isDispatcher) {
        promises.push(api.getAllJobs().catch(() => []));
        promises.push(api.getEnquiries().catch(() => []));
        promises.push(api.getAllQuotations().catch(() => []));
      } else if (isContractor) {
        promises.push(api.getAllJobs().catch(() => []));
        promises.push(api.getMyAssessments().catch(() => []));
      }

      const results = await Promise.all(promises);
      
      setState(prev => {
        let updated = { ...prev };
        let idx = 0;

        if (isClient) {
          updated.jobs = results[idx++] || [];
          updated.quotations = results[idx++] || [];
          updated.assessments = results[idx++] || [];
          updated.payments = results[idx++] || [];
        } else if (isAdmin) {
          updated.jobs = results[idx++] || [];
          updated.enquiries = results[idx++] || [];
          updated.quotations = results[idx++] || [];
          updated.payments = results[idx++] || [];
          updated.auditLogs = results[idx++]?.logs || [];
        } else if (isDispatcher) {
          updated.jobs = results[idx++] || [];
          updated.enquiries = results[idx++] || [];
          updated.quotations = results[idx++] || [];
        } else if (isContractor) {
          updated.jobs = results[idx++] || [];
          updated.assessments = results[idx++] || [];
        }

        updated.selectedRole = user?.role as any;
        updated.currentUserId = user?.id || '';

        // Derive currentStep from records
        if (isClient) {
          const clientPayments = updated.payments;
          const activeJob = updated.jobs.find(j => j.status !== 'Closed' && j.status !== 'Rated');
          const hasApprovedQuote = updated.quotations.some(q => q.status === 'Approved');
          const hasQuote = updated.quotations.length > 0;
          const hasAssessment = updated.assessments.length > 0;
          
          if (activeJob) {
            if (activeJob.status === 'Requested') updated.currentStep = 'REQUEST_ASSISTANCE';
            else if (activeJob.status === 'Assigned') updated.currentStep = 'CONTRACTOR_ASSIGNED';
            else if (activeJob.status === 'InRoute' || activeJob.status === 'Arrived') updated.currentStep = 'LIVE_JOB_UPDATES';
            else if (activeJob.status === 'Completed') updated.currentStep = 'COMPLETION_REPORT';
          } else if (clientPayments.some(p => p.status === 'Paid')) {
            updated.currentStep = 'MEMBERSHIP_ACTIVATED';
          } else if (hasApprovedQuote) {
            updated.currentStep = 'CUSTOMER_APPROVED';
          } else if (hasQuote) {
            updated.currentStep = 'QUOTE_GENERATED';
          } else if (hasAssessment) {
            const uploaded = updated.assessments.some(a => a.status === 'Uploaded');
            updated.currentStep = uploaded ? 'ASSESSMENT_UPLOADED' : 'CONTRACTOR_ASSESSING';
          }
        }

        localStorage.setItem('sda_app_state', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      console.warn('[AppState] Fetch warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Trigger fetches on auth state
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      updateState({
        jobs: [],
        quotations: [],
        assessments: [],
        payments: [],
        auditLogs: [],
      });
    }
  }, [isAuthenticated, refreshData, updateState]);

  // Socket listener hookup
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isAuthenticated) return;

    const handleNewJob = () => {
      refreshData();
    };

    const handleJobUpdated = () => {
      refreshData();
    };

    onNewJob(handleNewJob);
    onJobUpdated(handleJobUpdated);
  }, [isAuthenticated, refreshData]);

  // Mutations
  const createEnquiry = async (payload: { name: string; email: string; phone: string; address: string; serviceCategory: any; notes?: string }) => {
    setError(null);
    try {
      // In the mockup onboarding context, registration and enquiry are coupled
      await api.register({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        serviceCategory: payload.serviceCategory,
        notes: payload.notes,
        password: 'demo-passcode', // Default demo passcode
      });
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry');
      throw err;
    }
  };

  const scheduleAssessment = async (enquiryId: string, contractorId: string) => {
    setError(null);
    try {
      await api.scheduleAssessment(enquiryId, contractorId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule survey');
      throw err;
    }
  };

  const startAssessment = async (assessmentId: string) => {
    setError(null);
    try {
      await api.startAssessment(assessmentId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to start survey');
      throw err;
    }
  };

  const uploadAssessment = async (assessmentId: string, payload: { issuesFound: string[]; estimatedCost: number; contractorNotes?: string; photoUrl?: string }) => {
    setError(null);
    try {
      await api.uploadAssessment(assessmentId, payload);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey');
      throw err;
    }
  };

  const createQuotation = async (payload: { enquiryId: string; lineItems: { description: string; cost: number }[] }) => {
    setError(null);
    try {
      await api.createQuotation(payload);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch quotation');
      throw err;
    }
  };

  const approveQuotation = async (quotationId: string) => {
    setError(null);
    try {
      await api.approveQuotation(quotationId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve quotation');
      throw err;
    }
  };

  const declineQuotation = async (quotationId: string) => {
    setError(null);
    try {
      await api.declineQuotation(quotationId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to decline quotation');
      throw err;
    }
  };

  const createJob = async (payload: { serviceType: any; description: string; photoUrl?: string }) => {
    setError(null);
    try {
      await api.createJob(payload);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to request assistance');
      throw err;
    }
  };

  const assignContractor = async (jobId: string, contractorId: string) => {
    setError(null);
    try {
      await api.assignContractor(jobId, contractorId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign contractor');
      throw err;
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    setError(null);
    try {
      await api.updateJobStatus(jobId, status);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to update job status');
      throw err;
    }
  };

  const updateContractorLocation = async (jobId: string, lat: number, lng: number) => {
    try {
      await api.updateLocation(jobId, lat, lng);
    } catch (err) {
      console.warn('[Location] Failed to send coordinates:', err);
    }
  };

  const completeJob = async (jobId: string, payload: { contractorNotes: string; contractorSignature: string; completionPhoto?: string }) => {
    setError(null);
    try {
      await api.completeJob(jobId, payload);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete job');
      throw err;
    }
  };

  const rateJob = async (jobId: string, rating: number, ratingComment?: string) => {
    setError(null);
    try {
      await api.rateJob(jobId, rating, ratingComment);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating');
      throw err;
    }
  };

  const closeJob = async (jobId: string) => {
    setError(null);
    try {
      await api.closeJob(jobId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to close job card');
      throw err;
    }
  };

  const initiatePayment = async (type: string, amount: number) => {
    setError(null);
    try {
      await api.initiatePayment(type, amount);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
      throw err;
    }
  };

  return (
    <AppStateContext.Provider value={{
      state,
      isLoading,
      error,
      refreshData,
      createEnquiry,
      scheduleAssessment,
      startAssessment,
      uploadAssessment,
      createQuotation,
      approveQuotation,
      declineQuotation,
      createJob,
      assignContractor,
      updateJobStatus,
      updateContractorLocation,
      completeJob,
      rateJob,
      closeJob,
      initiatePayment,
      clearError,
      updateState,
      addAuditLogLocal,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside <AppStateProvider>');
  return context;
}
