import zlib
import bz2
import lzma

with open('d:/Rangritti/scratch/failed_gradle_logs.txt', 'rb') as f:
    data = f.read()

# Try Zlib
try:
    dec = zlib.decompress(data)
    print("Successfully decompressed with zlib! Length:", len(dec))
    with open('d:/Rangritti/scratch/failed_gradle_logs_decoded.txt', 'wb') as f_out:
        f_out.write(dec)
except Exception as e:
    print("Zlib failed:", e)

# Try Zlib with wbits (raw deflate / gzip)
try:
    dec = zlib.decompress(data, zlib.MAX_WBITS | 32)
    print("Successfully decompressed with gzip/zlib wbits! Length:", len(dec))
    with open('d:/Rangritti/scratch/failed_gradle_logs_decoded.txt', 'wb') as f_out:
        f_out.write(dec)
except Exception as e:
    print("Gzip/Zlib wbits failed:", e)

# Try BZ2
try:
    dec = bz2.decompress(data)
    print("Successfully decompressed with BZ2! Length:", len(dec))
except Exception as e:
    print("BZ2 failed:", e)

# Try LZMA
try:
    dec = lzma.decompress(data)
    print("Successfully decompressed with LZMA! Length:", len(dec))
except Exception as e:
    print("LZMA failed:", e)

# Try Brotli if installed
try:
    import brotli
    dec = brotli.decompress(data)
    print("Successfully decompressed with Brotli! Length:", len(dec))
except Exception as e:
    print("Brotli failed:", e)
