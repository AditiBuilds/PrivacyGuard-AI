import requests, json
base='http://127.0.0.1:8000/api'
text='Contact John Doe at john.doe@example.com or +1-555-123-4567. SSN: 123-45-6789. Password: Pa$$w0rd!'
payload={
    'task_type':'privacy_report',
    'text':text,
    'processing_purpose':'support_triage',
    'processing_mode':'deterministic',
    'auto_execute':True
}
resp=requests.post(f'{base}/jobs', json=payload)
print('Create job status', resp.status_code)
print('Response:', resp.json())
job_id=resp.json().get('id')
if job_id:
    detail=requests.get(f'{base}/jobs/{job_id}')
    print('Job detail status', detail.status_code)
    print('Detail response:', detail.json())
