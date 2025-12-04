import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, bucketName, s3RequestUrl, s3ImagePath, isS3Configured } from '@/config/s3';
import path from 'path';
import { createError } from '@/middleware/errorHandler';

export interface UploadOptions {
  folder?: string; // Optional folder prefix (e.g., 'products', 'avatars')
  allowedMimeTypes?: string[]; // Allowed MIME types
  maxSizeBytes?: number; // Max file size in bytes
}

export interface UploadResult {
  fileUrl: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
}

/**
 * Convert a string to ASCII-only by removing diacritics and non-ASCII chars.
 * S3 user-defined metadata must be ASCII; non-ASCII can cause signature errors.
 */
const toAscii = (value: string): string => {
  const normalized = value.normalize('NFKD');
  return normalized.replace(/[^\x00-\x7F]/g, '');
};

/**
 * Upload a file to S3 using AWS_S3_REQUEST_URL
 * @param file - Multer file object
 * @param options - Upload options
 * @returns Upload result with file URL and metadata
 */
export const uploadToS3 = async (
  file: Express.Multer.File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  // Check if S3 is configured
  if (!isS3Configured()) {
    throw createError('S3 is not properly configured. Please check environment variables.', 500);
  }

  const {
    folder = 'uploads',
    allowedMimeTypes = [],
    maxSizeBytes = 100 * 1024 * 1024 // Default 100MB
  } = options;

  // Validate file type if specified
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
    throw createError(
      `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      400
    );
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    throw createError(
      `File size exceeds maximum allowed size of ${maxSizeBytes / (1024 * 1024)}MB`,
      400
    );
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = path.extname(file.originalname);
  const sanitizedFilename = file.originalname
    .replace(fileExtension, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50);
  
  // Construct key with image path prefix
  const key = `${s3ImagePath}/${folder}/${timestamp}-${randomString}-${sanitizedFilename}${fileExtension}`;

  try {
    // Use Upload for better handling of large files and progress tracking
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Note: Public access is configured via bucket policy (see README for setup)
        // Add metadata
        Metadata: {
          // S3 metadata values must be ASCII-only. Remove diacritics and non-ASCII.
          originalName: toAscii(file.originalname) || `${sanitizedFilename}${fileExtension}`,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    await upload.done();

    // Construct the file URL using AWS_S3_REQUEST_URL
    const fileUrl = `${s3RequestUrl}/${key}`;

    return {
      fileUrl,
      key,
      bucket: bucketName,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw createError('Failed to upload file to S3', 500);
  }
};

/**
 * Upload multiple files to S3
 * @param files - Array of Multer file objects
 * @param options - Upload options
 * @returns Array of upload results
 */
export const uploadMultipleToS3 = async (
  files: Express.Multer.File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> => {
  if (!files || files.length === 0) {
    throw createError('No files provided for upload', 400);
  }

  // Upload all files in parallel
  const uploadPromises = files.map(file => uploadToS3(file, options));
  
  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple file upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param key - S3 object key
 * @returns Boolean indicating success
 */
export const deleteFromS3 = async (key: string): Promise<boolean> => {
  if (!isS3Configured()) {
    throw createError('S3 is not properly configured', 500);
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw createError('Failed to delete file from S3', 500);
  }
};

/**
 * Delete multiple files from S3
 * @param keys - Array of S3 object keys
 * @returns Boolean indicating success
 */
export const deleteMultipleFromS3 = async (keys: string[]): Promise<boolean> => {
  if (!keys || keys.length === 0) {
    return true;
  }

  const deletePromises = keys.map(key => deleteFromS3(key));
  
  try {
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Multiple file delete error:', error);
    throw error;
  }
};

/**
 * Extract S3 key from full URL (works with AWS_S3_REQUEST_URL)
 * @param url - Full S3 URL
 * @returns S3 object key
 */
export const extractKeyFromUrl = (url: string): string | null => {
  try {
    // Remove the base S3 request URL to get the key
    if (url.startsWith(s3RequestUrl)) {
      return url.replace(`${s3RequestUrl}/`, '');
    }
    
    // Fallback: try to parse as URL
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
};

