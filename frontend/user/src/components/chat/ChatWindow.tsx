import { useState, useEffect, useRef } from 'react';
import type { Chat } from '../../services/chat';
import { chatService } from '../../services/chat';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  accessToken: string;
  onMessageSent?: () => void;
}

export default function ChatWindow({
  chat,
  currentUserId,
  accessToken,
  onMessageSent
}: ChatWindowProps) {
  const [messages, setMessages] = useState(chat.messages || []);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages(chat.messages || []);
  }, [chat]);

  const handleSendMessage = async (content: string) => {
    try {
      setSending(true);
      const response = await chatService.sendMessage(accessToken, chat._id, { content });
      setMessages(response.data.chat.messages);
      onMessageSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
  const productImage = chat.product.images[0] || '/placeholder.png';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={productImage}
            alt={chat.product.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{chat.product.title}</h3>
            <p className="text-sm text-gray-600">
              with {otherParticipant?.userName || 'Unknown User'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-blue-600">${chat.product.price.toFixed(2)}</p>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                chat.product.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : chat.product.status === 'sold'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {chat.product.status}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message._id}
                message={message}
                isOwnMessage={
                  typeof message.sender === 'string'
                    ? message.sender === currentUserId
                    : message.sender._id === currentUserId
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={sending || chat.product.status === 'sold'}
        placeholder={
          chat.product.status === 'sold'
            ? 'This product has been sold'
            : 'Type a message...'
        }
      />
    </div>
  );
}
