import { useSearchParams } from 'react-router-dom';
import {
  chatService,
  type Chat,
  type ChatMessage,
  type ChatParticipant,
} from '../../services/chat';
import { useUser } from '../../context/userDTO';
import Button from '../../components/button/Button';
import Notification from '../../components/notification/Notification';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

export default function ChatPage() {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get('chatId');

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to fetch user's chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChats();
      setChats(response.data.chats);
    } catch (error: any) {
      console.error('Failed to load chats:', error);
      setNotification({ message: 'Failed to load chats', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Load selected chat
  useEffect(() => {
    if (selectedChatId) {
      const loadChat = async () => {
        try {
          const response = await chatService.getChatById(selectedChatId);
          setSelectedChat(response.data.chat);
          scrollToBottom();
        } catch (error: any) {
          console.error('Failed to load chat:', error);
          setNotification({ message: 'Failed to load conversation', type: 'error' });
        }
      };
      loadChat();
    } else {
      setSelectedChat(null);
    }
  }, [selectedChatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectChat = (chatId: string) => {
    setSearchParams({ chatId });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await chatService.sendMessage(selectedChat._id, {
        content: messageInput.trim(),
      });
      setSelectedChat(response.data.chat);
      setMessageInput('');

      // Update chat in list with new last message
      setChats((prevChats) =>
        prevChats.map((chat) => (chat._id === selectedChat._id ? response.data.chat : chat)),
      );
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setNotification({ message: 'Failed to send message', type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = (participants: ChatParticipant[]): ChatParticipant | null => {
    if (!user) return null;
    return participants.find((p) => p._id !== user._id) || null;
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSenderName = (message: ChatMessage): string => {
    if (typeof message.sender === 'string') return 'Unknown';
    const sender = message.sender as ChatParticipant;
    return sender.userName || sender.firstName || 'User';
  };

  const getSenderAvatar = (message: ChatMessage): string => {
    if (typeof message.sender === 'string') return '';
    const sender = message.sender as ChatParticipant;
    return sender.profilePicture || sender.avatar || '';
  };

  const isMyMessage = (message: ChatMessage): boolean => {
    if (!user) return false;
    const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;
    return senderId === user._id;
  };

  const handleNewMessageClick = async () => {
    setShowNewMessageModal(true);
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5001/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        // Filter out current user
        setUsers(data.data.users.filter((u: any) => u._id !== user?._id));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setNotification({ message: 'Failed to load users', type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUserForChat = async (selectedUser: any, targetRole?: string) => {
    // Check if there's an existing chat with this user
    const existingChat = chats.find((chat) =>
      chat.participants.some((p) => p._id === selectedUser._id),
    );

    if (existingChat) {
      handleSelectChat(existingChat._id);
      setShowNewMessageModal(false);
      return;
    }

    // Create chat - product is optional now (backend will handle it)
    try {
      setLoadingUsers(true);

      // Create chat without product initially
      // Backend will find a product from the user if available, or create without product
      const newChat = await chatService.createChat({
        sellerId: selectedUser._id,
      });

      // Refresh chats and select the new one
      await fetchChats();
      handleSelectChat(newChat.data.chat._id);
      setShowNewMessageModal(false);
      setNotification({
        message: `Chat started with ${selectedUser.userName || selectedUser.firstName || 'user'}`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to create chat:', error);

      // Always try to refresh and find the existing chat
      try {
        // Refresh chats list
        const response = await chatService.getChats();
        const updatedChats = response.data.chats;
        setChats(updatedChats);

        // Find the chat with this user
        const existingChat = updatedChats.find((chat) =>
          chat.participants.some((p) => p._id === selectedUser._id),
        );

        if (existingChat) {
          handleSelectChat(existingChat._id);
          setShowNewMessageModal(false);
          // Only show success notification if not targeting admin (admin flow has its own handling)
          if (targetRole !== 'admin') {
            setNotification({
              message: `Chat opened with ${selectedUser.userName}`,
              type: 'success',
            });
          }
          return;
        }
      } catch (refreshError) {
        console.error('Failed to refresh chats:', refreshError);
      }

      // Only show error notification if not targeting admin (admin flow has its own handling)
      if (targetRole !== 'admin') {
        setNotification({
          message: error.message || 'Failed to create chat',
          type: 'error',
        });
      }
      setShowNewMessageModal(false);

      // Re-throw error so parent function (handleChatWithAdmin) can handle it
      if (targetRole === 'admin') {
        throw error;
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChatWithAdmin = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // First check if we already have a chat with admin
      const existingAdminChat = chats.find((chat) =>
        chat.participants.some((p) => p.role === 'admin'),
      );

      if (existingAdminChat) {
        handleSelectChat(existingAdminChat._id);
        setLoading(false);
        return;
      }

      // Fetch admin users
      const response = await fetch('http://localhost:5001/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Find an admin user
        const adminUser = data.data.users.find((u: any) => u.role === 'admin');

        if (adminUser) {
          // Try to open/create chat with admin
          await handleSelectUserForChat(adminUser, 'admin');
        } else {
          setNotification({
            message: 'No admin available at the moment.',
            type: 'error',
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to start chat with admin:', error);

      // Even if there was an error, try to refresh and find admin chat
      try {
        const response = await chatService.getChats();
        const updatedChats = response.data.chats;
        setChats(updatedChats);

        const adminChat = updatedChats.find((chat) =>
          chat.participants.some((p) => p.role === 'admin'),
        );

        if (adminChat) {
          handleSelectChat(adminChat._id);
          return;
        }
      } catch (refreshError) {
        console.error('Failed to refresh chats:', refreshError);
      }

      setNotification({
        message: 'Unable to open admin chat. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations List Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {user?.role === 'admin' ? (
              <Button
                text="+ New Message"
                onClick={handleNewMessageClick}
                size="base"
                color="#1F55A2"
              />
            ) : (
              <Button
                text="Chat with Admin"
                onClick={handleChatWithAdmin}
                size="base"
                color="#1F55A2"
              />
            )}
          </div>
          {user?.role !== 'admin' && (
            <p className="text-xs text-gray-500 mt-2">
              💬 Chat with admin for support or contact other users through product listings.
            </p>
          )}
          {user?.role === 'admin' && (
            <div className="mt-2 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full inline-block">
              Admin View - All Conversations
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a conversation from a product listing</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat.participants);
              const lastMessage = chat.messages[chat.messages.length - 1];
              const isSelected = chat._id === selectedChatId;

              return (
                <div
                  key={chat._id}
                  onClick={() => handleSelectChat(chat._id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {otherParticipant?.profilePicture ? (
                      <img
                        src={otherParticipant.profilePicture}
                        alt={otherParticipant.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                        {otherParticipant?.userName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherParticipant?.userName || 'Unknown User'}
                          </h3>
                          {otherParticipant?.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {chat.product && (
                        <p className="text-sm text-gray-600 truncate">{chat.product.title}</p>
                      )}
                      {lastMessage && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {typeof lastMessage.sender === 'object' &&
                          lastMessage.sender._id === user?._id
                            ? 'You: '
                            : ''}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                {user?.role !== 'admin' && selectedChat.product?.images?.[0] ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedChat.product.images[0]}
                      alt={selectedChat.product.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h2 className="font-bold text-gray-900">{selectedChat.product.title}</h2>
                      <p className="text-sm text-gray-600">
                        ${selectedChat.product.price.toFixed(2)} • {selectedChat.product.status}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">Direct Message</h2>
                      <p className="text-sm text-gray-600">Private conversation</p>
                    </div>
                  </div>
                )}
                {getOtherParticipant(selectedChat.participants) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">With:</span>
                    <span className="font-medium text-gray-900">
                      {getOtherParticipant(selectedChat.participants)?.userName}
                    </span>
                    {getOtherParticipant(selectedChat.participants)?.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                        Admin
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedChat.messages.map((message) => {
                const isMine = isMyMessage(message);
                return (
                  <div
                    key={message._id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMine && (
                        <>
                          {getSenderAvatar(message) ? (
                            <img
                              src={getSenderAvatar(message)}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getSenderName(message)[0]?.toUpperCase()}
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isMine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <p
                          className={`text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t-2 border-gray-300 p-4 shadow-lg">
              <div className="relative">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full border-2 bg-white border-gray-300 rounded-3xl px-4 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="absolute right-3 bottom-3 w-10 h-10 bg-[#1F55A2] hover:bg-[#174080] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className={sendingMessage ? 'animate-pulse' : ''} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-2">Choose a chat from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={!!notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Start New Chat</h2>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* User List */}
              <div className="max-h-96 overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center py-8 text-gray-500">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No users found</div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => handleSelectUserForChat(u)}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{u.userName}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
