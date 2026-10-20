from typing import List, Dict, Any, Tuple

class Redactor:
    def redact(
        self,
        text: str,
        findings: List[Dict[str, Any]],
        mask_type: str = "token"  # "token" ([EMAIL_1]) or "redact" ([REDACTED])
    ) -> Tuple[str, List[Dict[str, Any]], Dict[str, str]]:
        if not text or not findings:
            return text, findings, {}

        # Sort findings by start offset ascending for numbering
        sorted_findings = sorted(findings, key=lambda f: f["start_offset"])
        
        # Assign deterministic token numbering per entity type
        entity_counters: Dict[str, int] = {}
        for f in sorted_findings:
            etype = f["entity_type"]
            entity_counters[etype] = entity_counters.get(etype, 0) + 1
            if mask_type == "token":
                f["token_label"] = f"[{etype}_{entity_counters[etype]}]"
            else:
                f["token_label"] = f"[REDACTED_{etype}]"

        # Now sort by start_offset descending so we can replace in reverse order without altering prior offsets
        reverse_findings = sorted(sorted_findings, key=lambda f: f["start_offset"], reverse=True)
        
        redacted_chars = list(text)
        token_mapping: Dict[str, str] = {}

        for f in reverse_findings:
            start = f["start_offset"]
            end = f["end_offset"]
            token = f["token_label"]
            
            # Record mapping using safe preview
            preview = f.get("match_preview", f["entity_type"])
            token_mapping[token] = preview
            
            # Replace character slice
            redacted_chars[start:end] = list(token)

        redacted_text = "".join(redacted_chars)
        return redacted_text, sorted_findings, token_mapping

redactor = Redactor()
