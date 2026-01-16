import csv
import os

BASE_DIR = '/home/aditya/shared_folder/CV material/'
PAPERS_CSV = os.path.join(BASE_DIR, 'CV Material - Aditya - PapersCV.csv')

with open(PAPERS_CSV, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    lines = list(reader)
    print(f"Total lines parsed: {len(lines)}")
    print("--- Row 0 ---")
    print(lines[0])
    print("--- Row 1 ---")
    print(lines[1])
    print("--- Row 2 ---")
    print(lines[2])
