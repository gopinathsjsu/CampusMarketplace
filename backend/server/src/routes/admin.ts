import express from 'express';
import { query } from 'express-validator';
import User from '@/models/User';
import Product from '@/models/Product';
import Chat from '@/models/Chat';
import { authenticate, authorize, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const [
    totalUsers,
    totalProducts,
    totalChats,
    reportedProducts,
    recentUsers,
    recentProducts
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Chat.countDocuments(),
    Product.countDocuments({ isReported: true }),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email university createdAt'),
    Product.find().sort({ createdAt: -1 }).limit(5).populate('seller', 'firstName lastName')
  ]);

  // Get user statistics by role
  const usersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Get product statistics by category
  const productsByCategory = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Get product statistics by status
  const productsByStatus = await Product.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      statistics: {
        totalUsers,
        totalProducts,
        totalChats,
        reportedProducts
      },
      charts: {
        usersByRole,
        productsByCategory,
        productsByStatus
      },
      recent: {
        users: recentUsers,
        products: recentProducts
      }
    }
  });
}));

// @route   GET /api/admin/reported-products
// @desc    Get all reported products
// @access  Private (Admin)
router.get('/reported-products', authenticate, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find({ isReported: true })
      .populate('seller', 'firstName lastName email university')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments({ isReported: true })
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

// @route   PUT /api/admin/products/:id/resolve-report
// @desc    Resolve a reported product
// @access  Private (Admin)
router.put('/products/:id/resolve-report', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
    return;
  }

  product.isReported = false;
  product.reportedBy = [];
  await product.save();

  res.json({
    success: true,
    message: 'Product report resolved successfully',
    data: { product }
  });
}));

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product (admin action)
// @access  Private (Admin)
router.delete('/products/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
    return;
  }

  // Delete associated image files
  const fs = require('fs');
  const path = require('path');
  
  product.images.forEach(imagePath => {
    const fullPath = path.join(__dirname, '../../', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// @route   GET /api/admin/users/:id/activity
// @desc    Get user activity summary
// @access  Private (Admin)
router.get('/users/:id/activity', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.params.id;

  const [user, products, chats] = await Promise.all([
    User.findById(userId).select('-password'),
    Product.find({ seller: userId }).sort({ createdAt: -1 }),
    Chat.find({ participants: userId }).populate('product', 'title').sort({ lastActivity: -1 })
  ]);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  const activity = {
    user,
    statistics: {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'available').length,
      soldProducts: products.filter(p => p.status === 'sold').length,
      totalChats: chats.length,
      reportedProducts: products.filter(p => p.isReported).length
    },
    recentProducts: products.slice(0, 10),
    recentChats: chats.slice(0, 10)
  };

  res.json({
    success: true,
    data: activity
  });
}));

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin)
router.get('/analytics', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    newUsersThisMonth,
    newProductsThisMonth,
    newChatsThisMonth,
    topCategories,
    topUniversities,
    mostActiveUsers
  ] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Chat.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    User.aggregate([
      { $group: { _id: '$university', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Product.aggregate([
      { $group: { _id: '$seller', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
      { $unwind: '$seller' },
      { $project: { count: 1, 'seller.firstName': 1, 'seller.lastName': 1, 'seller.university': 1 } }
    ])
  ]);

  // Get daily statistics for the last 30 days
  const dailyStats = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Product.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          products: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      monthlyStats: {
        newUsers: newUsersThisMonth,
        newProducts: newProductsThisMonth,
        newChats: newChatsThisMonth
      },
      topCategories,
      topUniversities,
      mostActiveUsers,
      dailyStats: {
        users: dailyStats[0],
        products: dailyStats[1]
      }
    }
  });
}));

export default router;
