# PrivacyGuard AI

**PrivacyGuard AI** is an open‑source, locally runnable privacy‑aware AI assistant prototype. It scans documents, support tickets and other text for personally identifiable information (PII), evaluates privacy risk, redacts sensitive data, and generates concise reports.

---

## Table of Contents
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Generating Synthetic Data](#generating-synthetic-data)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **PII Detection** – Email, phone, IP address, URL, credit‑card, SSN, secret tokens, person names, locations.
- **Deterministic rule‑based engine** – Works without external services; optional Microsoft Presidio integration (disabled by default).
- **Risk Scoring** – Business‑rule driven privacy risk calculation.
- **Human Review Workflow** – Jobs can be paused for manual approval.
- **Redaction** – Token‑based or placeholder redaction preserving text layout.
- **Audit Trail** – Minimal, non‑sensitive logs stored in SQLite.
- **Analytics Dashboard** – KPI cards, charts powered by Recharts.
- **Export / Retention** – CSV export, retention‑policy cleanup.

---

## Architecture Overview
```mermaid
flowchart TD
    UI[React Front‑end] -->|REST API| API[FastAPI Backend]
    API -->|calls| Scanner[PII Detector]
    API -->|calls| RiskEngine[Risk Engine]
    API -->|calls| Redactor[Redaction Service]
    API -->|orchestrates| Agent[Bounded Agent Orchestrator]
    Agent -->|optional| Ollama[Local LLM (if available)]
    API -->|stores| DB[(SQLite DB)]
    UI -->|visualises| Analytics[Recharts]
    style UI fill:#101B32,color:#FFFFFF
    style API fill:#182641,color:#FFFFFF
    style Scanner fill:#D9AE57,color:#000000
    style RiskEngine fill:#D9AE57,color:#000000
    style Redactor fill:#D9AE57,color:#000000
    style Agent fill:#D9AE57,color:#000000
    style DB fill:#FFFFFF,stroke:#101B32,stroke-width:2px
```

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Front‑end | React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide‑React |
| Back‑end | Python 3.11, FastAPI, Pydantic, SQLAlchemy, SQLite |
| AI / NLP | Deterministic regex rules, Luhn check, optional Microsoft Presidio, optional Ollama (local) |
| Testing | Pytest (backend), Vite test utilities (frontend) |
| Containerisation | Dockerfile & Docker‑Compose (optional) |

---

## Prerequisites
- **Windows 10/11** (PowerShell)
- **Python 3.11+** (add to `PATH`)
- **Node.js 20+** (includes npm)
- Optional: **Ollama** for local LLM support (not required for core functionality)

---

## Setup & Installation
```powershell
# 1️⃣ Clone the repo (already done) and navigate to the project root
cd "C:\Users\Lenovo\Desktop\PRIVACY GUARD AI"

# 2️⃣ Create a virtual environment and install Python dependencies
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3️⃣ Install frontend dependencies
cd frontend
npm ci   # or `npm install`
cd ..
```
> The `requirements.txt` contains deterministic versions that have been tested on Windows.

---

## Running the Application
### Backend (FastAPI)
```powershell
# From the project root (ensure the venv is active)
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
The API docs are available at `http://127.0.0.1:8000/docs`.

### Frontend (React dev server)
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173` in a browser to view the dashboard.

### Production Build
```powershell
cd frontend
npm run build
# The compiled files are placed in `frontend/dist` and can be served by any static web server.
```
---

## Running Tests
```powershell
# Backend tests
cd backend
pytest -q
# Expected output: `21 passed` (as of the latest verification)
```
Frontend tests are currently minimal; the production build validates that the bundle compiles without errors.

---

## Generating Synthetic Data
The demo service provides a helper to generate synthetic documents for experimentation:
```python
from app.services.demo_service import generate_synthetic_dataset
samples = generate_synthetic_dataset(count=10)
print(samples)
```
Use this in the FastAPI interactive docs or a Python REPL.

---

## Known Limitations
- **Presidio integration is disabled** because the required spaCy models are not bundled; the scanner solely relies on rule‑based detection.
- **LLM support (Ollama)** is optional; the application works fully without it.
- The UI currently has no dark‑mode toggle (styles are static but can be extended).
- No authentication/authorization – this is a prototype.
- Large frontend bundles (>500 KB) – acceptable for a demo but should be code‑split for production.

---

## Contributing
Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on setting up a development environment, code style, and running tests.

---

## License
MIT © 2024‑2026 PrivacyGuard AI contributors.
