import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Chat, ChatMessage } from '../../services/chat';
import { chatService } from '../../services/chat';
import { ChatList, ChatWindow } from '../../components/chat';
import { useSocket } from '../../hooks/useSocket';

export default function Chats() {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get token and user from localStorage (adjust based on your auth implementation)
  const accessToken = localStorage.getItem('token') || '';
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = currentUser?._id || '';

  // WebSocket event handlers
  const handleNewMessage = useCallback((data: { chatId: string; message: ChatMessage }) => {
    // Update the chat with the new message
    setChats(prev => prev.map(chat => {
      if (chat._id === data.chatId) {
        return {
          ...chat,
          messages: [...chat.messages, data.message],
          lastActivity: new Date().toISOString()
        };
      }
      return chat;
    }));

    // Update selected chat if it's the same
    if (selectedChat?._id === data.chatId) {
      setSelectedChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, data.message]
      } : null);
    }
  }, [selectedChat]);

  const handleMessagesRead = useCallback((data: { chatId: string; userId: string }) => {
    // Update read status for messages
    setChats(prev => prev.map(chat => {
      if (chat._id === data.chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => ({
            ...msg,
            isRead: msg.sender === currentUserId ? msg.isRead : true
          }))
        };
      }
      return chat;
    }));
  }, [currentUserId]);

  const handleNewChat = useCallback((chat: Chat) => {
    setChats(prev => [chat, ...prev]);
  }, []);

  // Initialize Socket.io
  const { joinChat, leaveChat, isConnected } = useSocket({
    accessToken,
    onNewMessage: handleNewMessage,
    onMessagesRead: handleMessagesRead,
    onNewChat: handleNewChat
  });

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load specific chat when chatId changes
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c._id === chatId);
      if (chat) {
        setSelectedChat(chat);
        // Join the chat room via WebSocket
        joinChat(chatId);
      } else {
        // Chat not in list, fetch it
        loadChatById(chatId);
      }
    } else if (!chatId && chats.length > 0) {
      // No chat selected, select first one
      handleSelectChat(chats[0]._id);
    }

    // Cleanup: leave chat room when component unmounts or chat changes
    return () => {
      if (chatId) {
        leaveChat(chatId);
      }
    };
  }, [chatId, chats, joinChat, leaveChat]);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getChats(accessToken);
      setChats(response.data.chats);
    } catch (err) {
      console.error('Failed to load chats:', err);
      setError('Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatById = async (id: string) => {
    try {
      const response = await chatService.getChatById(accessToken, id);
      setSelectedChat(response.data.chat);
      // Add to chats list if not already there
      setChats(prev => {
        const exists = prev.some(c => c._id === id);
        return exists ? prev : [response.data.chat, ...prev];
      });
    } catch (err) {
      console.error('Failed to load chat:', err);
      setError('Failed to load chat. Please try again.');
    }
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chats/${id}`);
  };

  const handleMessageSent = () => {
    // Reload chats to update last message
    loadChats();
    if (selectedChat) {
      loadChatById(selectedChat._id);
    }
  };

  if (!accessToken || !currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">Please sign in to view your chats</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadChats}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List Sidebar */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>
        <ChatList
          chats={chats}
          selectedChatId={selectedChat?._id}
          onSelectChat={handleSelectChat}
          currentUserId={currentUserId}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 hidden md:flex flex-col">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUserId={currentUserId}
            accessToken={accessToken}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
