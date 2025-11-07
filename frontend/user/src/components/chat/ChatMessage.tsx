import type { ChatMessage as ChatMessageType } from '../../services/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

export default function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const senderName = typeof message.sender === 'object' ? message.sender.userName : 'Unknown';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwnMessage && (
          <span className="text-xs text-gray-600 mb-1 px-2">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-1 mt-1 px-2">
          <span className="text-xs text-gray-500">{timestamp}</span>
          {isOwnMessage && message.isRead && (
            <span className="text-xs text-blue-600">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
