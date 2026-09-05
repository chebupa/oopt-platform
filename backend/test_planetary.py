import os
import urllib.request
import urllib.parse
from urllib.error import HTTPError, URLError

print("Testing Microsoft Planetary Computer STAC API...")
url = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
payload = b'{"collections":["sentinel-2-l2a"],"limit":1}'

req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(f"STAC Search Status: {response.status}")
except HTTPError as e:
    print(f"STAC Search Status: {e.code}")
    print(e.read().decode())
except URLError as e:
    print(f"URL Error: {e.reason}")
    print("In sandboxed environment, network access might be disabled.")

