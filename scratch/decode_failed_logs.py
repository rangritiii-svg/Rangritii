import gzip

try:
    with gzip.open('d:/Rangritti/scratch/failed_gradle_logs.txt', 'rt', encoding='utf-8', errors='ignore') as f_in:
        content = f_in.read()
    with open('d:/Rangritti/scratch/failed_gradle_logs_decoded.txt', 'w', encoding='utf-8') as f_out:
        f_out.write(content)
    print("Successfully decompressed Gzip build logs.")
except Exception as e:
    print("Failed to decompress Gzip. Trying raw text read:", e)
    try:
        with open('d:/Rangritti/scratch/failed_gradle_logs.txt', 'r', encoding='utf-8', errors='ignore') as f_in:
            content = f_in.read()
        with open('d:/Rangritti/scratch/failed_gradle_logs_decoded.txt', 'w', encoding='utf-8') as f_out:
            f_out.write(content)
        print("Successfully copied raw logs.")
    except Exception as e2:
        print("Failed to copy raw logs:", e2)
