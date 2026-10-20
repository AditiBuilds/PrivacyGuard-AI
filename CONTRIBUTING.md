# Contributing to PrivacyGuard AI

Thank you for considering a contribution! This project follows a **simple, pragmatic workflow** that works well on Windows and Linux.

## Prerequisites
- **Python 3.11+** (add to `PATH`)
- **Node.js 20+** (includes npm)
- **Git**
- Optional: **Ollama** for local LLM experiments

## Local Development Setup
```powershell
# Clone the repo (if you haven't already)
git clone <repo-url>
cd "PRIVACY GUARD AI"

# Python environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Front‑end
cd frontend
npm ci   # installs exact lockfile versions
cd ..
```

## Running the Application
### Backend
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
The OpenAPI docs are available at `http://127.0.0.1:8000/docs`.

### Front‑end (development)
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open the URL shown in the console (default `http://127.0.0.1:5173`).

## Testing
```powershell
# Backend tests (run from repository root)
cd backend
pytest -q
# Expected: 21 passed
```
The frontend build already validates that the bundle compiles without errors (`npm run build`).

## Code Style & Linting
- Follow **PEP 8** for Python files.
- Type hints are required for all public functions.
- Use **Prettier** for TypeScript/JS (`npm run format` if defined).
- Run `ruff check .` (if you add ruff to `requirements.txt`) before committing.

## Submitting a Pull Request
1. Fork the repository.
2. Create a feature branch:
   ```powershell
   git checkout -b feature/your‑feature
   ```
3. Make your changes and ensure the test suite still passes.
4. Commit with a clear message and push to your fork.
5. Open a PR against the `main` branch.

## Release Checklist (maintainers)
- Verify backend tests (`pytest`).
- Verify frontend production build (`npm run build`).
- Ensure the version in `pyproject.toml` / `package.json` is bumped.
- Update the changelog in `docs/CHANGELOG.md`.
- Run the `./scripts/package_release.sh` (if present) to create a source archive.

---

## Reporting Bugs
Please open an issue with a minimal reproducible example. Include:
- OS and version (Windows 10/11).
- Python version (`python --version`).
- Node version (`node --version`).
- Steps to reproduce the problem.

---

## License
All contributions are accepted under the MIT license. By submitting a PR you agree to license your code under the same terms.
