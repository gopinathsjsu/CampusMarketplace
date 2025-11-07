import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = message.length;
  const maxChars = 1000;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim() || isOverLimit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
      <div className="mt-1 text-right">
        <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  );
}
