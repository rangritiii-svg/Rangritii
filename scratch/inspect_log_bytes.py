with open('d:/Rangritti/scratch/failed_gradle_logs.txt', 'rb') as f:
    data = f.read(500)

print("First 500 bytes:")
print(data)
print("Hex representation:")
print(data.hex())
