import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface ChessLearningStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
}

export class ChessLearningStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: ChessLearningStackProps) {
    super(scope, id, props);

    // ============================================
    // S3 Bucket for Static Hosting
    // ============================================
    this.bucket = new s3.Bucket(this, 'ChessLearningBucket', {
      bucketName: `chess-learning-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false, // CloudFront OAI will handle access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep data on stack delete
      autoDeleteObjects: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true, // Enable versioning for rollback
      lifecycleRules: [
        {
          // Delete old versions after 30 days
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // ============================================
    // CloudFront Origin Access Identity
    // ============================================
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: 'OAI for Chess Learning app',
      }
    );

    this.bucket.grantRead(originAccessIdentity);

    // ============================================
    // CloudFront Distribution
    // ============================================
    const cachePolicy = new cloudfront.CachePolicy(this, 'CachePolicy', {
      cachePolicyName: 'ChessLearningCachePolicy',
      comment: 'Cache policy for Chess Learning assets',
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // Certificate (if custom domain)
    let certificate: acm.ICertificate | undefined;
    if (props?.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        props.certificateArn
      );
    }

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy,
        compress: true,
      },
      // Behavior for static assets (long cache)
      additionalBehaviors: {
        '/assets/*': {
          origin: new origins.S3Origin(this.bucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'AssetsCachePolicy', {
            defaultTtl: cdk.Duration.days(7),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.days(1),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
          compress: true,
        },
      },
      domainNames: props?.domainName ? [props.domainName] : undefined,
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      enableIpv6: true,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'LogBucket', {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(90),
          },
        ],
      }),
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // USA, Canada, Europe
      comment: 'Chess Learning for Kids - CDN',
    });

    // ============================================
    // Route53 DNS (if custom domain)
    // ============================================
    if (props?.domainName) {
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: props.domainName,
      });

      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(this.distribution)
        ),
      });
    }

    // ============================================
    // Deploy Assets from Local Build
    // ============================================
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../../../dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.maxAge(cdk.Duration.days(1)),
      ],
    });

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront domain name',
      exportName: 'ChessLearningDomain',
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: props?.domainName
        ? `https://${props.domainName}`
        : `https://${this.distribution.distributionDomainName}`,
      description: 'Website URL',
    });
  }
}
