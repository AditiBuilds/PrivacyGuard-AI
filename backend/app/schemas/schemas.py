import json
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any

class PiiFindingSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    entity_type: str
    confidence: float
    start_offset: int
    end_offset: int
    detection_method: str  # rule, heuristic_nlp, presidio
    severity: str  # Low, Medium, High, Critical
    redacted: bool = True
    token_label: Optional[str] = None
    match_preview: Optional[str] = None  # Non-sensitive masked preview, e.g. "j***@example.com"

class ScanRequest(BaseModel):
    text: str = Field(..., max_length=100000, description="The raw text to inspect for PII")
    processing_purpose: str = Field("support_triage", description="Purpose for processing")
    destination: str = Field("local", description="Destination environment, e.g. local or external_api")

class ScanResponse(BaseModel):
    findings: List[PiiFindingSchema]
    total_count: int
    entity_counts: Dict[str, int]
    risk_score: float
    risk_level: str
    human_readable_reasons: List[str]
    rule_ids: List[str]
    human_review_required: bool
    recommended_action: str

class RedactRequest(BaseModel):
    text: str = Field(..., max_length=100000)
    processing_purpose: str = Field("support_triage")
    mask_type: str = Field("token", description="'token' (e.g. [EMAIL_1]) or 'mask' (e.g. [REDACTED])")

class RedactResponse(BaseModel):
    original_length: int
    redacted_length: int
    redacted_text: str
    total_redacted: int
    findings: List[PiiFindingSchema]
    token_mapping: Dict[str, str]

class JobCreateRequest(BaseModel):
    task_type: str = Field(..., description="summarize, classify, action_items, privacy_report, scan_only, redact_only")
    text: str = Field(..., max_length=100000)
    processing_purpose: str = Field("support_triage")
    processing_mode: Optional[str] = Field("deterministic", description="deterministic or ollama")
    auto_execute: bool = Field(True, description="Execute pipeline immediately if low risk")

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_type: str
    processing_purpose: str
    status: str
    risk_score: float
    risk_level: str
    human_review_required: bool
    approval_status: str
    processing_mode: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    input_preview: Optional[str] = None
    redacted_output: Optional[str] = None
    result_json: Optional[str] = None
    warnings_json: Optional[str] = None
    detections_count: int = 0
    detections: Optional[List[PiiFindingSchema]] = None

class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int

class JobApprovalRequest(BaseModel):
    approved: bool
    reason: Optional[str] = Field(None, description="Reason for approving or rejecting")

class AgentStepSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    step_number: int
    tool_name: str
    reason: str
    status: str
    duration_ms: float
    result_summary: Optional[str] = None
    created_at: datetime

class AgentTraceResponse(BaseModel):
    job_id: str
    status: str
    steps: List[AgentStepSchema]
    total_duration_ms: float

class DashboardSummaryResponse(BaseModel):
    total_documents: int
    total_pii_detected: int
    high_risk_jobs: int
    redaction_rate: float
    pending_reviews: int
    avg_processing_time_ms: float
    llm_available: bool
    llm_model: str
    llm_provider: str

class TrendPoint(BaseModel):
    date: str
    count: int

class NameCount(BaseModel):
    name: str
    count: int

class DashboardTrendsResponse(BaseModel):
    volume_trend: List[TrendPoint]
    pii_by_type: List[NameCount]
    risk_distribution: List[NameCount]
    status_distribution: List[NameCount]
    review_outcomes: List[NameCount]

class EvaluationMetricsResponse(BaseModel):
    benchmark_name: str
    sample_count: int
    tp: int
    fp: int
    fn: int
    precision: float
    recall: float
    f1: float
    false_positive_count: int
    false_negative_count: int
    redaction_coverage: float
    avg_latency_ms: float
    human_review_rate: float
    is_synthetic_eval: bool = True
    notes: str

class AuditLogSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra='allow')

    id: str
    job_id: Optional[str] = None
    actor: str
    action: str
    metadata_json: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime

    @classmethod
    def model_validate(cls, obj):
        # Use the original Pydantic validation then add parsed metadata
        instance = super().model_validate(obj)
        if instance.metadata_json:
            try:
                instance.metadata = json.loads(instance.metadata_json)
            except Exception:
                instance.metadata = {}
        return instance

class AuditLogListResponse(BaseModel):
    items: List[AuditLogSchema]
    total: int
    page: int
    page_size: int

class SettingsSchema(BaseModel):
    default_processing_mode: str
    local_only_processing: bool
    default_redaction_strategy: str
    human_review_threshold: int
    retention_days: int
    llm_provider: str
    ollama_model: str
    ollama_base_url: str

class SettingsUpdateSchema(BaseModel):
    default_processing_mode: Optional[str] = None
    local_only_processing: Optional[bool] = None
    default_redaction_strategy: Optional[str] = None
    human_review_threshold: Optional[int] = None
    retention_days: Optional[int] = None
    llm_provider: Optional[str] = None
    ollama_model: Optional[str] = None
    ollama_base_url: Optional[str] = None

class RetentionCleanupResponse(BaseModel):
    deleted_jobs_count: int
    deleted_detections_count: int
    deleted_audit_logs_count: int
    retention_days_applied: int
    message: str

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    database_connected: bool

class LLMHealthResponse(BaseModel):
    provider: str
    available: bool
    model: str
    endpoint: str
    message: str
