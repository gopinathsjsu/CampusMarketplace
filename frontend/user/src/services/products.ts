import { API } from '../routes/api.ts';

export interface CreateProductPayload {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  location: string;
  tags: string[];
  images: File[];
}

export interface CreateProductResponse {
  success: true;
  message: string;
  data: {
    product: unknown;
  };
}

export interface ProductData {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  tags?: string[];
}

export interface GetProductByIdResponse {
  success: boolean;
  data: {
    product: ProductData;
  };
}

class ProductApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProductApiError';
    this.status = status;
  }
}

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function create(payload: CreateProductPayload): Promise<CreateProductResponse> {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('price', String(payload.price));
  form.append('category', payload.category);
  form.append('condition', payload.condition);
  form.append('location', payload.location);
  payload.tags.forEach((t) => form.append('tags', t));
  payload.images.forEach((file) => form.append('images', file));

  const res = await fetch(API.products.create, {
    method: 'POST',
    headers: {
      ...authHeader(),
      // Do NOT set Content-Type when sending FormData; browser will set boundary.
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to create product';
    throw new ProductApiError(res.status, message);
  }
  return data as CreateProductResponse;
}

async function getById(id: string): Promise<GetProductByIdResponse> {
  const res = await fetch(API.products.byId(id), {
    method: 'GET',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to load product';
    throw new ProductApiError(res.status, message);
  }
  return data as GetProductByIdResponse;
}

export const productService = {
  create,
  getById,
};

export { ProductApiError };


