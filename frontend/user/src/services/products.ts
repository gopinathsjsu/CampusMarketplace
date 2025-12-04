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

export interface ProductSellerInfo {
  _id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  avatar?: string;
  university?: string;
  schoolName?: string;
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
  sellerId: ProductSellerInfo | string;
  status: 'available' | 'sold' | 'pending';
  createdAt: string;
  updatedAt?: string;
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
  // If location is "lat,lng", also send latitude/longitude for backend to reverse geocode and store
  const match = payload.location?.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (match) {
    form.append('latitude', match[1]);
    form.append('longitude', match[2]);
  }
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

export interface PurchaseProductResponse {
  success: boolean;
  message: string;
  data: {
    product: ProductData;
  };
}

async function purchase(id: string): Promise<PurchaseProductResponse> {
  const res = await fetch(API.products.purchase(id), {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to purchase product';
    throw new ProductApiError(res.status, message);
  }
  return data as PurchaseProductResponse;
}

async function getByUserId(userId: string): Promise<GetAllProductsResponse> {
  const res = await fetch(API.users.productsByUser(userId), {
    method: 'GET',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to load user products';
    throw new ProductApiError(res.status, message);
  }
  return data as GetAllProductsResponse;
}

export interface UpdateProductPayload {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  location?: string;
  tags?: string[];
  images?: File[];
  existingImages?: string[];
}

export interface UpdateProductResponse {
  success: true;
  message: string;
  data: {
    product: ProductData;
  };
}

async function update(id: string, payload: UpdateProductPayload): Promise<UpdateProductResponse> {
  const form = new FormData();
  if (payload.title !== undefined) form.append('title', payload.title);
  if (payload.description !== undefined) form.append('description', payload.description);
  if (payload.price !== undefined) form.append('price', String(payload.price));
  if (payload.category !== undefined) form.append('category', payload.category);
  if (payload.condition !== undefined) form.append('condition', payload.condition);
  if (payload.location !== undefined) {
    form.append('location', payload.location);
    const match = payload.location.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (match) {
      form.append('latitude', match[1]);
      form.append('longitude', match[2]);
    }
  }
  if (payload.tags) {
    payload.tags.forEach((t) => form.append('tags', t));
  }
  if (payload.images) {
    payload.images.forEach((file) => form.append('images', file));
  }
  if (payload.existingImages) {
    payload.existingImages.forEach((url) => form.append('existingImages', url));
  }

  const res = await fetch(API.products.update(id), {
    method: 'PUT',
    headers: {
      ...authHeader(),
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to update product';
    throw new ProductApiError(res.status, message);
  }
  return data as UpdateProductResponse;
}

async function deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(API.products.delete(id), {
    method: 'DELETE',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to delete product';
    throw new ProductApiError(res.status, message);
  }
  return data;
}

export const productService = {
  create,
  getById,
  getAll,
  getByUserId,
  purchase,
  update,
  delete: deleteProduct,
};

export interface GetAllProductsResponse {
  success: boolean;
  data: {
    products: ProductData[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface GetAllProductsParams {
  search?: string;
  category?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

async function getAll(params: GetAllProductsParams = {}): Promise<GetAllProductsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.category) query.append('category', params.category);
  if (params.condition) query.append('condition', params.condition);
  if (params.minPrice) query.append('minPrice', String(params.minPrice));
  if (params.maxPrice) query.append('maxPrice', String(params.maxPrice));
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const url = `${API.products.list}?${query.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.detail)) || 'Failed to load products';
    throw new ProductApiError(res.status, message);
  }
  return data as GetAllProductsResponse;
}

export { ProductApiError };


