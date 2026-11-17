import re

with open('/home/himanshu/Documents/Projects/nextwave/web/src/app/page.tsx', 'r') as f:
    orig = f.read()

print("Original lines:", orig.count('\n'))

