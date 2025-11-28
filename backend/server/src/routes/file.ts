import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { uploadToS3, uploadMultipleToS3, deleteFromS3, deleteMultipleFromS3, extractKeyFromUrl } from '@/services/file';
import { isS3Configured } from '@/config/s3';

const router = express.Router();

// Configure multer to use memory storage for S3 uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images and common document types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 files
  }
});


// @route   POST /api/file/upload
// @desc    Upload to S3
// @access  Private
router.post('/upload', authenticate, upload.single('file'), [
  body('folder')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Folder must be between 1 and 50 characters')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!isS3Configured()) {
    throw createError('S3 upload service is not configured', 503);
  }

  if (!req.file) {
    throw createError('No file provided', 400);
  }

  // Validate it's actually an image
  if (!req.file.mimetype.startsWith('image/')) {
    throw createError('Only image files are allowed', 400);
  }

  const folder = req.body.folder || 'default';

  // Upload to S3
  const result = await uploadToS3(req.file, {
    folder,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024 // 5MB for images
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      file: { 
        url: result.fileUrl,
        key: result.key,
        size: result.size,
        mimeType: result.mimeType,
        originalName: req.file.originalname
      }
    }
  });
}));


// @route   POST /api/file/upload-multiple
// @desc    Upload multiple images to S3
// @access  Private
router.post('/upload-multiple', authenticate, upload.array('files', 10), [
  body('folder')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Folder must be between 1 and 50 characters')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!isS3Configured()) {
    throw createError('S3 upload service is not configured', 503);
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw createError('No files provided', 400);
  }

  // Ensure all files are images
  const nonImage = files.find(f => !f.mimetype.startsWith('image/'));
  if (nonImage) {
    throw createError('Only image files are allowed', 400);
  }

  const folder = (req.body as any).folder || 'default';

  const results = await uploadMultipleToS3(files, {
    folder,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024 // 5MB per image
  });

  const uploadedFiles = results.map((result, index) => ({
    url: result.fileUrl,
    key: result.key,
    size: result.size,
    mimeType: result.mimeType,
    originalName: files[index].originalname
  }));

  res.status(201).json({
    success: true,
    message: `${uploadedFiles.length} file(s) uploaded successfully`,
    data: {
      files: uploadedFiles,
      count: uploadedFiles.length
    }
  });
}));


// (moved below to avoid route conflict with '/by-url' and '/delete-multiple')


// @route   DELETE /api/file/by-url
// @desc    Delete a file from S3 by full URL
// @access  Private
router.delete('/by-url', authenticate, [
  body('url')
    .isString()
    .trim()
    .isURL()
    .withMessage('Valid URL is required')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!isS3Configured()) {
    throw createError('S3 upload service is not configured', 503);
  }

  const { url } = req.body as { url: string };
  const key = extractKeyFromUrl(url);
  if (!key) {
    throw createError('Invalid S3 URL', 400);
  }

  await deleteFromS3(key);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
}));


// @route   DELETE /api/file/delete-multiple
// @desc    Delete multiple files from S3 (by keys or urls)
// @access  Private
router.delete('/delete-multiple', authenticate, [
  body('keys').optional().isArray({ min: 1 }).withMessage('keys must be a non-empty array'),
  body('keys.*').optional().isString().trim().isLength({ min: 1 }),
  body('urls').optional().isArray({ min: 1 }).withMessage('urls must be a non-empty array'),
  body('urls.*').optional().isString().trim().isURL()
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!isS3Configured()) {
    throw createError('S3 upload service is not configured', 503);
  }

  const { keys: keysInput, urls: urlsInput } = req.body as { keys?: string[]; urls?: string[] };

  let keys: string[] = Array.isArray(keysInput) ? keysInput.filter(Boolean) : [];
  if ((!keys || keys.length === 0) && Array.isArray(urlsInput)) {
    const derived = urlsInput
      .map(u => extractKeyFromUrl(u))
      .filter((k): k is string => typeof k === 'string' && k.length > 0);
    keys = derived;
  }

  if (!keys || keys.length === 0) {
    throw createError('Provide at least one key or url', 400);
  }

  await deleteMultipleFromS3(keys);

  res.json({
    success: true,
    message: `${keys.length} file(s) deleted successfully`
  });
}));

// @route   DELETE /api/file/:key(*)
// @desc    Delete a file from S3 by key
// @access  Private
router.delete('/:key(*)', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!isS3Configured()) {
    throw createError('S3 upload service is not configured', 503);
  }

  const key = req.params.key;
  if (!key) {
    throw createError('File key is required', 400);
  }

  await deleteFromS3(key);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
}));

export default router;
