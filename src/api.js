import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.medicare.uz";

if (!API_BASE) {
  throw new Error("VITE_API_BASE_URL is not defined");
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

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthRoute
    ) {
      original._retry = true;

      try {
        // IMPORTANT: must match backend method (POST here)
        const resp = await api.post("/api/auth/refresh");
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