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
  withCredentials: true, // IMPORTANT: allow httpOnly refresh cookie
});

/**
 * In-memory access token
 * (dies on refresh — that’s OK)
 */
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
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
 * Refresh token ONLY for protected routes
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
        // ✅ CRITICAL: withCredentials must be true to send cookies
        const resp = await api.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = resp.data.token;

        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (refreshError) {
        clearAccessToken();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Payments helper
 */
export async function startPayment({ items, amount, provider }) {
  const res = await api.post("/api/payments/create", {
    items,
    amount,
    provider,
  });
  return res.data;
}

export default api;