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
  },

  // System endpoints
  system: {
    health: `${BASE_URL}/health`,
    status: `${BASE_URL}/status`,
  },
} as const;

