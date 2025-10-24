import express from 'express';
import { body } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '@/models/User';
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

// Map internal IUser document to public User DTO shape expected by frontend
const toUserDTO = (user: IUser) => ({
  _id: user._id,
  email: user.email,
  userName: user.userName || '',
  profilePicture: user.profilePicture || '',
  schoolName: user.schoolName || '',
  sellerRating: user.sellerRating || 0,
  buyerRating: user.buyerRating || 0
});

// @route   POST /api/auth/sign-up
// @desc    Register a new user
// @access  Public
router.post('/sign-up', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('userName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('schoolName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('School name is required'),
  /*body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')*/
], validateRequest, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, userName, password, profilePicture, schoolName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    email,
    userName,
    password,
    profilePicture: profilePicture || '',
    schoolName
  });

  // Generate token
  const token = generateToken(user._id.toString());

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: toUserDTO(user),
      token
    }
  });
}));

// @route   POST /api/auth/sign-in
// @desc    Login user
// @access  Public
router.post('/sign-in', [
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
      user: toUserDTO(user),
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
      user: toUserDTO(user)
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('userName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  /*body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),*/
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = req.user!;

  // Apply DTO fields directly
  if (req.body.userName !== undefined) {
    (user as any).userName = req.body.userName;
  }
  if (req.body.profilePicture !== undefined) {
    (user as any).profilePicture = req.body.profilePicture;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: toUserDTO(user) }
  });
}));

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
// Password change is not applicable to the simplified user schema


export default router;
