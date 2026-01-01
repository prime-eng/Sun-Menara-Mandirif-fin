import urllib.request
import json

# Test the forgot password endpoint
url = 'http://127.0.0.1:5000/forgot_password'
data = {'email': 'primasampurna9@gmail.com'}
headers = {'Content-Type': 'application/json'}

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(f"Status: {response.getcode()}")
        print(f"Response: {result}")
except Exception as e:
    print(f"Error: {e}")
