import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '../services/chat';

interface UseSocketOptions {
  accessToken: string;
  onNewMessage?: (data: { chatId: string; message: ChatMessage }) => void;
  onMessagesRead?: (data: { chatId: string; userId: string }) => void;
  onNewChat?: (chat: any) => void;
  onUserTyping?: (data: { userId: string; chatId: string; isTyping: boolean }) => void;
}

export const useSocket = ({
  accessToken,
  onNewMessage,
  onMessagesRead,
  onNewChat,
  onUserTyping
}: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    // Initialize Socket.io connection
    const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token: accessToken
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
    });

    // Chat events
    if (onNewMessage) {
      socket.on('new_message', onNewMessage);
    }

    if (onMessagesRead) {
      socket.on('messages_read', onMessagesRead);
    }

    if (onNewChat) {
      socket.on('new_chat', onNewChat);
    }

    if (onUserTyping) {
      socket.on('user_typing', onUserTyping);
    }

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [accessToken, onNewMessage, onMessagesRead, onNewChat, onUserTyping]);

  // Helper functions
  const joinChat = (chatId: string) => {
    socketRef.current?.emit('join_chat', chatId);
  };

  const leaveChat = (chatId: string) => {
    socketRef.current?.emit('leave_chat', chatId);
  };

  const emitTyping = (chatId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { chatId, isTyping });
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinChat,
    leaveChat,
    emitTyping
  };
};
