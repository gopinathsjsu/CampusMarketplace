import type { Chat } from '../../services/chat';

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  currentUserId: string;
}

export default function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  currentUserId
}: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">
        <div>
          <p className="text-lg font-medium">No chats yet</p>
          <p className="text-sm mt-2">Start a conversation by contacting a seller on a product listing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {chats.map((chat) => {
        const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
        const lastMessage = chat.messages[chat.messages.length - 1];
        const productImage = chat.product.images[0] || '/placeholder.png';
        const isSelected = chat._id === selectedChatId;

        return (
          <div
            key={chat._id}
            onClick={() => onSelectChat(chat._id)}
            className={`flex items-center gap-3 p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <img
              src={productImage}
              alt={chat.product.title}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900 truncate">
                  {chat.product.title}
                </h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {new Date(chat.lastActivity).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate mb-1">
                {otherParticipant?.userName || 'Unknown User'}
              </p>
              {lastMessage && (
                <p className="text-sm text-gray-500 truncate">
                  {typeof lastMessage.sender === 'string'
                    ? lastMessage.sender === currentUserId
                      ? 'You: '
                      : ''
                    : lastMessage.sender._id === currentUserId
                    ? 'You: '
                    : ''}
                  {lastMessage.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
