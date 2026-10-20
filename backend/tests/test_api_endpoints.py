import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

sample_text = "Contact Alice at alice@example.com and call +1-555-123-4567."

def test_scan_endpoint():
    payload = {
        "text": sample_text,
        "processing_purpose": "support_triage",
        "destination": "internal",
    }
    response = client.post(f"{settings.API_PREFIX}/privacy/scan", json=payload)
    assert response.status_code == 200, f"Unexpected status {response.status_code}: {response.text}"
    data = response.json()
    assert data["total_count"] >= 2  # email + phone expected
    entity_types = {f["entity_type"] for f in data["findings"]}
    assert "EMAIL" in entity_types
    assert "PHONE" in entity_types
    assert data["risk_score"] > 0
    assert data["human_review_required"] is False or isinstance(data["human_review_required"], bool)

def test_redact_endpoint_and_audit():
    payload = {
        "text": sample_text,
        "mask_type": "token",
    }
    response = client.post(f"{settings.API_PREFIX}/privacy/redact", json=payload)
    assert response.status_code == 200, f"Redact failed: {response.text}"
    data = response.json()
    # Ensure redacted text does not contain raw email or phone number
    redacted = data["redacted_text"]
    assert "alice@example.com" not in redacted
    assert "+1-555-123-4567" not in redacted
    # Token placeholders should exist
    assert "[EMAIL_1]" in redacted or "[PHONE_1]" in redacted
    # Check audit log entry for redaction does not include raw values
    log_resp = client.get(f"{settings.API_PREFIX}/audit-logs")
    assert log_resp.status_code == 200
    logs = log_resp.json()["items"]
    # Find the most recent redact event
    redact_logs = [l for l in logs if l["action"] == "text_redacted"]
    assert redact_logs, "No redact audit log found"
    latest = redact_logs[-1]
    metadata = latest.get("metadata", {})
    # metadata should not contain raw PII
    assert "total_redacted" in metadata
    # Ensure no raw PII in metadata (by checking keys/values)
    for v in metadata.values():
        if isinstance(v, str):
            assert "@" not in v and "555" not in v
