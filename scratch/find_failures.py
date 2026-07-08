import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

with open('d:/Rangritti/scratch/failed_gradle_logs_4_decoded.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Searching for What went wrong in logs:")
for idx, line in enumerate(lines):
    if "what went wrong" in line.lower():
        start = max(0, idx - 2)
        end = min(len(lines), idx + 10)
        print(f"\n--- Match at line {idx+1} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j].strip()}")
