import requests, json, sys
url='http://127.0.0.1:8000/api/privacy/scan'
payload={"text":"Contact John Doe at john.doe@example.com or +1-555-123-4567. SSN: 123-45-6789. Password: Pa$$w0rd!"}
resp=requests.post(url, json=payload)
print('status', resp.status_code)
print(json.dumps(resp.json(), indent=2)[:1000])
