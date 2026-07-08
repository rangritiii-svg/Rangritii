import urllib.request

url = (
    "https://storage.googleapis.com/eas-workflows-production/logs/"
    "068265c0-b59b-4742-b674-39b66151238f/095cdbb1-290a-4c39-9311-b1fcbc789c8d/"
    "2026-07-08T03%3A24%3A41Z-a433459d-1c4b-4078-b7c7-a4b282c0810a.txt?"
    "X-Goog-Algorithm=GOOG4-RSA-SHA256&"
    "X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260708%2Fauto%2Fstorage%2Fgoog4_request&"
    "X-Goog-Date=20260708T083606Z&"
    "X-Goog-Expires=900&"
    "X-Goog-SignedHeaders=host&"
    "X-Goog-Signature=1021550a696850e1a32b49f15c005717595fa75e20d85ef2d3152530f5bebac9331dc19f47214f5b590d4d6c37ceb1007e0cb86f53ccfe35572306dd259373264616190406631079c148a440ede0d140ebc7d6b74e3035a2ad057d692d28487269bc3b7cb8287ab94e2fa9d117ef7942ac0e8aa6d57221976db22045d315177bd540c5aeab415f250422b43ae7b86f17ccad936786a3e5dd2dac27433e916d3ca77ca60fd6a10f7016b43019a6e37d9b3ee702ff4d73ca1c0f7f05c64da2b222a2d9f5982e6e205ddfbdaf8d945ab89d97d231678e6a517745b10c621b97fadcb0197d135da968b26bbf51906f7a6c012f087b7d5c55718d5fb41655cc7a5b92"
)

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        headers = response.info()
        print("Content-Type:", headers.get("Content-Type"))
        print("Content-Encoding:", headers.get("Content-Encoding"))
        print("Content-Length:", headers.get("Content-Length"))
        data = response.read(200)
        print("First 200 bytes:", data)
except Exception as e:
    print("Request failed:", e)
