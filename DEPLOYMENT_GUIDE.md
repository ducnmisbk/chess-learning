# 🚀 Quick Start: Docker & AWS Deployment

## Option 1: Local Development (Docker Compose)

### Start Everything

```bash
# Clone and navigate to project
cd /Users/macbook/Desktop/Side-Projects/chess-learning

# Create .env file for AI API
cat > services/ai-api/.env << EOF
OPENAI_API_KEY=your-key-here
NODE_ENV=development
REDIS_URL=redis://redis:6379
EOF

# Start all services
docker-compose up

# Access:
# - Frontend: http://localhost:5173
# - AI API: http://localhost:3000
# - Redis: localhost:6379
```

### Test Production Build Locally

```bash
# Build production Docker image
docker build -t chess-learning:prod .

# Run locally
docker run -p 8080:80 chess-learning:prod

# Access: http://localhost:8080

# Check image size
docker images chess-learning:prod
# Should be < 50MB
```

---

## Option 2: Deploy to AWS (MVP - Static Only)

### Cost: ~$3-6/month

### Prerequisites

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
pip install awscli

# Configure AWS credentials
aws configure
```

### Quick Deploy Script

```bash
#!/bin/bash
# Save as: deploy-aws-simple.sh

set -e

BUCKET_NAME="chess-learning-prod-$(date +%s)"
REGION="us-east-1"

echo "🚀 Deploying Chess Learning to AWS..."

# 1. Build production
echo "📦 Building..."
npm run build

# 2. Create S3 bucket
echo "☁️  Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# 3. Enable static website hosting
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# 4. Upload files
echo "⬆️  Uploading files..."
aws s3 sync ./dist s3://$BUCKET_NAME \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "*.html"

aws s3 sync ./dist s3://$BUCKET_NAME \
  --exclude "*" \
  --include "*.html" \
  --cache-control "max-age=3600"

# 5. Make public
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
    }]
  }"

echo "✅ Deployed!"
echo "🌍 URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
```

Run it:

```bash
chmod +x deploy-aws-simple.sh
./deploy-aws-simple.sh
```

---

## Option 3: Full AWS Deployment (CDK)

### Cost: ~$5-10/month (with CloudFront)

### Setup

```bash
# Install CDK
npm install -g aws-cdk

# Bootstrap (first time only)
cdk bootstrap aws://YOUR-ACCOUNT/us-east-1

# Navigate to infrastructure
cd infrastructure/cdk

# Install dependencies
npm install
```

### Deploy

```bash
# Build TypeScript
npm run build

# Preview changes
npm run diff

# Deploy to production
npm run deploy:prod

# Outputs will show:
# - CloudFront URL (https://d111111.cloudfront.net)
# - S3 Bucket name
# - Distribution ID
```

### Update Deployment

```bash
# Build app
cd ../..
npm run build

# Deploy updated files
cd infrastructure/cdk
npm run deploy:prod
```

---

## Option 4: GitHub Actions CI/CD

### Setup Secrets

Go to GitHub repo → Settings → Secrets and add:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CLOUDFRONT_DISTRIBUTION_ID=E...
SLACK_WEBHOOK=https://hooks.slack.com/... (optional)
```

### Automatic Deployment

Push to `main` branch:

```bash
git add .
git commit -m "Deploy to AWS"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Run tests
2. 🐳 Build Docker image
3. ☁️  Deploy to S3
4. 🗑️  Invalidate CloudFront cache
5. 📬 Send Slack notification

---

## Deployment Comparison

| Method | Cost/month | Complexity | Time to Deploy | Best For |
|--------|------------|------------|----------------|----------|
| **Local Docker** | $0 | ⭐ Easy | < 5 min | Development |
| **S3 Simple** | ~$3 | ⭐⭐ Medium | 10 min | Quick test |
| **S3 + CDK** | ~$5 | ⭐⭐⭐ Medium | 20 min | Production |
| **S3 + CDK + API** | ~$30 | ⭐⭐⭐⭐ Hard | 30 min | Full features |

---

## Quick Commands Reference

### Docker

```bash
# Development
docker-compose up                    # Start all services
docker-compose down                  # Stop all services
docker-compose logs -f frontend      # View logs

# Production
docker build -t chess:prod .         # Build image
docker run -p 8080:80 chess:prod    # Run container
docker images                        # Check image size
```

### AWS CLI

```bash
# S3
aws s3 sync ./dist s3://bucket --delete
aws s3 ls s3://bucket

# CloudFront
aws cloudfront create-invalidation \
  --distribution-id E123 \
  --paths "/*"

# View logs
aws cloudfront get-distribution --id E123
```

### CDK

```bash
# Inside infrastructure/cdk/
npm run build                        # Compile TypeScript
npm run diff                         # Preview changes
npm run deploy:prod                  # Deploy production
npm run deploy:staging               # Deploy staging
cdk destroy ChessLearningProdStack   # Delete stack
```

---

## Monitoring

### CloudWatch Metrics (after deployment)

```bash
# View distribution metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E123 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### View Logs

```bash
# CloudFront logs (if enabled)
aws s3 ls s3://chess-learning-logs/

# Container logs (if using ECS)
aws logs tail /aws/ecs/chess-learning --follow
```

---

## Troubleshooting

### Issue: Docker image too large (>100MB)

**Solution**: Check multi-stage build

```bash
# Inspect layers
docker history chess-learning:prod

# Should show minimal alpine nginx image
```

### Issue: CloudFront shows old version

**Solution**: Invalidate cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_ID \
  --paths "/*"
```

### Issue: S3 bucket not accessible

**Solution**: Check bucket policy

```bash
aws s3api get-bucket-policy --bucket chess-learning-prod
```

### Issue: GitHub Actions failing

**Solution**: Check secrets

```bash
# In repo Settings → Secrets → Actions
# Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
```

---

## Cost Optimization Tips

1. **Use CloudFront** - Reduces S3 data transfer costs
2. **Enable Gzip/Brotli** - Smaller file sizes
3. **Set long cache TTLs** - Fewer origin requests
4. **Use S3 Lifecycle** - Delete old versions
5. **Monitor usage** - Set billing alerts

### Set Billing Alert

```bash
# Create SNS topic
aws sns create-topic --name billing-alerts

# Subscribe to email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123:billing-alerts \
  --protocol email \
  --notification-endpoint your@email.com

# Create CloudWatch alarm (via console or CLI)
# Alert when estimated charges > $20
```

---

## Security Checklist

- [x] HTTPS enforced (CloudFront)
- [x] S3 bucket not public (use CloudFront OAI)
- [x] CSP headers configured (nginx.conf)
- [x] Secrets in GitHub Secrets / AWS Secrets Manager
- [x] IAM least privilege (CDK generates minimal policies)
- [x] Versioning enabled on S3 (backup)
- [x] CloudWatch logs enabled
- [ ] WAF rules (optional, for production)
- [ ] DDoS protection (AWS Shield, included with CloudFront)

---

## Next Steps After Deployment

1. **Test on multiple devices**
   - Desktop browsers
   - iPad (primary target)
   - Mobile phones

2. **Test offline mode**
   - Disconnect network
   - Verify game still works
   - Check service worker caching

3. **Performance audit**
   ```bash
   # Lighthouse in Chrome DevTools
   # Or CLI:
   npm install -g lighthouse
   lighthouse https://your-cloudfront-url.com
   ```

4. **Set up monitoring**
   - CloudWatch dashboard
   - Billing alerts
   - Error tracking

5. **User testing**
   - Share with beta testers
   - Collect feedback
   - Iterate

---

## Support & Documentation

- **Main Docs**: [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md)
- **Implementation Plan**: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Assets Guide**: [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md)
- **Infrastructure**: [infrastructure/README.md](infrastructure/README.md)

---

**Quick Start Recommended Path**:

1. Development: `docker-compose up` → Local development
2. Test Build: `docker build` → Verify production build
3. MVP Deploy: Use CDK → Deploy to AWS
4. CI/CD: GitHub Actions → Automatic deployments

Good luck! 🚀
