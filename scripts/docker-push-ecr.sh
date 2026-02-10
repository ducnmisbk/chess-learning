#!/bin/bash

# Push Docker image to AWS ECR

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
REPOSITORY_NAME="chess-learning"
IMAGE_TAG="${1:-latest}"

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "❌ AWS_ACCOUNT_ID environment variable not set"
    echo "Usage: export AWS_ACCOUNT_ID=123456789012"
    exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPOSITORY="${ECR_REGISTRY}/${REPOSITORY_NAME}"

echo "🐳 Pushing to AWS ECR..."
echo "Registry: $ECR_REGISTRY"
echo "Repository: $REPOSITORY_NAME"
echo "Tag: $IMAGE_TAG"
echo ""

# Check if repository exists, create if not
echo "Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names "$REPOSITORY_NAME" --region "$AWS_REGION" &>/dev/null; then
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name "$REPOSITORY_NAME" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true
fi

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Tag image
echo "Tagging image..."
docker tag "chess-learning:${IMAGE_TAG}" "${ECR_REPOSITORY}:${IMAGE_TAG}"
docker tag "chess-learning:${IMAGE_TAG}" "${ECR_REPOSITORY}:latest"

# Push
echo "Pushing image..."
docker push "${ECR_REPOSITORY}:${IMAGE_TAG}"
docker push "${ECR_REPOSITORY}:latest"

echo ""
echo "✅ Push complete!"
echo ""
echo "Image URI: ${ECR_REPOSITORY}:${IMAGE_TAG}"
