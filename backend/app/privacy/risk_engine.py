from typing import List, Dict, Any, Tuple

APPROVED_PURPOSES = {
    "support_triage",
    "ticket_resolution",
    "document_summary",
    "privacy_audit",
    "action_extraction",
}

UNAPPROVED_PURPOSES = {
    "marketing_profiling",
    "external_sharing",
    "unauthorized_export",
    "ad_targeting",
    "third_party_sale",
}

class RiskAssessmentEngine:
    def __init__(self, review_threshold: int = 60):
        self.review_threshold = review_threshold

    def calculate_risk(
        self,
        findings: List[Dict[str, Any]],
        processing_purpose: str = "support_triage",
        destination: str = "local",
        local_only_pref: bool = True
    ) -> Dict[str, Any]:
        score = 0.0
        reasons: List[str] = []
        rule_ids: List[str] = []
        human_review_required = False
        blocked = False

        # Group findings by type
        type_counts: Dict[str, int] = {}
        for f in findings:
            t = f.get("entity_type", "UNKNOWN")
            type_counts[t] = type_counts.get(t, 0) + 1

        total_findings = len(findings)

        # 1. Financial Data (Credit Card)
        cc_count = type_counts.get("CREDIT_CARD", 0)
        if cc_count > 0:
            added = min(cc_count * 35.0, 70.0)
            score += added
            rule_ids.append("RULE-FINANCIAL-01")
            reasons.append(f"Detected {cc_count} payment card numbers requiring PCI-DSS segregation (+{int(added)} pts).")
            human_review_required = True

        # 2. Secrets & API Keys
        secret_count = type_counts.get("SECRET", 0)
        if secret_count > 0:
            added = min(secret_count * 35.0, 70.0)
            score += added
            rule_ids.append("RULE-SECRETS-02")
            reasons.append(f"Detected {secret_count} credentials or private tokens exposing sensitive systems (+{int(added)} pts).")
            human_review_required = True

        # 3. Government / National Identifiers
        ssn_count = type_counts.get("SSN", 0)
        if ssn_count > 0:
            added = min(ssn_count * 30.0, 60.0)
            score += added
            rule_ids.append("RULE-GOV-ID-03")
            reasons.append(f"Detected {ssn_count} government identifiers / SSNs (+{int(added)} pts).")
            human_review_required = True

        # 4. Direct Contact Information (Email, Phone)
        contact_count = type_counts.get("EMAIL", 0) + type_counts.get("PHONE", 0)
        if contact_count > 0:
            added = min(contact_count * 12.0, 36.0)
            score += added
            rule_ids.append("RULE-CONTACT-04")
            reasons.append(f"Detected {contact_count} direct contact identifiers (email/phone) (+{int(added)} pts).")

        # 5. Indirect Identifiers (IP, Person Names, Locations)
        indirect_count = type_counts.get("IP_ADDRESS", 0) + type_counts.get("PERSON", 0) + type_counts.get("LOCATION", 0)
        if indirect_count > 0:
            added = min(indirect_count * 8.0, 24.0)
            score += added
            rule_ids.append("RULE-INDIRECT-05")
            reasons.append(f"Detected {indirect_count} indirect or quasi-identifiers (IPs, names, locations) (+{int(added)} pts).")

        # 6. Finding Volume Multiplier
        if total_findings > 5:
            score += 15.0
            rule_ids.append("RULE-VOLUME-06")
            reasons.append(f"High PII density with {total_findings} total findings exceeds typical threshold (+15 pts).")

        # 7. Processing Purpose Validation
        purpose_clean = processing_purpose.strip().lower()
        if purpose_clean in UNAPPROVED_PURPOSES:
            score += 35.0
            rule_ids.append("RULE-PURPOSE-07")
            reasons.append(f"Requested purpose '{processing_purpose}' is non-essential or unapproved under data minimization policies (+35 pts).")
            human_review_required = True
            blocked = True
        elif purpose_clean not in APPROVED_PURPOSES:
            score += 15.0
            rule_ids.append("RULE-PURPOSE-UNKNOWN")
            reasons.append(f"Requested purpose '{processing_purpose}' is unrecognized; human review recommended (+15 pts).")
            human_review_required = True

        # 8. External Destination / Policy Check
        if destination == "external_api" and local_only_pref:
            score += 40.0
            rule_ids.append("RULE-EXTERNAL-DEST-08")
            reasons.append("External API processing is prohibited when local-only policy preference is active (+40 pts).")
            blocked = True
            human_review_required = True

        # Clamp score between 0 and 100
        score = min(max(round(score, 1), 0.0), 100.0)

        # Categorize
        if score >= 85:
            risk_level = "Critical"
        elif score >= 60:
            risk_level = "High"
        elif score >= 30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Determine threshold review
        if score >= self.review_threshold:
            human_review_required = True

        # Recommended action
        if blocked:
            recommended_action = "block_processing"
        elif human_review_required:
            recommended_action = "require_human_review"
        else:
            recommended_action = "auto_approve"

        if not reasons:
            reasons.append("No sensitive identifiers detected. Standard local processing permitted.")

        return {
            "risk_score": score,
            "risk_level": risk_level,
            "human_readable_reasons": reasons,
            "rule_ids": rule_ids,
            "human_review_required": human_review_required,
            "recommended_action": recommended_action,
        }

risk_engine = RiskAssessmentEngine()
