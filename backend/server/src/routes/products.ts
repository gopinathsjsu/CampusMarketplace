import express from 'express';
import { body, query } from 'express-validator';
import multer from 'multer';
import Product from '@/models/Product';
import { authenticate, authorize, optionalAuth, AuthRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { uploadMultipleToS3, deleteMultipleFromS3, extractKeyFromUrl } from '@/services/file';

const router = express.Router();

// Configure multer for file uploads (memory storage for S3)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 images
  }
});

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'supplies', 'other']),
  query('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'poor']),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['price', 'createdAt', 'views']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validateRequest, optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const {
    page = 1,
    limit = 12,
    category,
    condition,
    minPrice,
    maxPrice,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter: any = { status: 'available' };

  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
  }

  if (search) {
    filter.$text = { $search: search as string };
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'userName profilePicture firstName lastName avatar university schoolName')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'userName profilePicture firstName lastName avatar university schoolName phone email');

  if (!product) {
    throw createError('Product not found', 404);
  }

  // Increment view count if user is not the seller
  if (!req.user || req.user._id.toString() !== product.seller._id.toString()) {
    await product.incrementViews();
  }

  res.json({
    success: true,
    data: { product }
  });
}));

// @route   POST /api/products
// @desc    Create a new product listing
// @access  Private (Seller only)
router.post('/', authenticate, authorize('seller', 'admin'), upload.array('images', 5), [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must be less than 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'supplies', 'other'])
    .withMessage('Invalid category'),
  body('condition')
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('location')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Location is required'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { title, description, price, category, condition, location, tags = [] } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw createError('At least one image is required', 400);
  }

  // Process uploaded images to S3
  const uploadResults = await uploadMultipleToS3(files, { folder: 'products' });
  const images = uploadResults.map(result => result.fileUrl);

  const product = await Product.create({
    title,
    description,
    price: parseFloat(price),
    category,
    condition,
    location,
    tags: Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()),
    images,
    seller: req.user!._id
  });

  await product.populate('seller', 'userName profilePicture firstName lastName avatar university schoolName');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
}));

// @route   PUT /api/products/:id
// @desc    Update product listing
// @access  Private (Owner only)
router.put('/:id', authenticate, upload.array('images', 5), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .optional()
    .isIn(['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'supplies', 'other'])
    .withMessage('Invalid category'),
  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Location is required'),
  body('status')
    .optional()
    .isIn(['available', 'sold', 'pending'])
    .withMessage('Invalid status')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
    throw createError('Not authorized to update this product', 403);
  }

  // Handle new images if uploaded
  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    const uploadResults = await uploadMultipleToS3(files, { folder: 'products' });
    const newImages = uploadResults.map(result => result.fileUrl);
    req.body.images = [...(product.images || []), ...newImages];
  }

  // Update product
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      (product as any)[key] = req.body[key];
    }
  });

  await product.save();
  await product.populate('seller', 'userName profilePicture firstName lastName avatar university schoolName');

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
}));

// @route   DELETE /api/products/:id
// @desc    Delete product listing
// @access  Private (Owner only)
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
    throw createError('Not authorized to delete this product', 403);
  }

  // Delete associated image files from S3
  if (product.images && product.images.length > 0) {
    const keys = product.images
      .map(url => extractKeyFromUrl(url))
      .filter((key): key is string => key !== null);
    
    await deleteMultipleFromS3(keys);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// @route   POST /api/products/:id/report
// @desc    Report a product listing
// @access  Private
router.post('/:id/report', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError('Product not found', 404);
  }

  await product.reportProduct(req.user!._id);

  res.json({
    success: true,
    message: 'Product reported successfully'
  });
}));

export default router;

