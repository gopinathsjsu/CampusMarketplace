import express from 'express';
import { body } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '@/models/User';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  } as SignOptions);
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('university')
    .trim()
    .isLength({ min: 1 })
    .withMessage('University is required'),
  body('role')
    .optional()
    .isIn(['buyer', 'seller'])
    .withMessage('Role must be either buyer or seller')
], validateRequest, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password, firstName, lastName, university, role = 'buyer' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    university,
    role
  });

  // Generate token
  const token = generateToken(user._id.toString());

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        university: user.university,
        isVerified: user.isVerified
      },
      token
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
], validateRequest, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  // Check if user exists and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user._id.toString());

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        university: user.university,
        isVerified: user.isVerified,
        avatar: user.avatar
      },
      token
    }
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = req.user!;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        university: user.university,
        isVerified: user.isVerified,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        graduationYear: user.graduationYear,
        major: user.major
      }
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('graduationYear')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Graduation year must be between 2020 and 2030'),
  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Major cannot exceed 100 characters')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = req.user!;
  const allowedUpdates = ['firstName', 'lastName', 'phone', 'bio', 'graduationYear', 'major'];
  
  // Update only allowed fields
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (user as any)[field] = req.body[field];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticate, [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;
