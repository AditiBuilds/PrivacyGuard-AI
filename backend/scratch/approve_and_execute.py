import requests, json
base='http://127.0.0.1:8000/api'
job_id='7bff3887-b3ce-4128-8bdf-83b4d87587a2'
# approve the pending_review job
resp=requests.post(f"{base}/jobs/{job_id}/approve", json={'approved':True,'reason':'test approval'})
print('Approve response', resp.status_code, resp.json())
# execute job (should run downstream task)
exec_resp=requests.post(f"{base}/jobs/{job_id}/execute")
print('Execute response', exec_resp.status_code, exec_resp.json())
# fetch final job details
final=requests.get(f"{base}/jobs/{job_id}")
print('Final job', final.status_code, final.json())
