import { S3Client } from '@aws-sdk/client-s3';

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'AWS_S3_REQUEST_URL',
  'AWS_S3_IMAGE_PATH'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing S3 configuration: ${missingVars.join(', ')}`);
  console.warn('S3 upload functionality will not be available.');
}

// Create S3 client with configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Export bucket name, request URL, and image path for use in upload service
export const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
export const s3RequestUrl = process.env.AWS_S3_REQUEST_URL || '';
export const s3ImagePath = process.env.AWS_S3_IMAGE_PATH || '';

// Check if S3 is properly configured
export const isS3Configured = (): boolean => {
  return missingVars.length === 0;
};

