import express from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import Product from '@/models/Product';

const router = express.Router();

type AiFilterInput = {
  category?: string | null;
  condition?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  status?: 'available' | 'sold' | 'pending' | null;
  keywords?: string[] | null;
};

type NormalizedFilters = {
  mongoFilter: any;
  interpreted: {
    category: string;
    condition: string;
    status: string;
    priceRange: string;
    keywords: string[];
  };
};

const ALLOWED_CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'supplies', 'other'] as const;
const ALLOWED_CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'] as const;
const ALLOWED_STATUSES = ['available', 'sold', 'pending'] as const;

function normalizeAiFilters(input: AiFilterInput): NormalizedFilters {
  let { category, condition, minPrice, maxPrice, status, keywords } = input;

  if (!ALLOWED_CATEGORIES.includes((category || '') as (typeof ALLOWED_CATEGORIES)[number])) {
    category = null;
  }

  if (!ALLOWED_CONDITIONS.includes((condition || '') as (typeof ALLOWED_CONDITIONS)[number])) {
    condition = null;
  }

  if (!ALLOWED_STATUSES.includes((status || '') as (typeof ALLOWED_STATUSES)[number])) {
    status = 'available';
  }

  if (typeof minPrice === 'number' && minPrice < 0) {
    minPrice = 0;
  }

  if (typeof maxPrice === 'number' && maxPrice < 0) {
    maxPrice = null;
  }

  if (typeof minPrice === 'number' && typeof maxPrice === 'number' && minPrice > maxPrice) {
    const tmp = minPrice;
    minPrice = maxPrice;
    maxPrice = tmp;
  }

  const mongoFilter: any = {};

  if (status) {
    mongoFilter.status = status;
  }

  if (category) {
    mongoFilter.category = category;
  }

  if (condition) {
    mongoFilter.condition = condition;
  }

  if (minPrice != null || maxPrice != null) {
    mongoFilter.price = {};
    if (minPrice != null) mongoFilter.price.$gte = minPrice;
    if (maxPrice != null) mongoFilter.price.$lte = maxPrice;
  }

  const normalizedKeywords = (keywords || []).filter((k) => !!k && k.trim().length > 0);
  if (normalizedKeywords.length > 0) {
    mongoFilter.$text = { $search: normalizedKeywords.join(' ') };
  }

  let priceRange = 'any';
  if (minPrice != null && maxPrice != null) {
    priceRange = `$${minPrice} - $${maxPrice}`;
  } else if (minPrice != null) {
    priceRange = `From $${minPrice}`;
  } else if (maxPrice != null) {
    priceRange = `Up to $${maxPrice}`;
  }

  return {
    mongoFilter,
    interpreted: {
      category: category || 'all',
      condition: condition || 'any',
      status: status || 'available',
      priceRange,
      keywords: normalizedKeywords,
    },
  };
}

function buildFiltersFromQueryMock(query: string): NormalizedFilters {
  const lowerQuery = query.toLowerCase();

  const filters: any = { status: 'available' };

  const categories = [...ALLOWED_CATEGORIES];
  for (const cat of categories) {
    if (lowerQuery.includes(cat) || lowerQuery.includes(cat.slice(0, -1))) {
      filters.category = cat;
      break;
    }
  }

  if (lowerQuery.includes('cheap') || lowerQuery.includes('under 50') || lowerQuery.includes('less than 50')) {
    filters.price = { $lte: 50 };
  } else if (lowerQuery.includes('expensive') || lowerQuery.includes('premium')) {
    filters.price = { $gte: 100 };
  }

  const stopWords = ['i', 'want', 'need', 'looking', 'for', 'a', 'an', 'the', 'some', 'cheap', 'expensive'];
  const searchTerms = lowerQuery
    .split(' ')
    .filter((word: string) => !stopWords.includes(word) && !categories.includes(word as any))
    .join(' ');

  const keywords = searchTerms ? searchTerms.split(' ') : [];

  const mongoFilter: any = { status: 'available' };
  if (filters.category) mongoFilter.category = filters.category;
  if (filters.price) mongoFilter.price = filters.price;
  if (searchTerms) mongoFilter.$text = { $search: searchTerms };

  const priceRange = filters.price ? (filters.price.$lte ? 'Under $50' : 'Over $100') : 'any';

  return {
    mongoFilter,
    interpreted: {
      category: filters.category || 'all',
      condition: 'any',
      status: 'available',
      priceRange,
      keywords,
    },
  };
}

async function buildFiltersFromQueryGroq(query: string): Promise<NormalizedFilters | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content:
            'You help convert natural language marketplace search queries into structured JSON filters. ' +
            'Respond ONLY with valid JSON matching the schema: {"category": string|null, "condition": string|null, "minPrice": number|null, "maxPrice": number|null, "status": "available"|"sold"|"pending"|null, "keywords": string[]|null}. ' +
            'Use only known categories: textbooks, electronics, furniture, clothing, sports, supplies, other. ' +
            'Use only conditions: new, like-new, good, fair, poor. Prices are in USD.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.2,
      max_tokens: 256,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    return null;
  }

  let jsonText = content.trim();
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  let parsed: AiFilterInput;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  return normalizeAiFilters(parsed);
}

// @route   POST /api/ai/search
// @desc    Search products using natural language (Mock AI)
// @access  Public
router.post('/search', [
  body('query')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Search query is required and must be under 500 characters')
], validateRequest, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { query } = req.body as { query: string };

  let result: NormalizedFilters | null = null;

  try {
    result = await buildFiltersFromQueryGroq(query);
  } catch {
    result = null;
  }

  if (!result) {
    result = buildFiltersFromQueryMock(query);
  }

  const { mongoFilter, interpreted } = result;

  const products = await Product.find(mongoFilter)
    .populate('seller', 'userName profilePicture firstName lastName avatar university schoolName')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      interpretedFilters: interpreted,
      products,
    },
  });
}));

export default router;
