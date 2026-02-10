#!/bin/bash

# Build and test Docker image locally

set -e

PROJECT_NAME="chess-learning"
VERSION="${1:-latest}"

echo "🐳 Building Docker image..."
echo ""

# Build production image
docker build \
    -t "${PROJECT_NAME}:${VERSION}" \
    -t "${PROJECT_NAME}:latest" \
    --target production \
    .

echo ""
echo "✅ Build complete!"
echo ""

# Show image size
echo "📊 Image information:"
docker images "${PROJECT_NAME}:${VERSION}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

# Check if size is reasonable (<100MB)
SIZE=$(docker images "${PROJECT_NAME}:${VERSION}" --format "{{.Size}}")
echo "Image size: $SIZE"

if [[ $SIZE == *"MB"* ]]; then
    SIZE_NUM=$(echo $SIZE | sed 's/MB//')
    if (( $(echo "$SIZE_NUM < 100" | bc -l) )); then
        echo "✅ Image size is optimal (<100MB)"
    else
        echo "⚠️  Image size is larger than expected. Consider optimization."
    fi
fi

echo ""
echo "🚀 To run locally:"
echo "   docker run -p 8080:80 ${PROJECT_NAME}:${VERSION}"
echo ""
echo "🌍 Then open: http://localhost:8080"
echo ""

# Ask if user wants to run now
read -p "Run container now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting container..."
    docker run -p 8080:80 --rm "${PROJECT_NAME}:${VERSION}"
fi
