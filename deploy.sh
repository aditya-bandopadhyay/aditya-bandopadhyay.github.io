#!/bin/bash

# Deploy Script
# Usage: ./deploy.sh "Commit message"

MSG="$1"
if [ -z "$MSG" ]; then
    MSG="Update website content"
fi

echo "Deploying updates with message: '$MSG'"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Error: Git is not initialized in this directory."
    echo "Please run 'git init' and set up your remote origin first."
    exit 1
fi

echo "Adding files..."
git add .

echo "Committing..."
git commit -m "$MSG"

echo "Pushing to remote..."
git push origin main

if [ $? -ne 0 ]; then
    echo "Error: Push failed. Please check your network or git configuration."
    exit 1
fi

echo "Deployment successful!"
