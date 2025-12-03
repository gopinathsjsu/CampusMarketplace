import express from 'express';
import { body, query } from 'express-validator';
import Chat from '@/models/Chat';
import Product from '@/models/Product';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';

const router = express.Router();

// @route   GET /api/chat
// @desc    Get all chats for current user
// @access  Private
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const chats = await Chat.find({
    participants: req.user!._id,
    isActive: true
  })
    .populate('participants', 'userName profilePicture firstName lastName avatar')
    .populate('product', 'title price images status')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Chat.countDocuments({
    participants: req.user!._id,
    isActive: true
  });

  res.json({
    success: true,
    data: {
      chats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// @route   GET /api/chat/:id
// @desc    Get specific chat with messages
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'userName profilePicture firstName lastName avatar')
    .populate('product', 'title price images status sellerId')
    .populate('messages.sender', 'userName profilePicture firstName lastName avatar');

  if (!chat) {
    throw createError('Chat not found', 404);
  }

  // Check if user is participant
  const isParticipant = chat.participants.some(
    participant => participant._id.toString() === req.user!._id.toString()
  );

  if (!isParticipant) {
    throw createError('Access denied. You are not a participant in this chat.', 403);
  }

  // Mark messages as read for current user
  await chat.markMessagesAsRead(req.user!._id);

  res.json({
    success: true,
    data: { chat }
  });
}));

// @route   POST /api/chat
// @desc    Create or get existing chat for a product
// @access  Private
router.post('/', authenticate, [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('sellerId')
    .isMongoId()
    .withMessage('Valid seller ID is required')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { productId, sellerId } = req.body;
  const buyerId = req.user!._id;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  // Check if product is available
  if (product.status !== 'available') {
    throw createError('Product is no longer available for chat', 400);
  }

  // Prevent seller from chatting with themselves
  if (sellerId.toString() === buyerId.toString()) {
    throw createError('Cannot start chat with yourself', 400);
  }

  // Find or create chat
  const chat = await Chat.findOrCreateChat(buyerId, sellerId, productId);

  res.json({
    success: true,
    data: { chat }
  });
}));

// @route   POST /api/chat/:id/messages
// @desc    Send a message in a chat
// @access  Private
router.post('/:id/messages', authenticate, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content is required and must be less than 1000 characters')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { content } = req.body;
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw createError('Chat not found', 404);
  }

  // Check if user is participant
  const isParticipant = chat.participants.some(
    participant => participant.toString() === req.user!._id.toString()
  );

  if (!isParticipant) {
    throw createError('Access denied. You are not a participant in this chat.', 403);
  }

  // Add message to chat
  await chat.addMessage(req.user!._id, content);
  
  // Populate the updated chat
  await chat.populate('participants', 'userName profilePicture firstName lastName avatar');
  await chat.populate('product', 'title price images status');
  await chat.populate('messages.sender', 'userName profilePicture firstName lastName avatar');

  res.json({
    success: true,
    message: 'Message sent successfully',
    data: { chat }
  });
}));

// @route   GET /api/chat/:id/messages
// @desc    Get messages for a specific chat with pagination
// @access  Private
router.get('/:id/messages', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validateRequest, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    throw createError('Chat not found', 404);
  }

  // Check if user is participant
  const isParticipant = chat.participants.some(
    participant => participant.toString() === req.user!._id.toString()
  );

  if (!isParticipant) {
    throw createError('Access denied. You are not a participant in this chat.', 403);
  }

  // Get paginated messages
  const totalMessages = chat.messages.length;
  const startIndex = Math.max(0, totalMessages - (pageNum * limitNum));
  const endIndex = Math.max(0, totalMessages - ((pageNum - 1) * limitNum));
  
  const messages = chat.messages.slice(startIndex, endIndex);

  // Populate sender information
  await chat.populate('messages.sender', 'userName profilePicture firstName lastName avatar');

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limitNum)
      }
    }
  });
}));

// @route   PUT /api/chat/:id/read
// @desc    Mark messages as read
// @access  Private
router.put('/:id/read', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    throw createError('Chat not found', 404);
  }

  // Check if user is participant
  const isParticipant = chat.participants.some(
    participant => participant.toString() === req.user!._id.toString()
  );

  if (!isParticipant) {
    throw createError('Access denied. You are not a participant in this chat.', 403);
  }

  await chat.markMessagesAsRead(req.user!._id);

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
}));

// @route   DELETE /api/chat/:id
// @desc    Deactivate a chat (soft delete)
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    throw createError('Chat not found', 404);
  }

  // Check if user is participant
  const isParticipant = chat.participants.some(
    participant => participant.toString() === req.user!._id.toString()
  );

  if (!isParticipant) {
    throw createError('Access denied. You are not a participant in this chat.', 403);
  }

  chat.isActive = false;
  await chat.save();

  res.json({
    success: true,
    message: 'Chat deleted successfully'
  });
}));

export default router;

