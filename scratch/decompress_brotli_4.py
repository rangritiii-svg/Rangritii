import brotli

with open('d:/Rangritti/scratch/failed_gradle_logs_4.txt', 'rb') as f:
    compressed_data = f.read()

try:
    decompressed_data = brotli.decompress(compressed_data)
    with open('d:/Rangritti/scratch/failed_gradle_logs_4_decoded.txt', 'wb') as f_out:
        f_out.write(decompressed_data)
    print("Successfully decompressed Brotli logs.")
except Exception as e:
    print("Failed to decompress Brotli:", e)
