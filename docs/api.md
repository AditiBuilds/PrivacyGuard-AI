# PrivacyGuard AI — REST API Documentation

Base URL: `http://localhost:8000/api`  
Interactive OpenAPI UI: `http://localhost:8000/docs`

## 1. System Health

- `GET /api/health`
  - Returns backend operational status, version, and database connection.
- `GET /api/health/llm`
  - Returns whether Ollama is reachable locally and active model tag.

## 2. Privacy Scanner & Redaction

- `POST /api/privacy/scan`
  - Request: `{ "text": string, "processing_purpose": string, "destination": string }`
  - Response: Entity findings with offsets, confidence, severity, risk score, and rule IDs.
- `POST /api/privacy/redact`
  - Request: `{ "text": string, "processing_purpose": string, "mask_type": "token"|"mask" }`
  - Response: Redacted text with stable indexed tokens, token mapping, and findings list.
- `POST /api/privacy/upload`
  - Multipart form upload for `.txt` or `.csv` files (with optional `column_name`).

## 3. Bounded Agent & Processing Jobs

- `POST /api/jobs`
  - Initiates autonomous agent workflow on submitted text.
- `GET /api/jobs`
  - Paginated list of jobs filtered by `status` and `task_type`.
- `GET /api/jobs/{job_id}`
  - Detailed job metadata, risk assessment, and findings.
- `POST /api/jobs/{job_id}/approve`
  - Explicit human approval timestamp recording and resumes AI task execution.
- `POST /api/jobs/{job_id}/reject`
  - Permanently halts job execution and records reviewer rejection rationale.
- `POST /api/jobs/{job_id}/execute`
  - Re-executes approved job tools (returns 403 Forbidden if rejected or unapproved).
- `GET /api/jobs/{job_id}/trace`
  - Returns chronological timeline of agent tool execution steps.
- `DELETE /api/jobs/{job_id}`
  - Deletes job and associated detections.

## 4. Dashboard & Analytics

- `GET /api/dashboard/summary`
  - High-level KPIs: documents processed, PII counts, high-risk ratio, latency.
- `GET /api/dashboard/trends`
  - Volume trends, entity distribution, risk distribution, and review outcomes.
- `GET /api/analytics/evaluation`
  - Real offline Precision, Recall, F1, TP, FP, FN metrics.
- `GET /api/export/analytics`
  - Downloads aggregate benchmark metrics as a CSV file.

## 5. Audit Logs & Privacy Settings

- `GET /api/audit-logs`
  - Paginated list of audit events.
- `GET /api/settings`
  - Returns active privacy threshold, retention days, and mode.
- `PUT /api/settings`
  - Updates policy thresholds and local processing flags.
- `POST /api/retention/cleanup`
  - Manually executes retention pruning of records older than configured days.
- `POST /api/demo/load`
  - Initializes 8 representative demo scenarios and synthetic benchmarks.
- `POST /api/demo/reset`
  - Purges demonstration records.
