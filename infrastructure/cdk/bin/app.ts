#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChessLearningStack } from '../lib/chess-learning-stack';

const app = new cdk.App();

// ============================================
// Production Stack
// ============================================
new ChessLearningStack(app, 'ChessLearningProdStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // CloudFront requires us-east-1 for certificates
  },
  description: 'Chess Learning for Kids - Production',
  // Optional: Add custom domain
  // domainName: 'chess.yourdomain.com',
  // certificateArn: 'arn:aws:acm:us-east-1:ACCOUNT:certificate/ID',
  tags: {
    Environment: 'production',
    Project: 'ChessLearning',
    ManagedBy: 'CDK',
  },
});

// ============================================
// Staging Stack (optional)
// ============================================
new ChessLearningStack(app, 'ChessLearningStagingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Chess Learning for Kids - Staging',
  tags: {
    Environment: 'staging',
    Project: 'ChessLearning',
    ManagedBy: 'CDK',
  },
});

app.synth();
