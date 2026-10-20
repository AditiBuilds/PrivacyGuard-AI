# PrivacyGuard AI — Testing & Benchmark Methodology

## 1. Automated Test Strategy

The automated test suite evaluates both unit algorithms and end-to-end integration workflows:

- **PII Detection Patterns:** Unit tests verify email, phone, IPv4, IPv6, URL, Luhn credit card validation, SSN, secrets, and salutation person names.
- **Unicode & Character Slices:** Validates correct multi-byte Unicode handling and offset slicing.
- **Overlap Resolution:** Verifies that nested or adjacent detections resolve deterministically to the most specific, highest-severity span.
- **Risk Score Boundaries:** Verifies rule triggers, score caps, and auto-block behavior for unapproved purposes.
- **Prompt Injection Quarantine:** Verifies that adversarial instructions embedded in documents are caught and blocked.
- **Approval & Rejection Enforcement:** Verifies that rejected jobs cannot proceed to AI tool execution (HTTP 403 Forbidden).
- **Retention Cleanup:** Verifies that expired jobs are pruned and unlinked from security audit logs.

## 2. Benchmark Evaluation Formulas

The evaluation engine tests the detector against 100 ground-truth annotated synthetic workplace messages:

$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}$$

$$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}$$

$$\text{F1-Score} = \frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

### Zero Denominator Protection:
- If $\text{TP} + \text{FP} = 0$, $\text{Precision} = 0.0$
- If $\text{TP} + \text{FN} = 0$, $\text{Recall} = 0.0$
- If $\text{Precision} + \text{Recall} = 0$, $\text{F1} = 0.0$

## 3. Running Automated Tests

```bash
# Backend pytest suite
python -m pytest backend/tests/test_backend.py -v

# Frontend TypeScript & Vite build verification
cd frontend
npm run build
```
