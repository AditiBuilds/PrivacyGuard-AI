import re
import ipaddress
from typing import List, Dict, Any, Optional

def validate_luhn(card_number_str: str) -> bool:
    """Validate a credit card number using Luhn's algorithm."""
    digits = [int(c) for c in card_number_str if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    
    checksum = 0
    reverse_digits = digits[::-1]
    for i, d in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = d * 2
            checksum += (doubled - 9) if doubled > 9 else doubled
        else:
            checksum += d
    return (checksum % 10) == 0

def mask_preview_value(val: str, entity_type: str) -> str:
    """Create a non-sensitive preview representation."""
    if entity_type == "EMAIL":
        parts = val.split("@")
        if len(parts) == 2:
            name, domain = parts
            masked_name = name[0] + "***" if len(name) > 1 else "*"
            return f"{masked_name}@{domain}"
    elif entity_type in ("CREDIT_CARD", "SSN"):
        digits = re.sub(r"\D", "", val)
        if len(digits) >= 4:
            return f"***-***-{digits[-4:]}"
    elif entity_type == "PHONE":
        digits = re.sub(r"\D", "", val)
        if len(digits) >= 4:
            return f"***-***-{digits[-4:]}"
    elif entity_type == "SECRET":
        return val[:3] + "..." + val[-3:] if len(val) > 8 else "******"
    elif entity_type == "IP_ADDRESS":
        octets = val.split(".")
        if len(octets) == 4:
            return f"{octets[0]}.{octets[1]}.*.*"
    elif entity_type == "PERSON":
        words = val.split()
        return " ".join([w[0] + "***" for w in words if w])
    
    if len(val) > 4:
        return val[:2] + "***" + val[-2:]
    return "***"

COMMON_NAMES = {
    "john", "jane", "alice", "bob", "charlie", "david", "emma", "fiona",
    "george", "hannah", "ian", "julia", "kevin", "laura", "michael",
    "nancy", "oliver", "peter", "quinn", "rachel", "samuel", "thomas",
    "victor", "wendy", "xavier", "yasmin", "zachary", "smith", "johnson",
    "williams", "brown", "jones", "garcia", "miller", "davis", "rodriguez",
    "martinez", "hernandez", "lopez", "gonzalez", "wilson", "anderson",
    "thomas", "taylor", "moore", "jackson", "martin", "lee", "perez", "thompson",
    "white", "harris", "sanchez", "clark", "ramirez", "lewis", "robinson", "walker",
    "young", "allen", "king", "wright", "scott", "torres", "nguyen", "hill",
    "flores", "green", "adams", "nelson", "baker", "hall", "rivera", "campbell",
    "mitchell", "carter", "roberts", "gomez", "phillips", "evans", "turner", "diaz"
}

COMMON_LOCATIONS = {
    "new york", "los angeles", "chicago", "houston", "london", "paris", "berlin",
    "tokyo", "sydney", "toronto", "singapore", "san francisco", "seattle", "boston",
    "california", "texas", "florida", "ontario", "germany", "france", "united states",
    "canada", "united kingdom", "australia", "japan", "brazil", "india", "washington"
}

class PiiDetector:
    def __init__(self):
        # Regular expression patterns
        self.email_pattern = re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        )
        self.phone_pattern = re.compile(
            r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
        )
        self.ipv4_pattern = re.compile(
            r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"
        )
        self.ipv6_pattern = re.compile(
            r"\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b"
        )
        self.url_pattern = re.compile(
            r"https?://(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)"
        )
        self.credit_card_pattern = re.compile(
            r"\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b"
        )
        self.ssn_pattern = re.compile(
            r"\b\d{3}-\d{2}-\d{4}\b"
        )
        self.secret_token_pattern = re.compile(
            r"\b(?:AKIA[0-9A-Z]{16}|ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*|bearer\s+[A-Za-z0-9_\-\.]{24,}|(?:api[_-]?key|secret[_-]?key|password)\s*[:=]\s*['\"]?([A-Za-z0-9!@#$%^&*_\-]{8,})['\"]?)\b",
            re.IGNORECASE
        )
        # Salutation-based Person pattern (e.g. Mr. John Doe, Dear Alice Smith)
        self.salutation_person_pattern = re.compile(
            r"\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Dear|Sincerely,|Customer:|Agent:)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b"
        )
        
        # Presidio Analyzer check - disabled (spaCy models unavailable)
        self.has_presidio = False
        self.presidio_analyzer = None

    def scan(self, text: str) -> List[Dict[str, Any]]:
        raw_findings: List[Dict[str, Any]] = []

        if not text:
            return []

        # 1. Email detection
        for match in self.email_pattern.finditer(text):
            raw_findings.append({
                "entity_type": "EMAIL",
                "start_offset": match.start(),
                "end_offset": match.end(),
                "confidence": 0.95,
                "detection_method": "rule",
                "severity": "High",
                "value": match.group(0),
            })

        # 2. URLs (Scan before phone / IP to prevent partial overlaps)
        for match in self.url_pattern.finditer(text):
            raw_findings.append({
                "entity_type": "URL",
                "start_offset": match.start(),
                "end_offset": match.end(),
                "confidence": 0.90,
                "detection_method": "rule",
                "severity": "Low",
                "value": match.group(0),
            })

        # 3. IP addresses (Validate octet 0-255)
        for match in self.ipv4_pattern.finditer(text):
            ip_str = match.group(0)
            try:
                ip_obj = ipaddress.IPv4Address(ip_str)
                # Filter out pure version strings like 1.0.0.0 if likely not an IP, or keep standard valid IP
                raw_findings.append({
                    "entity_type": "IP_ADDRESS",
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                    "confidence": 0.92,
                    "detection_method": "rule",
                    "severity": "Medium",
                    "value": ip_str,
                })
            except ipaddress.AddressValueError:
                pass

        for match in self.ipv6_pattern.finditer(text):
            raw_findings.append({
                "entity_type": "IP_ADDRESS",
                "start_offset": match.start(),
                "end_offset": match.end(),
                "confidence": 0.95,
                "detection_method": "rule",
                "severity": "Medium",
                "value": match.group(0),
            })

        # 4. Phone numbers
        for match in self.phone_pattern.finditer(text):
            val = match.group(0)
            # Ensure at least 7 digits to avoid simple math numbers
            digits_count = sum(c.isdigit() for c in val)
            if 7 <= digits_count <= 15:
                raw_findings.append({
                    "entity_type": "PHONE",
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                    "confidence": 0.88,
                    "detection_method": "rule",
                    "severity": "High",
                    "value": val,
                })

        # 5. SSN
        for match in self.ssn_pattern.finditer(text):
            raw_findings.append({
                "entity_type": "SSN",
                "start_offset": match.start(),
                "end_offset": match.end(),
                "confidence": 0.95,
                "detection_method": "rule",
                "severity": "Critical",
                "value": match.group(0),
            })

        # 6. Credit Card (with Luhn check)
        for match in self.credit_card_pattern.finditer(text):
            card_val = match.group(0)
            if validate_luhn(card_val):
                raw_findings.append({
                    "entity_type": "CREDIT_CARD",
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                    "confidence": 0.98,
                    "detection_method": "rule",
                    "severity": "Critical",
                    "value": card_val,
                })

        # 7. Secrets / API Keys / Passwords
        for match in self.secret_token_pattern.finditer(text):
            secret_val = match.group(0)
            raw_findings.append({
                "entity_type": "SECRET",
                "start_offset": match.start(),
                "end_offset": match.end(),
                "confidence": 0.92,
                "detection_method": "rule",
                "severity": "Critical",
                "value": secret_val,
            })

        # 8. Persons (Honorifics and Known Names)
        for match in self.salutation_person_pattern.finditer(text):
            # Extract the actual name group
            name_val = match.group(1)
            name_start = match.start(1)
            name_end = match.end(1)
            raw_findings.append({
                "entity_type": "PERSON",
                "start_offset": name_start,
                "end_offset": name_end,
                "confidence": 0.85,
                "detection_method": "heuristic_nlp",
                "severity": "Medium",
                "value": name_val,
            })

        # Also search word pairs or common names
        words = list(re.finditer(r"\b[A-Z][a-z]+\b", text))
        for i, word_match in enumerate(words):
            w = word_match.group(0).lower()
            if w in COMMON_NAMES:
                # Check if followed by another capitalized word (e.g. John Doe)
                if i + 1 < len(words) and words[i + 1].start() == word_match.end() + 1:
                    full_name = text[word_match.start():words[i + 1].end()]
                    raw_findings.append({
                        "entity_type": "PERSON",
                        "start_offset": word_match.start(),
                        "end_offset": words[i + 1].end(),
                        "confidence": 0.82,
                        "detection_method": "heuristic_nlp",
                        "severity": "Medium",
                        "value": full_name,
                    })
                else:
                    raw_findings.append({
                        "entity_type": "PERSON",
                        "start_offset": word_match.start(),
                        "end_offset": word_match.end(),
                        "confidence": 0.75,
                        "detection_method": "heuristic_nlp",
                        "severity": "Medium",
                        "value": word_match.group(0),
                    })

        # 9. Locations
        for loc in COMMON_LOCATIONS:
            pattern = re.compile(r"\b" + re.escape(loc) + r"\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                raw_findings.append({
                    "entity_type": "LOCATION",
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                    "confidence": 0.80,
                    "detection_method": "heuristic_nlp",
                    "severity": "Low",
                    "value": match.group(0),
                })

        # 10. Presidio integration if available
        if self.has_presidio and self.presidio_analyzer:
            try:
                results = self.presidio_analyzer.analyze(text=text, language="en")
                for res in results:
                    mapped_type = res.entity_type
                    if mapped_type == "EMAIL_ADDRESS":
                        mapped_type = "EMAIL"
                    elif mapped_type == "PHONE_NUMBER":
                        mapped_type = "PHONE"
                    raw_findings.append({
                        "entity_type": mapped_type,
                        "start_offset": res.start,
                        "end_offset": res.end,
                        "confidence": round(float(res.score), 2),
                        "detection_method": "presidio",
                        "severity": "High" if mapped_type in ("EMAIL", "PHONE") else "Medium",
                        "value": text[res.start:res.end],
                    })
            except Exception:
                pass

        # 11. Resolve overlaps deterministically
        resolved = self.resolve_overlaps(raw_findings, text)
        return resolved

    def resolve_overlaps(self, findings: List[Dict[str, Any]], text: str) -> List[Dict[str, Any]]:
        """
        Sort findings by start offset. When two findings overlap:
        - Give priority to higher severity (Critical > High > Medium > Low).
        - If equal severity, give priority to longer match.
        - If still equal, higher confidence wins.
        """
        severity_rank = {
            "Critical": 4,
            "High": 3,
            "Medium": 2,
            "Low": 1,
        }

        # Sort primarily by start_offset asc, then priority desc, then length desc
        def sort_key(f):
            return (
                f["start_offset"],
                -severity_rank.get(f.get("severity", "Medium"), 2),
                -(f["end_offset"] - f["start_offset"]),
                -f["confidence"]
            )

        sorted_findings = sorted(findings, key=sort_key)
        resolved: List[Dict[str, Any]] = []

        for candidate in sorted_findings:
            c_start = candidate["start_offset"]
            c_end = candidate["end_offset"]

            overlap = False
            for existing in resolved:
                e_start = existing["start_offset"]
                e_end = existing["end_offset"]

                # Check if ranges overlap: [c_start, c_end) and [e_start, e_end)
                if max(c_start, e_start) < min(c_end, e_end):
                    overlap = True
                    break

            if not overlap:
                # Add safe preview and copy
                candidate_copy = dict(candidate)
                val = candidate_copy.pop("value", text[c_start:c_end])
                candidate_copy["match_preview"] = mask_preview_value(val, candidate_copy["entity_type"])
                candidate_copy["redacted"] = True
                resolved.append(candidate_copy)

        # Sort finally by start_offset
        resolved.sort(key=lambda x: x["start_offset"])
        return resolved

detector = PiiDetector()
