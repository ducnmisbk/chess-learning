# 🚀 Deployment Architecture & DevOps Guide

## System Architecture Overview

### Architecture Philosophy

This is an **offline-first PWA** (Progressive Web App), meaning:
- Most logic runs in the browser
- Minimal backend requirements
- Static assets served via CDN
- Optional API for advanced features only

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    CloudFront (CDN)                     │ │
│  │              Global Edge Locations                      │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│                    │                                         │
│  ┌─────────────────▼──────────────┐  ┌──────────────────┐  │
│  │         S3 Bucket               │  │   CloudFront     │  │
│  │   Static Site Hosting           │  │   Functions      │  │
│  │   - HTML/CSS/JS (gzipped)      │  │   (Edge Lambda)  │  │
│  │   - Assets (pieces, sounds)    │  │                  │  │
│  │   - service-worker.js          │  └──────────────────┘  │
│  └────────────────────────────────┘                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Optional Backend Services                  │ │
│  │                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌─────────┐ │ │
│  │  │   ECS/Fargate│    │   API Gateway│    │ Lambda  │ │ │
│  │  │   Container  │───►│   REST API   │───►│Functions│ │ │
│  │  │              │    │              │    │         │ │ │
│  │  │ AI Explanation│   │  Rate Limit  │    │Analytics│ │ │
│  │  │   Service    │    │   Caching    │    │         │ │ │
│  │  └──────────────┘    └──────────────┘    └─────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Monitoring & Analytics                     │ │
│  │                                                         │ │
│  │  [CloudWatch] [X-Ray] [CloudWatch Logs] [EventBridge] │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

         User Devices
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Desktop │  │ Tablet  │  │ Mobile  │
    │ Browser │  │  (iPad) │  │ Browser │
    └─────────┘  └─────────┘  └─────────┘
         │            │            │
         └────────────┴────────────┘
              CloudFront CDN
        (Cached at edge locations)
```

---

## Service Breakdown

### 1. Frontend PWA (Primary Service)

**Purpose**: Main chess game application

**Technology Stack**:
- HTML5 + CSS3 + TypeScript
- Vite build tool
- Service Worker for offline
- IndexedDB for local storage

**Infrastructure**:
- **Development**: Docker container with Vite dev server
- **Production**: Static files on S3 + CloudFront CDN

**Container Size Target**: <100MB (multi-stage build)

---

### 2. AI Explanation API (Optional Service)

**Purpose**: Generate kid-friendly explanations for chess moves

**Technology Stack**:
- Node.js/Express or Python/FastAPI
- OpenAI API integration
- Redis for caching

**Infrastructure**:
- **Development**: Docker container
- **Production**: AWS ECS Fargate or Lambda

**Container Size Target**: <200MB

---

### 3. Analytics Service (Optional)

**Purpose**: Track usage patterns (privacy-focused, local only)

**Technology Stack**:
- Lightweight event collector
- Time-series database

**Infrastructure**:
- **Production**: AWS Lambda + DynamoDB

---

## Docker Architecture

### Multi-Stage Build Strategy

We'll use **multi-stage builds** to minimize image sizes:

1. **Build stage**: Full tools (Node.js, npm, TypeScript)
2. **Production stage**: Only runtime + compiled assets

### Image Size Optimization

| Service | Base Image | Final Size | Optimization |
|---------|------------|------------|--------------|
| Frontend (dev) | node:20-alpine | ~150MB | Dev dependencies only |
| Frontend (prod) | nginx:alpine | ~50MB | Static files only |
| AI API | node:20-alpine | ~180MB | Production deps only |
| AI API (Lambda) | AWS Lambda runtime | ~50MB | Compiled + slim deps |

---

## Dockerfile Implementations

### 1. Frontend Dockerfile (Multi-Stage)

**Location**: `./Dockerfile`

Features:
- Multi-stage build (build + serve)
- Alpine Linux for minimal size
- Nginx for production serving
- Gzip compression
- Caching optimization

### 2. AI API Dockerfile

**Location**: `./services/ai-api/Dockerfile`

Features:
- Node.js Alpine base
- Production-only dependencies
- Health check endpoint
- Non-root user

### 3. Development Environment

**Location**: `./docker-compose.yml`

Features:
- Hot reload for development
- Volume mounts for code
- Isolated networks
- Service dependencies

---

## AWS Deployment Architecture

### Tier 1: Static Site (MVP - Cheapest)

**Cost**: ~$1-5/month for low traffic

```
User → CloudFront → S3 Bucket
        (CDN)      (Static Files)
```

**Components**:
- **S3**: Host static files
- **CloudFront**: Global CDN, HTTPS
- **Route 53**: DNS (optional)
- **ACM**: SSL certificate (free)

**Pros**:
- Extremely cheap
- Highly scalable
- Low maintenance
- Fast globally

**Cons**:
- No dynamic backend
- No AI explanations (unless client-side API calls)

---

### Tier 2: Static + Serverless API (Recommended)

**Cost**: ~$10-50/month depending on usage

```
User → CloudFront → S3 (Static)
         ↓
      API Gateway → Lambda → (OpenAI API)
                     ↓
                  DynamoDB (cache)
```

**Components**:
- Everything from Tier 1
- **API Gateway**: REST endpoints for AI
- **Lambda**: Serverless compute
- **DynamoDB**: Caching, analytics
- **Secrets Manager**: API keys

**Pros**:
- Pay per use
- Auto-scaling
- No server management
- Cost-effective for variable load

**Cons**:
- Cold start latency (1-2s first request)
- More complex deployment

---

### Tier 3: Static + Container API (High Traffic)

**Cost**: ~$50-200/month base cost

```
User → CloudFront → S3 (Static)
         ↓
      ALB → ECS Fargate → ECR (Container Image)
                ↓
            ElastiCache (Redis)
                ↓
            RDS (optional)
```

**Components**:
- **ALB**: Application Load Balancer
- **ECS Fargate**: Managed containers
- **ECR**: Container registry
- **ElastiCache**: Redis for caching
- **RDS**: PostgreSQL (if needed)

**Pros**:
- Consistent performance
- No cold starts
- More control
- Good for high traffic

**Cons**:
- Higher base cost
- More complex
- Need to manage scaling

---

## Infrastructure as Code (IaC)

### AWS CDK (Recommended)

**Why CDK over Terraform?**
- Native AWS integration
- TypeScript (same as project)
- Better AWS service coverage
- L2 constructs simplify config

### Terraform (Alternative)

**Why Terraform?**
- Cloud agnostic
- Larger community
- Better for multi-cloud

---

## CI/CD Pipeline

### GitHub Actions Workflow

```
┌─────────────┐
│ Git Push    │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────┐
│  GitHub Actions                              │
│                                              │
│  1. Lint & Type Check                       │
│  2. Run Unit Tests                           │
│  3. Build Docker Image                       │
│  4. Push to ECR                              │
│  5. Deploy to Staging (auto)                 │
│  6. Run E2E Tests                            │
│  7. Deploy to Production (manual approval)   │
└──────────────────────────────────────────────┘
       │
┌──────▼──────┐
│   AWS       │
│ CloudFront  │
│     S3      │
└─────────────┘
```

---

## Environment Strategy

### Development
- Local Docker Compose
- Hot reload enabled
- Mock APIs
- Local storage only

### Staging
- AWS (isolated account or different region)
- Real infrastructure (scaled down)
- Test data
- Same deployment process as production

### Production
- AWS primary region (us-east-1 or closest to users)
- CDN with global edge locations
- Real user data
- Auto-scaling enabled
- Monitoring & alerts

---

## Cost Estimation

### MVP (Static Only)
```
S3 Storage: $0.023/GB        → ~$0.50/month (20GB assets)
CloudFront: $0.085/GB        → ~$2-5/month (100GB transfer)
Route 53: $0.50/month        → $0.50/month
SSL Certificate: Free        → $0
------------------------------------------------------
Total: ~$3-6/month
```

### With AI API (Serverless)
```
Lambda: $0.20/1M requests    → ~$5-20/month
API Gateway: $3.50/1M        → ~$3-10/month
DynamoDB: On-demand          → ~$2-5/month
OpenAI API: Variable         → ~$20-100/month
------------------------------------------------------
Total: ~$33-141/month
```

### With Container API (Always On)
```
Fargate: $0.04/vCPU-hour     → ~$30/month (1 vCPU)
ElastiCache: $0.034/hour     → ~$25/month (t3.micro)
ALB: $0.0225/hour            → ~$16/month
------------------------------------------------------
Total: ~$71/month + other costs
```

---

## Security Considerations

### Frontend Security
- [ ] Content Security Policy (CSP)
- [ ] HTTPS only (enforced by CloudFront)
- [ ] Subresource Integrity (SRI) for CDN resources
- [ ] No sensitive data in localStorage
- [ ] Input sanitization

### API Security
- [ ] API Gateway throttling (prevent abuse)
- [ ] WAF rules (SQL injection, XSS)
- [ ] Secrets in AWS Secrets Manager
- [ ] CORS configuration
- [ ] Rate limiting per IP

### Container Security
- [ ] Non-root user in Docker
- [ ] Minimal base images (Alpine)
- [ ] Security scanning (Trivy, Snyk)
- [ ] Read-only root filesystem
- [ ] Secrets via environment variables

---

## Monitoring & Observability

### Metrics to Track
- **Frontend**: Page load time, error rate, offline usage
- **API**: Request latency, error rate, cache hit rate
- **Infrastructure**: CPU, memory, network, cost

### Tools
- **CloudWatch**: Metrics, logs, alarms
- **X-Ray**: Distributed tracing
- **CloudWatch RUM**: Real User Monitoring
- **CloudWatch Synthetics**: Uptime monitoring

### Alerting
- High error rate (>5%)
- High latency (p99 >2s)
- Budget exceeded
- SSL certificate expiration

---

## Backup & Disaster Recovery

### Data Backup
- **User Progress**: Stored locally in IndexedDB (user devices)
- **Analytics Data**: DynamoDB with point-in-time recovery
- **Asset Files**: S3 with versioning enabled

### DR Strategy
- **RTO** (Recovery Time Objective): <1 hour
- **RPO** (Recovery Point Objective): <24 hours (analytics only)
- **Multi-region**: Not required for MVP (can add later)

### Backup Plan
1. S3 versioning enabled
2. DynamoDB PITR enabled
3. Infrastructure as Code in Git
4. Regular restore testing (quarterly)

---

## Scalability Strategy

### Horizontal Scaling
- **Frontend**: Auto-scaled by CloudFront edge locations
- **API (Serverless)**: Auto-scaled by Lambda
- **API (Container)**: ECS auto-scaling based on CPU/memory

### Vertical Scaling
- Not needed for frontend (static)
- Container: Can increase vCPU/memory as needed

### Caching Strategy
```
Browser Cache (7 days)
    ↓
CloudFront Cache (1 day)
    ↓
Lambda Cache (1 hour)
    ↓
DynamoDB Cache
    ↓
OpenAI API
```

---

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up

# Frontend: http://localhost:5173
# API: http://localhost:3000
# Redis: localhost:6379
```

### Building for Production
```bash
# Build optimized Docker image
docker build -t chess-game:latest .

# Test locally
docker run -p 8080:80 chess-game:latest

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/chess-game:latest
```

### Deployment
```bash
# Deploy to AWS (using CDK)
cd infrastructure/
cdk deploy chess-learning-stack

# Or using CLI
aws s3 sync ./dist s3://chess-learning-prod --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

---

## Performance Optimization

### Frontend Optimization
- [x] Gzip/Brotli compression
- [x] Image optimization (WebP, lazy loading)
- [x] Code splitting (Vite automatic)
- [x] Service Worker caching
- [x] Critical CSS inlining
- [ ] HTTP/2 Server Push (CloudFront)
- [ ] Preload key resources

### API Optimization
- [ ] Response caching (Redis)
- [ ] Connection pooling
- [ ] Compression middleware
- [ ] Query optimization

### Asset Optimization
- [ ] Convert PNG to WebP (smaller)
- [ ] SVG optimization (SVGO)
- [ ] Audio compression
- [ ] Lazy load non-critical assets

---

## Comparison: Deployment Options

| Feature | S3 + CloudFront | S3 + Lambda | ECS Fargate |
|---------|----------------|-------------|-------------|
| **Cost (low traffic)** | ⭐⭐⭐⭐⭐ $3/mo | ⭐⭐⭐⭐ $30/mo | ⭐⭐ $70/mo |
| **Cost (high traffic)** | ⭐⭐⭐⭐⭐ Scales well | ⭐⭐⭐ Pay per use | ⭐⭐ Fixed cost |
| **Cold Start** | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐ 1-2s | ⭐⭐⭐⭐⭐ None |
| **Complexity** | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐ Medium | ⭐⭐ Complex |
| **Maintenance** | ⭐⭐⭐⭐⭐ Zero | ⭐⭐⭐⭐ Low | ⭐⭐⭐ Medium |
| **AI Features** | ❌ Client-side only | ✅ Full support | ✅ Full support |
| **Scalability** | ⭐⭐⭐⭐⭐ Infinite | ⭐⭐⭐⭐ Very high | ⭐⭐⭐⭐ Configurable |

**Recommendation for MVP**: S3 + CloudFront (add Lambda later if needed)

---

## Migration Path

### Phase 1: MVP (Week 1-10)
- Deploy static site to S3 + CloudFront
- No backend needed
- AI explanations: Client-side only or skip

### Phase 2: Add AI (Week 11+)
- Deploy Lambda function for AI API
- Add API Gateway
- Add DynamoDB for caching
- Enable AI explanations in Guided Play

### Phase 3: Scale (When traffic grows)
- Add ElastiCache for better caching
- Consider ECS if Lambda limits hit
- Add multi-region (if global users)
- Add analytics pipeline

---

## Summary

### Recommended Architecture for This Project

**MVP (Months 1-3)**:
```
User → CloudFront → S3
     (Static PWA, fully functional offline)
```

**With AI Features (Months 4-6)**:
```
User → CloudFront → S3 (Static)
         ↓
      API Gateway → Lambda → OpenAI
                      ↓
                  DynamoDB
```

**At Scale (Year 1+)**:
```
User → CloudFront → S3 + Edge Lambda
         ↓
      ALB → ECS Fargate → Redis
               ↓
           OpenAI API
               ↓
          DynamoDB
```

### Key Principles
1. **Start Simple**: Static site first
2. **Add Complexity When Needed**: Don't over-engineer
3. **Optimize for Cost**: This is for kids/schools (budget-conscious)
4. **Offline-First**: Core functionality doesn't need backend
5. **Serverless Where Possible**: Lower ops burden

---

## Next Steps

1. Review [Dockerfile](Dockerfile)
2. Review [docker-compose.yml](docker-compose.yml)
3. Review [AWS CDK Infrastructure](infrastructure/)
4. Review [CI/CD Pipeline](.github/workflows/)
5. Start with MVP deployment (S3 + CloudFront)

See individual implementation files for detailed code and configurations.
