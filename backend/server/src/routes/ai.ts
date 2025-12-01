import express from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import Product from '@/models/Product';

const router = express.Router();

// @route   POST /api/ai/search
// @desc    Search products using natural language (Mock AI)
// @access  Public
router.post('/search', [
  body('query')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Search query is required and must be under 500 characters')
], validateRequest, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { query } = req.body;
  const lowerQuery = query.toLowerCase();

  // 1. Extract Keywords (Rule-based Mock AI)
  const filters: any = { status: 'available' };

  // Extract Category
  const categories = ['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'supplies', 'other'];
  for (const cat of categories) {
    if (lowerQuery.includes(cat) || lowerQuery.includes(cat.slice(0, -1))) { // simple singular check
      filters.category = cat;
      break;
    }
  }

  // Extract Price (cheap, expensive, under X)
  if (lowerQuery.includes('cheap') || lowerQuery.includes('under 50') || lowerQuery.includes('less than 50')) {
    filters.price = { $lte: 50 };
  } else if (lowerQuery.includes('expensive') || lowerQuery.includes('premium')) {
    filters.price = { $gte: 100 };
  }

  // Extract Text Search Terms (remove common stop words)
  const stopWords = ['i', 'want', 'need', 'looking', 'for', 'a', 'an', 'the', 'some', 'cheap', 'expensive'];
  const searchTerms = lowerQuery.split(' ')
    .filter((word: string) => !stopWords.includes(word) && !categories.includes(word))
    .join(' ');

  if (searchTerms) {
    filters.$text = { $search: searchTerms };
  }

  // 2. Query Database
  const products = await Product.find(filters)
    .populate('seller', 'userName profilePicture firstName lastName avatar university schoolName')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      interpretedFilters: {
        category: filters.category || 'all',
        priceRange: filters.price ? (filters.price.$lte ? 'Under $50' : 'Over $100') : 'any',
        searchTerms
      },
      products
    }
  });
}));

export default router;
