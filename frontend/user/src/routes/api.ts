/**
 * Centralized API endpoints configuration
 */

// Base API URL - can be configured via environment variables
export const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5050/api';

/**
 * API Endpoints
 */
export const API = {
  // Authentication endpoints
  auth: {
    signUp: `${BASE_URL}/auth/sign-up`,
    signIn: `${BASE_URL}/auth/sign-in`,
    me: `${BASE_URL}/auth/me`,
    profile: `${BASE_URL}/auth/profile`,
    changePassword: `${BASE_URL}/auth/change-password`,
  },

  // File endpoints
  file: {
    upload: `${BASE_URL}/file/upload`,
    uploadMultiple: `${BASE_URL}/file/upload-multiple`,
    deleteByUrl: `${BASE_URL}/file/by-url`,
    deleteMultiple: `${BASE_URL}/file/delete-multiple`,
  },

  // Users endpoints
  users: {
    list: `${BASE_URL}/users`,
    byId: (id: string) => `${BASE_URL}/users/${id}`,
    productsByUser: (id: string) => `${BASE_URL}/users/${id}/products`,
    purchasesByUser: (id: string) => `${BASE_URL}/users/${id}/purchases`,
    uploadProfilePicture: `${BASE_URL}/users/profilePicture`,
    deleteById: (id: string) => `${BASE_URL}/users/${id}`,
  },

  // Products endpoints
  products: {
    list: `${BASE_URL}/products`,
    byId: (id: string) => `${BASE_URL}/products/${id}`,
    create: `${BASE_URL}/products`,
    update: (id: string) => `${BASE_URL}/products/${id}`,
    delete: (id: string) => `${BASE_URL}/products/${id}`,
    report: (id: string) => `${BASE_URL}/products/${id}/report`,
  },

  // Chat endpoints
  chat: {
    list: `${BASE_URL}/chat`,
    byId: (id: string) => `${BASE_URL}/chat/${id}`,
    create: `${BASE_URL}/chat`,
    sendMessage: (id: string) => `${BASE_URL}/chat/${id}/messages`,
    getMessages: (id: string) => `${BASE_URL}/chat/${id}/messages`,
    markRead: (id: string) => `${BASE_URL}/chat/${id}/read`,
    delete: (id: string) => `${BASE_URL}/chat/${id}`,
  },

  // Admin endpoints
  admin: {
    dashboard: `${BASE_URL}/admin/dashboard`,
    reportedProducts: `${BASE_URL}/admin/reported-products`,
    resolveProductReport: (id: string) => `${BASE_URL}/admin/products/${id}/resolve-report`,
    deleteProduct: (id: string) => `${BASE_URL}/admin/products/${id}`,
    userActivity: (id: string) => `${BASE_URL}/admin/users/${id}/activity`,
    analytics: `${BASE_URL}/admin/analytics`,
  },

  // Records demo endpoints
  records: {
    list: `${BASE_URL}/records`,
    byId: (id: string) => `${BASE_URL}/records/${id}`,
    create: `${BASE_URL}/records`,
    update: (id: string) => `${BASE_URL}/records/${id}`,
    delete: (id: string) => `${BASE_URL}/records/${id}`,
  },

  // AI endpoints
  ai: {
    search: `${BASE_URL}/ai/search`,
  },

  // System endpoints
  system: {
    health: `${BASE_URL}/health`,
    status: `${BASE_URL}/status`,
    debugRoutes: `${BASE_URL}/_debug/routes`,
  },
} as const;
