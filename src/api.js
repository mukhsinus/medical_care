import axios from "axios";

// ✅ Always use subdomain for production
const API_BASE = "https://api.medicare.uz";

if (!API_BASE) {
  throw new Error("API_BASE is not defined");
}

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Allow cookies as fallback
});

/**
 * In-memory access token
 * (dies on refresh — that's OK)
 */
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

/**
 * Refresh token storage (localStorage for Safari compatibility)
 */
export function setRefreshToken(token) {
  localStorage.setItem("refreshToken", token);
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function clearRefreshToken() {
  localStorage.removeItem("refreshToken");
}

/**
 * Auth routes where refresh MUST NOT run
 */
const AUTH_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

/**
 * Request interceptor
 * Adds Authorization header if access token exists
 */
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Refresh token for protected routes
 * Works with both cookie-based and body-based refresh tokens
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const isAuthRoute = AUTH_ROUTES.some((route) =>
      original.url?.includes(route)
    );

    // 🚨 CRITICAL: Don't retry refresh itself
    const isRefreshRoute = original.url?.includes("/api/auth/refresh");

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthRoute &&
      !isRefreshRoute
    ) {
      original._retry = true;

      try {
        const refreshToken = getRefreshToken();
        
        // ✅ Send refresh token in body (Safari compatible)
        // Cookies are sent automatically as fallback
        const resp = await api.post(
          "/api/auth/refresh",
          { refreshToken },
          { withCredentials: true }
        );
        
        const newAccessToken = resp.data.accessToken;
        const newRefreshToken = resp.data.refreshToken;

        setAccessToken(newAccessToken);
        if (newRefreshToken) setRefreshToken(newRefreshToken);
        
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(original);
      } catch (refreshError) {
        clearAccessToken();
        clearRefreshToken();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Initialize auth on app load
 * If we have a refresh token but no access token, get a fresh one
 */
export async function initializeAuth() {
  const refreshToken = getRefreshToken();
  
  if (refreshToken && !accessToken) {
    try {
      console.log("[AUTH] Initializing from refresh token...");
      const resp = await api.post(
        "/api/auth/refresh",
        { refreshToken },
        { withCredentials: true }
      );
      
      const newAccessToken = resp.data.accessToken;
      const newRefreshToken = resp.data.refreshToken;
      
      setAccessToken(newAccessToken);
      if (newRefreshToken) setRefreshToken(newRefreshToken);
      
      console.log("[AUTH] ✅ Re-authenticated from refresh token");
      return true;
    } catch (error) {
      console.log("[AUTH] ❌ Failed to re-authenticate, clearing tokens");
      clearAccessToken();
      clearRefreshToken();
      return false;
    }
  }
  
  return !!accessToken;
}

export default api;
