import {
  HealthStatus,
  LLMHealthStatus,
  DashboardSummary,
  DashboardTrends,
  ScanResponse,
  RedactResponse,
  JobResponse,
  JobListResponse,
  AgentTraceResponse,
  EvaluationMetrics,
  AuditLogListResponse,
  PrivacySettings,
  DemoScenario,
  FileUploadResult,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  getHealth: (): Promise<HealthStatus> =>
    fetch(`${API_BASE}/health`).then(r => handleResponse<HealthStatus>(r)),
  
  getLLMHealth: (): Promise<LLMHealthStatus> =>
    fetch(`${API_BASE}/health/llm`).then(r => handleResponse<LLMHealthStatus>(r)),

  // Dashboard
  getDashboardSummary: (): Promise<DashboardSummary> =>
    fetch(`${API_BASE}/dashboard/summary`).then(r => handleResponse<DashboardSummary>(r)),

  getDashboardTrends: (): Promise<DashboardTrends> =>
    fetch(`${API_BASE}/dashboard/trends`).then(r => handleResponse<DashboardTrends>(r)),

  // Privacy Scanner & Redaction
  scanText: (text: string, processing_purpose = 'support_triage', destination = 'local'): Promise<ScanResponse> =>
    fetch(`${API_BASE}/privacy/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, processing_purpose, destination }),
    }).then(r => handleResponse<ScanResponse>(r)),

  redactText: (text: string, processing_purpose = 'support_triage', mask_type = 'token'): Promise<RedactResponse> =>
    fetch(`${API_BASE}/privacy/redact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, processing_purpose, mask_type }),
    }).then(r => handleResponse<RedactResponse>(r)),

  uploadFile: async (file: File, columnName?: string): Promise<FileUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (columnName) {
      formData.append('column_name', columnName);
    }
    const res = await fetch(`${API_BASE}/privacy/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<FileUploadResult>(res);
  },

  // Jobs
  createJob: (payload: {
    task_type: string;
    text: string;
    processing_purpose: string;
    processing_mode?: string;
    auto_execute?: boolean;
  }): Promise<JobResponse> =>
    fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => handleResponse<JobResponse>(r)),

  getJobs: (params?: { page?: number; page_size?: number; status?: string; task_type?: string }): Promise<JobListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.task_type) query.append('task_type', params.task_type);
    return fetch(`${API_BASE}/jobs?${query.toString()}`).then(r => handleResponse<JobListResponse>(r));
  },

  getJob: (jobId: string): Promise<JobResponse> =>
    fetch(`${API_BASE}/jobs/${jobId}`).then(r => handleResponse<JobResponse>(r)),

  approveJob: (jobId: string, reason?: string): Promise<JobResponse> =>
    fetch(`${API_BASE}/jobs/${jobId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true, reason }),
    }).then(r => handleResponse<JobResponse>(r)),

  rejectJob: (jobId: string, reason?: string): Promise<JobResponse> =>
    fetch(`${API_BASE}/jobs/${jobId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: false, reason }),
    }).then(r => handleResponse<JobResponse>(r)),

  executeJob: (jobId: string): Promise<JobResponse> =>
    fetch(`${API_BASE}/jobs/${jobId}/execute`, {
      method: 'POST',
    }).then(r => handleResponse<JobResponse>(r)),

  deleteJob: (jobId: string): Promise<{ message: string }> =>
    fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE',
    }).then(r => handleResponse<{ message: string }>(r)),

  getJobTrace: (jobId: string): Promise<AgentTraceResponse> =>
    fetch(`${API_BASE}/jobs/${jobId}/trace`).then(r => handleResponse<AgentTraceResponse>(r)),

  // Analytics & Evaluation
  getEvaluationMetrics: (): Promise<EvaluationMetrics> =>
    fetch(`${API_BASE}/analytics/evaluation`).then(r => handleResponse<EvaluationMetrics>(r)),

  getExportAnalyticsUrl: (): string => `${API_BASE}/export/analytics`,

  // Audit Logs
  getAuditLogs: (page = 1, pageSize = 20, action?: string): Promise<AuditLogListResponse> => {
    const query = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (action) query.append('action', action);
    return fetch(`${API_BASE}/audit-logs?${query.toString()}`).then(r => handleResponse<AuditLogListResponse>(r));
  },

  // Settings
  getSettings: (): Promise<PrivacySettings> =>
    fetch(`${API_BASE}/settings`).then(r => handleResponse<PrivacySettings>(r)),

  updateSettings: (settings: Partial<PrivacySettings>): Promise<PrivacySettings> =>
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then(r => handleResponse<PrivacySettings>(r)),

  cleanupRetention: (): Promise<{ deleted_jobs_count: number; deleted_detections_count: number; message: string }> =>
    fetch(`${API_BASE}/retention/cleanup`, { method: 'POST' }).then(r => handleResponse<{ deleted_jobs_count: number; deleted_detections_count: number; message: string }>(r)),

  // Demo
  loadDemoData: (): Promise<{ scenarios_loaded: number; message: string }> =>
    fetch(`${API_BASE}/demo/load`, { method: 'POST' }).then(r => handleResponse<{ scenarios_loaded: number; message: string }>(r)),

  resetDemoData: (): Promise<{ deleted_jobs: number; message: string }> =>
    fetch(`${API_BASE}/demo/reset`, { method: 'POST' }).then(r => handleResponse<{ deleted_jobs: number; message: string }>(r)),

  getDemoScenarios: (): Promise<DemoScenario[]> =>
    fetch(`${API_BASE}/demo/scenarios`).then(r => handleResponse<DemoScenario[]>(r)),
};
