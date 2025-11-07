import type { UserDTO } from "../context/userDTO.tsx";
export interface RegisterRequest {
  email: string;
  userName: string;
  password: string;
  schoolName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  success: true;
  message?: string;
  data: {
    user: UserDTO;
    token: string;
  };
}

export interface MeSuccessResponse {
  success: true;
  data: {
    user: UserDTO;
  };
}

export interface UpdateProfileRequest {
  userName?: string;
  profilePicture?: string;
  password?: string;
}

export interface UpdateProfileResponse {
  success: true;
  message: string;
  data: {
    user: UserDTO;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface BasicSuccessResponse {
  success: true;
  message: string;
}

const API_AUTH_URL = `${import.meta.env.VITE_APP_API_BASE_URL}/auth`;

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

const signUp = async (request: RegisterRequest): Promise<AuthSuccessResponse> => {
  return requestJson<AuthSuccessResponse>(`${API_AUTH_URL}/sign-up`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

const signIn = async (request: LoginRequest): Promise<AuthSuccessResponse> => {
  return requestJson<AuthSuccessResponse>(`${API_AUTH_URL}/sign-in`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

const getMe = async (accessToken: string): Promise<MeSuccessResponse> => {
  return requestJson<MeSuccessResponse>(`${API_AUTH_URL}/me`, {
    headers: {
      ...authHeader(accessToken),
    },
  });
};

const updateProfile = async (
  accessToken: string,
  updates: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  return requestJson<UpdateProfileResponse>(`${API_AUTH_URL}/profile`, {
    method: 'PUT',
    headers: {
      ...authHeader(accessToken),
    },
    body: JSON.stringify(updates),
  });
};

const changePassword = async (
  accessToken: string,
  payload: ChangePasswordRequest
): Promise<BasicSuccessResponse> => {
  return requestJson<BasicSuccessResponse>(`${API_AUTH_URL}/change-password`, {
    method: 'POST',
    headers: {
      ...authHeader(accessToken),
    },
    body: JSON.stringify(payload),
  });
};

export const authService = {
  signUp,
  signIn,
  getMe,
  updateProfile,
  changePassword,
};

export { ApiError };
