from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import delete
from app.models.entities import ProcessingJob, PiiDetection, AgentRun, AuditLog, PrivacySetting
from app.core.config import settings

class RetentionService:
    @staticmethod
    def get_retention_days(db: Session) -> int:
        setting = db.query(PrivacySetting).filter(PrivacySetting.setting_key == "retention_days").first()
        if setting:
            try:
                return int(setting.setting_value)
            except ValueError:
                pass
        return settings.DEFAULT_RETENTION_DAYS

    @staticmethod
    def run_cleanup(db: Session, force_days: int = None) -> Dict[str, Any]:
        days = force_days if force_days is not None else RetentionService.get_retention_days(db)
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Find eligible jobs completed before cutoff
        expired_jobs = db.query(ProcessingJob).filter(
            ProcessingJob.created_at < cutoff_date
        ).all()

        job_ids = [j.id for j in expired_jobs]
        deleted_jobs = len(job_ids)
        deleted_detections = 0

        if job_ids:
            # Delete PiiDetections
            det_res = db.query(PiiDetection).filter(PiiDetection.job_id.in_(job_ids)).delete(synchronize_session=False)
            deleted_detections = det_res

            # Delete AgentRuns
            db.query(AgentRun).filter(AgentRun.job_id.in_(job_ids)).delete(synchronize_session=False)

            # Nullify job_id in audit logs to preserve security log integrity while unlinking deleted jobs
            db.query(AuditLog).filter(AuditLog.job_id.in_(job_ids)).update(
                {"job_id": None}, synchronize_session=False
            )

            # Delete ProcessingJobs
            db.query(ProcessingJob).filter(ProcessingJob.id.in_(job_ids)).delete(synchronize_session=False)

            db.commit()

        # Log the cleanup event
        cleanup_audit = AuditLog(
            actor="retention_service",
            action="retention_cleanup_executed",
            metadata_json=f'{{"cutoff_days": {days}, "deleted_jobs": {deleted_jobs}, "deleted_detections": {deleted_detections}}}',
            timestamp=datetime.utcnow()
        )
        db.add(cleanup_audit)
        db.commit()

        return {
            "deleted_jobs_count": deleted_jobs,
            "deleted_detections_count": deleted_detections,
            "deleted_audit_logs_count": 0,
            "retention_days_applied": days,
            "message": f"Successfully deleted {deleted_jobs} expired job records older than {days} days."
        }

retention_service = RetentionService()
