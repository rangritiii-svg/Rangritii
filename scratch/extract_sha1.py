import urllib.request
import ssl
import subprocess

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

apk_url = "https://expo.dev/artifacts/eas/9pJERgYPt5XrQF0vuBnXRdzygz1hLzIAwLwPUOSbCks.apk"
local_apk = "d:/Rangritti/scratch/latest.apk"

print(f"Downloading APK from: {apk_url} ...")
req = urllib.request.Request(apk_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as response:
    with open(local_apk, 'wb') as out_file:
        out_file.write(response.read())

print("APK downloaded successfully. Running keytool to get SHA-1...")

cmd = ["keytool", "-printcert", "-jarfile", local_apk]
result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

print("\n--- keytool STDOUT ---")
print(result.stdout)

print("\n--- keytool STDERR ---")
print(result.stderr)
