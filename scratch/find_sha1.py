import urllib.request
import json
import ssl
import brotli
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://storage.googleapis.com/eas-workflows-production/logs/068265c0-b59b-4742-b674-39b66151238f/18fa9214-96db-40f6-ac9c-1e4b2a24e046/2026-07-09T11%3A05%3A45Z-ad0e5254-64c7-4e2f-959b-cc1d722b01cc.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260709%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260709T153532Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=5d7cf27f99b0c53d53351e011c0c3de6b9200aec40e00c459b8eb9a5fd56756553d39e9e9da4ebc77eb87c888e18774e5c219a6d63a27afe2273473123d656610079206f743c532a849342166d569a6e936444f6d7787be9b6088c3db957d4f4eff7139ea1780fbb1c44a4900cd08d620a5ac1c6e9154dc55a8a9dd5d6bcdfc2d80d7255a0d2a0a403f0360e2c3151eda9aa023d194fa53141b45e5016eed5ccb2ab411a87a6bf0d7cd79ba6734f74f4327bd1623ac227e606c12ec7b5c25c7295a5f0505ddf68711f90ab6a03692291ae7d45e4be7448ff0c756a24c958c96b60ef0c4bc3a42f64b4bf0f2608a75af40117cb3ce6c6b18b99417d266734fb4f"

print("Downloading logs...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as response:
    compressed_data = response.read()

data = brotli.decompress(compressed_data)
lines = data.decode('utf-8').splitlines()

# Search pattern for 20 colons separated hex values: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
sha1_pattern = re.compile(r'(?:[0-9a-fA-F]{2}:){19}[0-9a-fA-F]{2}')

print("Searching logs for hex SHA1 pattern or key phrases...")
for idx, line in enumerate(lines):
    text = line
    try:
        obj = json.loads(line)
        text = obj.get('msg', '')
    except:
        pass
    
    match = sha1_pattern.search(text)
    if match:
        print(f"Match found at line {idx+1}: {text}")
    elif "credentials" in text.lower() or "keystore" in text.lower() or "certificate" in text.lower():
        print(f"L{idx+1}: {text}")
