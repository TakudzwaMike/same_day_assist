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
  assignSurveyInspector: (enquiryId: string, inspectorId: string, scheduledDate: string) => Promise<void>;
  updateSurveyProgress: (enquiryId: string, status: 'SURVEY_SCHEDULED' | 'SURVEY_IN_PROGRESS') => Promise<void>;
  submitSurveyReport: (enquiryId: string, report: Partial<import('../types').SurveyReport>) => Promise<void>;
  adminReviewSurvey: (enquiryId: string, decision: 'APPROVE' | 'REQUEST_INFO' | 'REJECT', notes?: string) => Promise<void>;
  processInitialPayment: (customerId: string, amount: number, paymentMethod: string) => Promise<void>;
  activateCustomerAccount: (customerId: string) => Promise<void>;
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
      
      const normalizeJob = (j: any) => ({
        ...j,
        customerName: j.customerName || j.customer?.name || 'Valued Member',
        customerAddress: j.customerAddress || j.customer?.address || 'Sandton, Johannesburg',
        status: (j.status === 'Request Received' ? 'Requested' : j.status) || 'Requested',
      });

      setState(prev => {
        let updated = { ...prev };
        let idx = 0;

        if (isClient) {
          updated.jobs = (results[idx++] || []).map(normalizeJob);
          updated.quotations = results[idx++] || [];
          updated.assessments = results[idx++] || [];
          updated.payments = results[idx++] || [];
        } else if (isAdmin) {
          updated.jobs = (results[idx++] || []).map(normalizeJob);
          updated.enquiries = results[idx++] || [];
          updated.quotations = results[idx++] || [];
          updated.payments = results[idx++] || [];
          updated.auditLogs = results[idx++]?.logs || [];
        } else if (isDispatcher) {
          updated.jobs = (results[idx++] || []).map(normalizeJob);
          updated.enquiries = results[idx++] || [];
          updated.quotations = results[idx++] || [];
        } else if (isContractor) {
          updated.jobs = (results[idx++] || []).map(normalizeJob);
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

  // Trigger fetches on auth state & periodic real-time sync (polling every 4 seconds)
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      const intervalId = setInterval(() => {
        refreshData();
      }, 4000);
      return () => clearInterval(intervalId);
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
      await api.register({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        serviceCategory: payload.serviceCategory || 'Security Systems Assistance',
        notes: payload.notes,
        password: 'demo-passcode',
        role: 'Customer',
      });
      await refreshData();
    } catch (err: any) {
      if (err.message?.includes('Connection failed') || err.message?.includes('network') || err.message?.includes('fetch')) {
        const newEnquiry = {
          id: 'enq-' + Date.now(),
          customerName: payload.name,
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          serviceCategory: payload.serviceCategory || 'Security Systems Assistance',
          status: 'Pending' as const,
          notes: payload.notes || 'Onboarding compliance survey requested',
          createdAt: new Date().toISOString(),
        };
        updateState({
          enquiries: [newEnquiry, ...state.enquiries],
          currentStep: 'INTERESTED',
        });
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        updateState({ currentStep: 'ASSESSMENT_SCHEDULED' });
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        updateState({ currentStep: 'CONTRACTOR_ASSESSING' });
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        updateState({ currentStep: 'ASSESSMENT_UPLOADED' });
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        updateState({ currentStep: 'QUOTE_GENERATED' });
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        updateState({ currentStep: 'CUSTOMER_APPROVED' });
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        return;
      }
      setError(err.message || 'Failed to decline quotation');
      throw err;
    }
  };

  const createJob = async (payload: { serviceType: any; description: string; photoUrl?: string }) => {
    setError(null);
    const activeCustomer = state.customers.find(c => c.id === user?.id);
    const status = activeCustomer?.status || activeCustomer?.onboardingStatus;
    if (status && status !== 'ACTIVE' && status !== 'Active') {
      const msg = 'Your account is still undergoing onboarding.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      await api.createJob(payload);
      await refreshData();
    } catch (err: any) {
      if (err.message?.includes('Connection failed') || err.message?.includes('network') || err.message?.includes('fetch')) {
        const newJob = {
          id: 'job-' + Date.now(),
          customerId: user?.id || 'demo-user',
          serviceType: payload.serviceType,
          description: payload.description,
          status: 'Requested',
          trackerProgress: 10,
          createdAt: new Date().toISOString(),
          requestedAt: new Date().toISOString(),
          assignedContractorId: 'c1',
          assignedAt: new Date().toISOString(),
        };
        updateState({
          jobs: [newJob, ...state.jobs],
        });
        return;
      }
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

  const assignSurveyInspector = async (enquiryId: string, inspectorId: string, scheduledDate: string) => {
    setError(null);
    const inspector = state.contractors.find(c => c.id === inspectorId);
    const inspectorName = inspector?.name || 'Certified Inspector';

    updateState({
      enquiries: state.enquiries.map(enq => {
        if (enq.id === enquiryId) {
          return {
            ...enq,
            status: 'SURVEY_ASSIGNED' as const,
            surveyInspectorId: inspectorId,
            surveyInspectorName: inspectorName,
            surveyScheduledDate: scheduledDate,
          };
        }
        return enq;
      }),
      customers: state.customers.map(cust => {
        const matchingEnq = state.enquiries.find(e => e.id === enquiryId);
        if (cust.id === state.currentUserId || cust.email === matchingEnq?.email) {
          return {
            ...cust,
            status: 'SURVEY_ASSIGNED' as const,
            onboardingStatus: 'SURVEY_ASSIGNED' as const,
            surveyInspectorId: inspectorId,
            surveyInspectorName: inspectorName,
            surveyScheduledDate: scheduledDate,
          };
        }
        return cust;
      })
    });
    addAuditLogLocal('Survey Inspector Assigned', `Assigned inspector ${inspectorName} to survey request ${enquiryId} scheduled for ${scheduledDate}.`);
  };

  const updateSurveyProgress = async (enquiryId: string, status: 'SURVEY_SCHEDULED' | 'SURVEY_IN_PROGRESS') => {
    setError(null);
    const enq = state.enquiries.find(e => e.id === enquiryId);
    updateState({
      enquiries: state.enquiries.map(e => e.id === enquiryId ? { ...e, status } : e),
      customers: state.customers.map(cust => {
        if (cust.id === state.currentUserId || cust.email === enq?.email) {
          return { ...cust, status, onboardingStatus: status };
        }
        return cust;
      })
    });
    addAuditLogLocal('Survey Progress Updated', `Survey status updated to ${status} for enquiry ${enquiryId}.`);
  };

  const submitSurveyReport = async (enquiryId: string, reportData: Partial<import('../types').SurveyReport>) => {
    setError(null);
    const enq = state.enquiries.find(e => e.id === enquiryId);
    const fullReport: import('../types').SurveyReport = {
      id: 'sr-' + Date.now(),
      enquiryId,
      customerId: enq?.customerId,
      customerName: enq?.customerName || 'Customer',
      inspectorId: reportData.inspectorId || 'c1',
      inspectorName: reportData.inspectorName || 'Certified Inspector',
      propertyAssessment: reportData.propertyAssessment || 'Property structurally sound with compliant entry points.',
      safetyObservations: reportData.safetyObservations || 'Perimeter fence active. Intercom system verified.',
      complianceObservations: reportData.complianceObservations || 'Access control points meet Same Day Assist 2026 security guidelines.',
      existingSystems: reportData.existingSystems || 'Alarm module, CCTV cameras, electric gate sensor.',
      risksIdentified: reportData.risksIdentified || 'Minor overgrown vegetation near south perimeter fence.',
      recommendedActions: reportData.recommendedActions || 'Trim trees near south fence line before monsoon season.',
      photos: reportData.photos || ['https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60'],
      recommendation: reportData.recommendation || 'RECOMMEND_APPROVAL',
      inspectionDate: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
    };

    updateState({
      enquiries: state.enquiries.map(e => {
        if (e.id === enquiryId) {
          return {
            ...e,
            status: 'ADMIN_REVIEW' as const,
            surveyReport: fullReport,
          };
        }
        return e;
      }),
      customers: state.customers.map(c => {
        if (c.email === enq?.email || c.id === enq?.customerId) {
          return {
            ...c,
            status: 'ADMIN_REVIEW' as const,
            onboardingStatus: 'ADMIN_REVIEW' as const,
            surveyReport: fullReport,
          };
        }
        return c;
      })
    });
    addAuditLogLocal('Survey Report Submitted', `Inspector ${fullReport.inspectorName} submitted compliance survey report for ${fullReport.customerName}.`);
  };

  const adminReviewSurvey = async (enquiryId: string, decision: 'APPROVE' | 'REQUEST_INFO' | 'REJECT', notes?: string) => {
    setError(null);
    const targetStatus = decision === 'APPROVE' 
      ? ('PAYMENT_REQUIRED' as const) 
      : decision === 'REQUEST_INFO' 
      ? ('MORE_INFORMATION_REQUIRED' as const) 
      : ('APPLICATION_REJECTED' as const);

    const enq = state.enquiries.find(e => e.id === enquiryId);

    updateState({
      enquiries: state.enquiries.map(e => e.id === enquiryId ? { ...e, status: targetStatus, adminReviewNotes: notes } : e),
      customers: state.customers.map(c => {
        if (c.email === enq?.email || c.id === enq?.customerId) {
          return {
            ...c,
            status: targetStatus,
            onboardingStatus: targetStatus,
            adminReviewNotes: notes,
          };
        }
        return c;
      })
    });
    addAuditLogLocal('Admin Survey Review', `Administrator reviewed survey for ${enq?.customerName}. Decision: ${decision}. Notes: ${notes || 'None'}`);
  };

  const processInitialPayment = async (customerId: string, amount: number, paymentMethod: string) => {
    setError(null);
    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      customerId,
      customerName: state.customers.find(c => c.id === customerId)?.name || 'Customer',
      type: 'Onboarding Fee',
      amount,
      status: 'Paid',
      date: new Date().toISOString(),
    };

    const activationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    updateState({
      payments: [newPayment, ...state.payments],
      customers: state.customers.map(c => {
        if (c.id === customerId || c.email === state.customers.find(cu => cu.id === customerId)?.email) {
          return {
            ...c,
            status: 'WAITING_FOR_ACTIVATION' as const,
            onboardingStatus: 'WAITING_FOR_ACTIVATION' as const,
            initialPaymentAmount: amount,
            initialPaymentPaidAt: new Date().toISOString(),
            activationScheduledDate: activationDate,
            totalPaid: c.totalPaid + amount,
          };
        }
        return c;
      })
    });
    addAuditLogLocal('Initial Payment Received', `Received 50% initial activation payment of R${amount} via ${paymentMethod} from customer. Status updated to WAITING_FOR_ACTIVATION.`);
  };

  const activateCustomerAccount = async (customerId: string) => {
    setError(null);
    updateState({
      customers: state.customers.map(c => {
        if (c.id === customerId || c.email === state.customers.find(cu => cu.id === customerId)?.email) {
          return {
            ...c,
            status: 'ACTIVE' as const,
            onboardingStatus: 'ACTIVE' as const,
          };
        }
        return c;
      })
    });
    addAuditLogLocal('Account Service Activated', `Customer account ${customerId} successfully activated for full Same Day Assist access.`);
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
      assignSurveyInspector,
      updateSurveyProgress,
      submitSurveyReport,
      adminReviewSurvey,
      processInitialPayment,
      activateCustomerAccount,
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
