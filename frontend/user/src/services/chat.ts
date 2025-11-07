// Chat-related types and interfaces
export interface ChatParticipant {
  _id: string;
  userName: string;
  profilePicture: string;
  email: string;
}

export interface ChatProduct {
  _id: string;
  title: string;
  price: number;
  images: string[];
  status: 'available' | 'sold' | 'pending';
}

export interface ChatMessage {
  _id: string;
  sender: string | ChatParticipant;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  product: ChatProduct;
  messages: ChatMessage[];
  lastActivity: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  productId: string;
  sellerId: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ChatListResponse {
  success: true;
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

export interface ChatResponse {
  success: true;
  data: {
    chat: Chat;
  };
}

export interface MessageResponse {
  success: true;
  message: string;
  data: {
    chat: Chat;
  };
}

export interface MessagesResponse {
  success: true;
  data: {
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface BasicSuccessResponse {
  success: true;
  message: string;
}

const API_CHAT_URL = `${import.meta.env.VITE_API_BASE_URL}/chat`;

class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = (data && (data.message || data.detail)) || 'An error occurred';
      throw new ApiError(response.status, message);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error or server unavailable');
  }
}

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Get all chats for current user
const getChats = async (
  accessToken: string,
  page: number = 1,
  limit: number = 20
): Promise<ChatListResponse> => {
  return requestJson<ChatListResponse>(
    `${API_CHAT_URL}?page=${page}&limit=${limit}`,
    {
      headers: authHeader(accessToken),
    }
  );
};

// Get specific chat by ID
const getChatById = async (
  accessToken: string,
  chatId: string
): Promise<ChatResponse> => {
  return requestJson<ChatResponse>(`${API_CHAT_URL}/${chatId}`, {
    headers: authHeader(accessToken),
  });
};

// Create or get existing chat for a product
const createChat = async (
  accessToken: string,
  request: CreateChatRequest
): Promise<ChatResponse> => {
  return requestJson<ChatResponse>(`${API_CHAT_URL}`, {
    method: 'POST',
    headers: authHeader(accessToken),
    body: JSON.stringify(request),
  });
};

// Send a message in a chat
const sendMessage = async (
  accessToken: string,
  chatId: string,
  request: SendMessageRequest
): Promise<MessageResponse> => {
  return requestJson<MessageResponse>(`${API_CHAT_URL}/${chatId}/messages`, {
    method: 'POST',
    headers: authHeader(accessToken),
    body: JSON.stringify(request),
  });
};

// Get messages for a specific chat with pagination
const getMessages = async (
  accessToken: string,
  chatId: string,
  page: number = 1,
  limit: number = 50
): Promise<MessagesResponse> => {
  return requestJson<MessagesResponse>(
    `${API_CHAT_URL}/${chatId}/messages?page=${page}&limit=${limit}`,
    {
      headers: authHeader(accessToken),
    }
  );
};

// Mark messages as read
const markAsRead = async (
  accessToken: string,
  chatId: string
): Promise<BasicSuccessResponse> => {
  return requestJson<BasicSuccessResponse>(`${API_CHAT_URL}/${chatId}/read`, {
    method: 'PUT',
    headers: authHeader(accessToken),
  });
};

// Delete (deactivate) a chat
const deleteChat = async (
  accessToken: string,
  chatId: string
): Promise<BasicSuccessResponse> => {
  return requestJson<BasicSuccessResponse>(`${API_CHAT_URL}/${chatId}`, {
    method: 'DELETE',
    headers: authHeader(accessToken),
  });
};

export const chatService = {
  getChats,
  getChatById,
  createChat,
  sendMessage,
  getMessages,
  markAsRead,
  deleteChat,
};

export { ApiError };
