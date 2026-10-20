import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="analyst")  # admin, analyst, reviewer
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_type = Column(String(100), nullable=False)  # scan_only, redact_only, summarize, classify, action_items, privacy_report
    processing_purpose = Column(String(255), nullable=False)  # support_triage, ticket_resolution, document_summary, privacy_audit
    status = Column(String(50), default="pending", index=True)  # pending, pending_review, approved, rejected, running, completed, failed
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="Low")  # Low, Medium, High, Critical
    human_review_required = Column(Boolean, default=False, index=True)
    approval_status = Column(String(50), default="auto_approved")  # auto_approved, pending, approved, rejected
    processing_mode = Column(String(50), default="deterministic")  # deterministic, ollama
    
    # Text storage policy: Only sanitized previews or redacted content
    input_preview = Column(String(200), nullable=True)  # First 120 chars for UI listing, non-sensitive
    redacted_output = Column(Text, nullable=True)
    result_json = Column(Text, nullable=True)  # Formatted task response JSON
    warnings_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    detections = relationship("PiiDetection", back_populates="job", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="job", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_job_status_created", "status", "created_at"),
    )

class PiiDetection(Base):
    __tablename__ = "pii_detections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("processing_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # EMAIL, PHONE, IP_ADDRESS, URL, CREDIT_CARD, SSN, SECRET, PERSON, LOCATION
    confidence = Column(Float, nullable=False)
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    detection_method = Column(String(50), nullable=False)  # rule, heuristic_nlp, presidio
    severity = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    redacted = Column(Boolean, default=True)
    token_label = Column(String(50), nullable=True)  # e.g., [EMAIL_1]

    job = relationship("ProcessingJob", back_populates="detections")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("processing_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    tool_name = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="success")  # success, failed, blocked, skipped
    duration_ms = Column(Float, default=0.0)
    result_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("ProcessingJob", back_populates="agent_runs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("processing_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    actor = Column(String(100), default="system")
    action = Column(String(100), nullable=False, index=True)  # e.g., job_created, review_approved, pii_redacted, retention_cleanup
    metadata_json = Column(Text, nullable=True)  # Non-sensitive metrics/hashes only
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    job = relationship("ProcessingJob", back_populates="audit_logs")

class PrivacySetting(Base):
    __tablename__ = "privacy_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    setting_key = Column(String(100), unique=True, nullable=False, index=True)
    setting_value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class BenchmarkEvaluation(Base):
    __tablename__ = "benchmark_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    benchmark_name = Column(String(100), nullable=False)
    sample_count = Column(Integer, nullable=False)
    tp = Column(Integer, default=0)
    fp = Column(Integer, default=0)
    fn = Column(Integer, default=0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1 = Column(Float, default=0.0)
    redaction_coverage = Column(Float, default=0.0)
    avg_latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
