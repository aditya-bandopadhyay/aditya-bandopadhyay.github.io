#!/bin/bash

# Update Content Script
# This script automates the process of generating HTML from CSVs and injecting it into the website.

echo "Generating content from CSV files..."
python3 scripts/generate_content.py > generated_content.html

if [ $? -ne 0 ]; then
    echo "Error: Content generation failed."
    exit 1
fi

echo "Injecting content into HTML files..."
python3 scripts/inject_content.py

if [ $? -ne 0 ]; then
    echo "Error: Content injection failed."
    exit 1
fi

echo "Success! content updated."
