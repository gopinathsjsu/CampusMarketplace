import express from 'express';
import { query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '@/models/User';
import Product from '@/models/Product';
import { authenticate, authorize, AuthRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

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
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('role').optional().isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role'),
  query('university').optional().isString().trim(),
  query('search').optional().isString().trim()
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const {
    page = 1,
    limit = 20,
    role,
    university,
    search
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter: any = {};
  if (role) filter.role = role;
  if (university) filter.university = new RegExp(university as string, 'i');
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search as string, 'i') },
      { lastName: new RegExp(search as string, 'i') },
      { email: new RegExp(search as string, 'i') }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await User.findById(req.params.id)
    .select('-password -email');

  if (!user) {
    throw createError('User not found', 404);
  }

  // Get user's active listings count
  const listingsCount = await Product.countDocuments({
    seller: user._id,
    status: 'available'
  });

  res.json({
    success: true,
    data: {
      user: {
        ...user.toObject(),
        listingsCount
      }
    }
  });
}));

// @route   GET /api/users/:id/products
// @desc    Get user's product listings
// @access  Public
router.get('/:id/products', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['available', 'sold', 'pending']).withMessage('Invalid status')
], validateRequest, asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    page = 1,
    limit = 12,
    status = 'available'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Check if user exists
  const user = await User.findById(req.params.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  const filter: any = { seller: req.params.id };
  if (status) filter.status = status;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'firstName lastName avatar university')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
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

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const file = req.file;

  if (!file) {
    throw createError('Please upload an image file', 400);
  }

  // Delete old avatar if exists
  if (req.user!.avatar) {
    const oldAvatarPath = path.join(__dirname, '../../', req.user!.avatar);
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  // Update user avatar
  req.user!.avatar = `/uploads/avatars/${file.filename}`;
  await req.user!.save();

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar: req.user!.avatar
    }
  });
}));

// @route   DELETE /api/users/avatar
// @desc    Delete user avatar
// @access  Private
router.delete('/avatar', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.user!.avatar) {
    throw createError('No avatar to delete', 400);
  }

  // Delete avatar file
  const avatarPath = path.join(__dirname, '../../', req.user!.avatar);
  if (fs.existsSync(avatarPath)) {
    fs.unlinkSync(avatarPath);
  }

  // Update user
  req.user!.avatar = undefined;
  await req.user!.save();

  res.json({
    success: true,
    message: 'Avatar deleted successfully'
  });
}));

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin)
router.put('/:id/role', authenticate, authorize('admin'), [
  query('role').isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { role } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Prevent admin from changing their own role
  if (user._id.toString() === req.user!._id.toString()) {
    throw createError('Cannot change your own role', 400);
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user account (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Prevent admin from deleting their own account
  if (user._id.toString() === req.user!._id.toString()) {
    throw createError('Cannot delete your own account', 400);
  }

  // Delete user's avatar if exists
  if (user.avatar) {
    const avatarPath = path.join(__dirname, '../../', user.avatar);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
  }

  // Delete user's products and associated images
  const userProducts = await Product.find({ seller: user._id });
  for (const product of userProducts) {
    // Delete product images
    product.images.forEach(imagePath => {
      const fullPath = path.join(__dirname, '../../', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  }

  // Delete products
  await Product.deleteMany({ seller: user._id });

  // Delete user
  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User account deleted successfully'
  });
}));

export default router;

