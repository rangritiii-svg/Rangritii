with open('d:/Rangritti/scratch/eas_build_logs.txt', 'rb') as f:
    header = f.read(50)
print("File header (hex):", header.hex())
print("File header (raw):", header)
