import subprocess
import time
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

cmd = ["npx", "eas", "credentials", "-p", "android"]
print(f"Running command: {' '.join(cmd)}")

proc = subprocess.Popen(
    cmd,
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
    shell=True
)

time.sleep(3)

print("Sending 'preview' option to stdin...")
proc.stdin.write("preview\n")
proc.stdin.flush()

time.sleep(3)

print("Sending newline to stdin...")
proc.stdin.write("\n")
proc.stdin.flush()

time.sleep(5)

proc.terminate()
stdout_data, stderr_data = proc.communicate()

print("\n--- STDOUT ---")
print(stdout_data)
print("\n--- STDERR ---")
print(stderr_data)
