import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL?.split(',').map(o => o.trim()) || ['http://localhost:3050'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room for receiving messages
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join a specific chat room
    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Leave a specific chat room
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Typing indicator
    socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
      socket.to(`chat:${data.chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId: data.chatId,
        isTyping: data.isTyping
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper function to emit new message to chat participants
export const emitNewMessage = (chatId: string, message: any) => {
  if (io) {
    io.to(`chat:${chatId}`).emit('new_message', {
      chatId,
      message
    });
  }
};

// Helper function to emit message read status
export const emitMessageRead = (chatId: string, userId: string) => {
  if (io) {
    io.to(`chat:${chatId}`).emit('messages_read', {
      chatId,
      userId
    });
  }
};

// Helper function to notify user of new chat
export const emitNewChat = (userId: string, chat: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('new_chat', chat);
  }
};
