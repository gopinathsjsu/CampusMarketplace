import { API } from '../routes/api';

export interface ChatParticipant {
  _id: string;
  userName: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: 'user' | 'admin';
}

export interface ChatProduct {
  _id: string;
  title: string;
  price: number;
  images: string[];
  status: 'available' | 'sold' | 'pending';
  sellerId?: string;
}

export interface ChatMessage {
  _id: string;
  sender: ChatParticipant | string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  product?: ChatProduct;
  messages: ChatMessage[];
  lastActivity: string;
  unreadCount?: number;
  isActive: boolean;
}

export interface GetChatsResponse {
  success: boolean;
  data: {
    chats: Chat[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetChatResponse {
  success: boolean;
  data: {
    chat: Chat;
  };
}

export interface CreateChatPayload {
  productId?: string;
  sellerId: string;
}

export interface SendMessagePayload {
  content: string;
}

class ChatApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getChats(page: number = 1, limit: number = 20): Promise<GetChatsResponse> {
  const res = await fetch(`${API.chat.list}?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to load chats';
    throw new ChatApiError(res.status, message);
  }
  return data as GetChatsResponse;
}

async function getChatById(id: string): Promise<GetChatResponse> {
  const res = await fetch(API.chat.byId(id), {
    method: 'GET',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to load chat';
    throw new ChatApiError(res.status, message);
  }
  return data as GetChatResponse;
}

async function createChat(payload: CreateChatPayload): Promise<GetChatResponse> {
  const res = await fetch(API.chat.create, {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to create chat';
    throw new ChatApiError(res.status, message);
  }
  return data as GetChatResponse;
}

async function sendMessage(chatId: string, payload: SendMessagePayload): Promise<GetChatResponse> {
  const res = await fetch(API.chat.sendMessage(chatId), {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to send message';
    throw new ChatApiError(res.status, message);
  }
  return data as GetChatResponse;
}

export const chatService = {
  getChats,
  getChatById,
  createChat,
  sendMessage,
};

export { ChatApiError };
