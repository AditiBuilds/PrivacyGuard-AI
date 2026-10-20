import requests, json
base='http://127.0.0.1:8000/api'
text='Contact John Doe at john.doe@example.com or +1-555-123-4567. SSN: 123-45-6789. Password: Pa$$w0rd!'
# Scan
scan_resp=requests.post(f'{base}/privacy/scan', json={'text':text})
print('Scan status', scan_resp.status_code)
print('Findings', len(scan_resp.json().get('findings',[])))
# Redact
redact_resp=requests.post(f'{base}/privacy/redact', json={'text':text, 'mask_type':'mask'})
print('Redact status', redact_resp.status_code)
redacted=redact_resp.json().get('redacted_text','')
print('Redacted output:', redacted)
# Verify raw PII not present
missing = all(p not in redacted for p in ['john.doe@example.com','+1-555-123-4567','123-45-6789','Pa$$w0rd!','John Doe'])
print('Original PII removed?', missing)
