# Infrastructure Documentation

## AWS CDK Deployment

### Prerequisites

```bash
# Install AWS CDK
npm install -g aws-cdk

# Configure AWS credentials
aws configure

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### Deploy

```bash
cd infrastructure/cdk

# Install dependencies
npm install

# Build TypeScript
npm run build

# Preview changes
npm run diff

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Outputs

After deployment, you'll see:
- **S3 Bucket Name**: Where static files are stored
- **CloudFront Distribution ID**: For cache invalidation
- **Website URL**: Your live site URL

### Cost Estimation

See [DEPLOYMENT_ARCHITECTURE.md](../DEPLOYMENT_ARCHITECTURE.md#cost-estimation) for detailed cost breakdown.

### Cleanup

```bash
# Destroy staging
cdk destroy ChessLearningStagingStack

# Destroy production (careful!)
cdk destroy ChessLearningProdStack
```

## Terraform Alternative

If you prefer Terraform over CDK, see `terraform/` directory (to be created if needed).

## Manual Deployment (No IaC)

### Via AWS Console

1. **Create S3 bucket** with static website hosting
2. **Create CloudFront distribution** pointing to S3
3. **Build project**: `npm run build`
4. **Upload**: `aws s3 sync ./dist s3://your-bucket --delete`
5. **Invalidate cache**: `aws cloudfront create-invalidation --distribution-id XXX --paths "/*"`

### Via CLI

```bash
# Build
npm run build

# Sync to S3
aws s3 sync ./dist s3://chess-learning-prod --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```
