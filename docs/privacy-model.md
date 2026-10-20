# PrivacyGuard AI — Privacy & Threat Model

## 1. Scope & Disclaimer

PrivacyGuard AI is an educational prototype and decision-support assistant designed to demonstrate privacy engineering concepts, explainable risk scoring, and bounded autonomous agents. **It does not constitute formal legal counsel or certified GDPR / CCPA compliance guarantee.**

## 2. Recognized Entity Categories

| Category | Description | Detection Technique | Severity |
| :--- | :--- | :--- | :--- |
| `EMAIL` | RFC-5322 compliant email addresses | Regex & domain validation | High |
| `PHONE` | International (E.164), US, and UK numbers | Regex with digit density check | High |
| `IP_ADDRESS` | IPv4 & IPv6 addresses | Regex with 0-255 octet validation | Medium |
| `URL` | Web URLs and service endpoints | Uniform URL regex pattern | Low |
| `CREDIT_CARD` | 13-19 digit payment cards | Pattern matching + Luhn Checksum | Critical |
| `SSN` | US Social Security Numbers | Standard format matching | Critical |
| `SECRET` | API keys, AWS tokens, JWTs, passwords | High-entropy prefix & key heuristics | Critical |
| `PERSON` | Individual customer or employee names | Salutation heuristics & common name lexicon | Medium |
| `LOCATION` | Cities, regions, countries | Geographic dictionary & address keywords | Low |

## 3. Explainable Risk Scoring Engine

The risk engine computes a deterministic score between `0` and `100` using documented policy rules:

- **Financial Data:** Credit card matches add `+35` points per finding (capped at `70`).
- **Secrets & Credentials:** API tokens and passwords add `+35` points per finding (capped at `70`).
- **Government IDs:** SSNs add `+30` points per finding (capped at `60`).
- **Contact Identifiers:** Direct email/phone matches add `+12` points per finding (capped at `36`).
- **Quasi-Identifiers:** IP addresses, names, locations add `+8` points per finding (capped at `24`).
- **Density Multiplier:** Documents containing > 5 findings receive a `+15` point volume multiplier.
- **Purpose Validation:** Unapproved purposes (e.g. `marketing_profiling`) add `+35` points and trigger an automatic policy block.
- **External Forwarding:** Routing documents to `external_api` while `local_only_processing` is active adds `+40` points and blocks transmission.

### Risk Categories:
- **Low (0 - 29):** Standard local automated processing.
- **Medium (30 - 59):** Data minimization applied; automated approval for recognized purposes.
- **High (60 - 84):** Mandatory pause for human reviewer sign-off.
- **Critical (85 - 100):** Human review mandatory or automated block if unauthorized.

## 4. Reverse Offset Redaction Algorithm

To prevent character offset corruption when replacing multiple matches:
1. All detected entity spans `[start_offset, end_offset]` are resolved for overlaps.
2. Numbered tokens are assigned deterministically in ascending document order: `[EMAIL_1]`, `[EMAIL_2]`.
3. Slicing substitutions are executed in **descending (reverse) offset order**. This guarantees that modifying the tail of the document never alters character indices for earlier spans.
