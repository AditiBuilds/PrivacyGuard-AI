export interface PiiFinding {
  id?: string;
  entity_type: string;
  confidence: number;
  start_offset: number;
  end_offset: number;
  detection_method: 'rule' | 'heuristic_nlp' | 'presidio' | string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  redacted: boolean;
  token_label?: string;
  match_preview?: string;
}

export interface ScanResponse {
  findings: PiiFinding[];
  total_count: number;
  entity_counts: Record<string, number>;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  human_readable_reasons: string[];
  rule_ids: string[];
  human_review_required: boolean;
  recommended_action: string;
}

export interface RedactResponse {
  original_length: number;
  redacted_length: number;
  redacted_text: string;
  total_redacted: number;
  findings: PiiFinding[];
  token_mapping: Record<string, string>;
}

export interface ProcessingJob {
  id: string;
  task_type: string;
  processing_purpose: string;
  status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  human_review_required: boolean;
  approval_status: 'auto_approved' | 'pending' | 'approved' | 'rejected';
  processing_mode: string;
  created_at: string;
  completed_at?: string;
  input_preview?: string;
  redacted_output?: string;
  result_json?: string;
  warnings_json?: string;
  detections_count: number;
  detections?: PiiFinding[];
}

export type JobResponse = ProcessingJob;

export interface FileUploadResult {
  text: string;
  columns: string[];
  filename?: string;
  selected_column?: string;
  rows_count?: number;
  preview?: any[];
}

export interface JobListResponse {
  items: ProcessingJob[];
  total: number;
  page: number;
  page_size: number;
}

export interface AgentStep {
  id?: string;
  step_number: number;
  tool_name: string;
  reason: string;
  status: 'success' | 'failed' | 'blocked' | 'paused' | 'skipped';
  duration_ms: number;
  result_summary?: string;
  created_at: string;
}

export interface AgentTraceResponse {
  job_id: string;
  status: string;
  steps: AgentStep[];
  total_duration_ms: number;
}

export interface DashboardSummary {
  total_documents: number;
  total_pii_detected: number;
  high_risk_jobs: number;
  redaction_rate: number;
  pending_reviews: number;
  avg_processing_time_ms: number;
  llm_available: boolean;
  llm_model: string;
  llm_provider: string;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface DashboardTrends {
  volume_trend: TrendPoint[];
  pii_by_type: NameCount[];
  risk_distribution: NameCount[];
  status_distribution: NameCount[];
  review_outcomes: NameCount[];
}

export interface EvaluationMetrics {
  benchmark_name: string;
  sample_count: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  false_positive_count: number;
  false_negative_count: number;
  redaction_coverage: number;
  avg_latency_ms: number;
  human_review_rate: number;
  is_synthetic_eval: boolean;
  notes: string;
}

export interface AuditLog {
  id: string;
  job_id?: string;
  actor: string;
  action: string;
  metadata_json?: string;
  timestamp: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface PrivacySettings {
  default_processing_mode: string;
  local_only_processing: boolean;
  default_redaction_strategy: string;
  human_review_threshold: number;
  retention_days: number;
  llm_provider: string;
  ollama_model: string;
  ollama_base_url: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  database_connected: boolean;
}

export interface LLMHealthStatus {
  provider: string;
  available: boolean;
  model: string;
  endpoint: string;
  message: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  task_type: string;
  purpose: string;
  expected_risk: string;
  text: string;
  description: string;
}
