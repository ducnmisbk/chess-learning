#!/bin/bash

# Simple AWS Deployment Script
# Deploys static site to S3 with CloudFront

set -e

# Configuration
PROJECT_NAME="chess-learning"
REGION="${AWS_REGION:-us-east-1}"
PROFILE="${AWS_PROFILE:-default}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Chess Learning - AWS Deployment Script"
echo "=========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "   brew install awscli  # macOS"
    echo "   pip install awscli   # Python"
    exit 1
fi

# Check if build exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}📦 Building project...${NC}"
    npm run build
fi

# Generate unique bucket name
TIMESTAMP=$(date +%s)
BUCKET_NAME="${PROJECT_NAME}-${TIMESTAMP}"

echo -e "${GREEN}📋 Configuration:${NC}"
echo "   Region: $REGION"
echo "   Bucket: $BUCKET_NAME"
echo "   Profile: $PROFILE"
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Creating S3 bucket...${NC}"
aws s3 mb "s3://${BUCKET_NAME}" \
    --region "$REGION" \
    --profile "$PROFILE"

echo -e "${GREEN}Step 2: Configuring bucket for static hosting...${NC}"
aws s3 website "s3://${BUCKET_NAME}" \
    --index-document index.html \
    --error-document index.html \
    --profile "$PROFILE"

echo -e "${GREEN}Step 3: Uploading files...${NC}"

# Upload assets with long cache
aws s3 sync ./dist "s3://${BUCKET_NAME}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "service-worker.js" \
    --exclude "manifest.json" \
    --profile "$PROFILE"

# Upload HTML with short cache
aws s3 sync ./dist "s3://${BUCKET_NAME}" \
    --exclude "*" \
    --include "*.html" \
    --cache-control "public, max-age=3600, must-revalidate" \
    --profile "$PROFILE"

# Upload service worker with no cache
if [ -f "dist/service-worker.js" ]; then
    aws s3 cp ./dist/service-worker.js "s3://${BUCKET_NAME}/" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --profile "$PROFILE"
fi

# Upload manifest
if [ -f "dist/manifest.json" ]; then
    aws s3 cp ./dist/manifest.json "s3://${BUCKET_NAME}/" \
        --cache-control "public, max-age=86400" \
        --profile "$PROFILE"
fi

echo -e "${GREEN}Step 4: Setting bucket policy...${NC}"
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json \
    --profile "$PROFILE"

rm /tmp/bucket-policy.json

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "=========================================="
echo -e "${GREEN}📍 Your site is now live at:${NC}"
echo "   http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Add CloudFront for HTTPS and global CDN"
echo "   2. Configure custom domain"
echo "   3. Set up monitoring and alerts"
echo ""
echo -e "   Use CDK for full setup:"
echo -e "   ${GREEN}cd infrastructure/cdk && npm run deploy${NC}"
echo "=========================================="
echo ""

# Save bucket name for later
echo "$BUCKET_NAME" > .aws-bucket-name
echo -e "Bucket name saved to ${GREEN}.aws-bucket-name${NC}"
