import { API } from '../routes/api.ts';

export interface FileUploadResponse {
  success: true;
  message: string;
  data: {
    file: {
      url: string;
      key: string;
    };
  };
}

export class FileUploadError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FileUploadError";
    this.status = status;
  }
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const uploadFile = async (
  file: File,
  folder: string = 'listings'
): Promise<FileUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch(API.file.upload, {
      method: 'POST',
      headers: {
        ...authHeader(),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = (data && (data.message || data.detail)) || 'Failed to upload file';
      throw new FileUploadError(response.status, message);
    }

    return data as FileUploadResponse;
  } catch (error) {
    if (error instanceof FileUploadError) {
      throw error;
    }
    throw new FileUploadError(0, 'Network error or server unavailable');
  }
};

export const fileService = {
  uploadFile,
};

