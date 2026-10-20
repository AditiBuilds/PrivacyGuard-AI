import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        actor: str,
        action: str,
        job_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        # Guarantee no raw sensitive documents or credentials are ever recorded in audit logs
        safe_meta = {}
        if metadata:
            for k, v in metadata.items():
                if k.lower() in ("password", "raw_text", "secret", "credit_card", "ssn"):
                    safe_meta[k] = "[REDACTED_AUDIT_PARAM]"
                else:
                    safe_meta[k] = v

        audit = AuditLog(
            job_id=job_id,
            actor=actor,
            action=action,
            metadata_json=json.dumps(safe_meta) if safe_meta else None,
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

audit_service = AuditService()
