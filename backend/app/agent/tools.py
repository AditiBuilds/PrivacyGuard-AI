import os
import re
import time
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.privacy.scanner import detector
from app.privacy.redactor import redactor
from app.privacy.risk_engine import risk_engine
from app.core.config import settings

def load_prompt(filename: str) -> str:
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""

def check_ollama_available() -> Tuple[bool, str]:
    try:
        r = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=1.5)
        if r.status_code == 200:
            models_data = r.json()
            models = [m.get("name") for m in models_data.get("models", [])]
            return True, f"Ollama online with {len(models)} models ({', '.join(models[:3])})"
        return False, f"Ollama HTTP {r.status_code}"
    except Exception as e:
        return False, f"Ollama not reachable at {settings.OLLAMA_BASE_URL} ({type(e).__name__})"

def query_ollama(prompt: str, model: str = None) -> Optional[str]:
    target_model = model or settings.OLLAMA_MODEL
    try:
        r = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={"model": target_model, "prompt": prompt, "stream": False},
            timeout=15.0
        )
        if r.status_code == 200:
            data = r.json()
            return data.get("response", "").strip()
    except Exception:
        pass
    return None

class AgentTools:
    """Bounded, authorized tools available to the autonomous agent orchestrator."""

    @staticmethod
    def detect_pii(text: str) -> List[Dict[str, Any]]:
        """Tool 1: Detect personally identifiable information in input text."""
        return detector.scan(text)

    @staticmethod
    def calculate_privacy_risk(
        findings: List[Dict[str, Any]],
        purpose: str = "support_triage",
        destination: str = "local",
        local_only_pref: bool = True
    ) -> Dict[str, Any]:
        """Tool 2: Assess privacy and compliance risks."""
        return risk_engine.calculate_risk(findings, purpose, destination, local_only_pref)

    @staticmethod
    def redact_sensitive_data(
        text: str,
        findings: List[Dict[str, Any]],
        mask_type: str = "token"
    ) -> Dict[str, Any]:
        """Tool 3: Redact sensitive entities with stable deterministic tokens."""
        redacted_text, resolved_findings, token_mapping = redactor.redact(text, findings, mask_type)
        return {
            "redacted_text": redacted_text,
            "findings": resolved_findings,
            "token_mapping": token_mapping,
            "total_redacted": len(resolved_findings),
        }

    @staticmethod
    def classify_request(text: str, mode: str = "deterministic") -> Dict[str, Any]:
        """Tool 4: Classify the customer or workplace request safely."""
        # Check if Ollama requested and available
        if mode == "ollama":
            online, _ = check_ollama_available()
            if online:
                template = load_prompt("classify.txt")
                prompt = template.format(text=text) if template else f"Classify this request: {text}"
                resp = query_ollama(prompt)
                if resp:
                    return {
                        "category": resp.splitlines()[0].replace("Category:", "").strip() if "Category:" in resp else resp[:60],
                        "details": resp,
                        "mode": "ollama",
                    }

        # Deterministic classification fallback
        lower_text = text.lower()
        if any(w in lower_text for w in ["refund", "billing", "invoice", "payment", "charge", "credit card", "subscription", "pricing"]):
            category = "Billing & Payments"
            priority = "High" if any(w in lower_text for w in ["urgent", "dispute", "unauthorized"]) else "Medium"
            reasoning = "Contains transaction and commercial billing terminology."
        elif any(w in lower_text for w in ["password", "login", "auth", "mfa", "2fa", "token", "locked out", "reset"]):
            category = "Account Access & Authentication"
            priority = "High"
            reasoning = "Involves credential verification or access recovery."
        elif any(w in lower_text for w in ["gdpr", "ccpa", "delete my data", "export data", "privacy", "right to erasure"]):
            category = "Data Privacy & Subject Rights"
            priority = "High"
            reasoning = "Formal data subject rights or regulatory request."
        elif any(w in lower_text for w in ["cve-", "exploit", "vulnerability", "breach", "leak", "security incident"]):
            category = "Security & Incident Response"
            priority = "Critical"
            reasoning = "Presents potential security vulnerability or incident indicators."
        elif any(w in lower_text for w in ["error", "bug", "crash", "exception", "failed", "broken", "traceback"]):
            category = "Technical Support & Bug Report"
            priority = "Medium"
            reasoning = "Describes a software malfunction or unexpected system behavior."
        else:
            category = "General Inquiry"
            priority = "Low"
            reasoning = "General operational or product information request."

        return {
            "category": category,
            "priority": priority,
            "reasoning": reasoning,
            "mode": "deterministic",
        }

    @staticmethod
    def summarize_redacted_text(text: str, mode: str = "deterministic") -> Dict[str, Any]:
        """Tool 5: Summarize pre-redacted text without exposing sensitive information."""
        if mode == "ollama":
            online, _ = check_ollama_available()
            if online:
                template = load_prompt("summarize.txt")
                prompt = template.format(text=text) if template else f"Summarize this text: {text}"
                resp = query_ollama(prompt)
                if resp:
                    return {
                        "summary": resp,
                        "mode": "ollama",
                    }

        # Deterministic summarization
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        if not sentences:
            return {"summary": "No content provided to summarize.", "mode": "deterministic"}

        # Extract up to 3 salient sentences
        selected = []
        # First sentence usually gives primary topic
        selected.append(sentences[0])
        # Look for sentences indicating problem or ask
        keywords = ["issue", "problem", "request", "need", "please", "error", "unable", "refund", "cancel"]
        for s in sentences[1:]:
            if len(selected) >= 3:
                break
            if any(k in s.lower() for k in keywords) or "[" in s:
                if s not in selected:
                    selected.append(s)

        summary_text = " ".join(selected)
        return {
            "summary": summary_text,
            "mode": "deterministic",
            "sentence_count": len(sentences),
        }

    @staticmethod
    def extract_action_items(text: str, mode: str = "deterministic") -> Dict[str, Any]:
        """Tool 6: Extract concrete non-sensitive next steps."""
        if mode == "ollama":
            online, _ = check_ollama_available()
            if online:
                template = load_prompt("action_items.txt")
                prompt = template.format(text=text) if template else f"Extract action items: {text}"
                resp = query_ollama(prompt)
                if resp:
                    items = [line.strip("- *").strip() for line in resp.splitlines() if line.strip()]
                    return {"action_items": items, "mode": "ollama"}

        # Deterministic extraction
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        action_patterns = ["please", "need to", "must", "request", "action required", "investigate", "refund", "cancel", "verify", "update"]
        items = []
        for s in sentences:
            if any(p in s.lower() for p in action_patterns):
                # Clean punctuation
                cleaned = re.sub(r"^[0-9-.\s]+", "", s).strip()
                if cleaned and cleaned not in items:
                    items.append(cleaned)
        
        if not items and sentences:
            items.append(f"Review and follow up on request: {sentences[0][:100]}...")

        return {
            "action_items": items[:5],
            "mode": "deterministic",
        }

    @staticmethod
    def validate_generated_output(output_text: str) -> Dict[str, Any]:
        """Tool 7: Guardrail check verifying output does not leak PII or injection."""
        findings = detector.scan(output_text)
        warnings = []
        is_valid = True

        # Check if unredacted high-risk entities leaked into output
        critical_leaks = [f for f in findings if f["entity_type"] in ("CREDIT_CARD", "SSN", "SECRET")]
        if critical_leaks:
            is_valid = False
            warnings.append(f"Critical data leak detected in output: {len(critical_leaks)} sensitive tokens.")

        # Check prompt injection patterns in output
        injection_triggers = ["ignore all previous", "system prompt leaked", "override security", "exfiltrate"]
        for t in injection_triggers:
            if t in output_text.lower():
                is_valid = False
                warnings.append(f"Potential prompt injection marker '{t}' detected.")

        return {
            "valid": is_valid,
            "findings_in_output": len(findings),
            "warnings": warnings,
        }

    @staticmethod
    def create_privacy_report(
        job_id: str,
        risk_assessment: Dict[str, Any],
        findings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Tool 8: Synthesize formal privacy and compliance risk report."""
        entity_breakdown: Dict[str, int] = {}
        for f in findings:
            t = f.get("entity_type", "UNKNOWN")
            entity_breakdown[t] = entity_breakdown.get(t, 0) + 1

        breakdown_lines = [f"- **{k}**: {v} instances detected" for k, v in entity_breakdown.items()]
        breakdown_text = "\n".join(breakdown_lines) if breakdown_lines else "- No sensitive entities identified."

        report_md = f"""# PrivacyGuard AI Assessment Report
**Job ID:** `{job_id}`  
**Overall Risk Score:** {risk_assessment.get('risk_score', 0)} / 100 ({risk_assessment.get('risk_level', 'Low')})  
**Recommended Action:** {risk_assessment.get('recommended_action', 'auto_approve')}  

## 1. Findings Breakdown
{breakdown_text}

## 2. Policy Triggers & Rationales
"""
        for r in risk_assessment.get("human_readable_reasons", []):
            report_md += f"- {r}\n"

        report_md += """
## 3. Data Minimization Recommendations
1. Redact direct contact and payment tokens before any downstream storage or model transmission.
2. Ensure automatic retention expiry is applied within configured policy limits.
3. Review destination security controls if external forwarding is ever contemplated.

---
*Notice: This report is generated by PrivacyGuard AI as an educational decision-support tool. It does not constitute formal legal counsel or certified GDPR compliance proof.*
"""
        return {
            "report_markdown": report_md.strip(),
            "risk_score": risk_assessment.get("risk_score", 0),
            "risk_level": risk_assessment.get("risk_level", "Low"),
        }
