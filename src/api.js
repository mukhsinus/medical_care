import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send httpOnly refresh cookie
});

// in-memory access token
let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}
export function clearAccessToken() {
  accessToken = null;
}

// Request interceptor
api.interceptors.request.use(
  (cfg) => {
    if (accessToken) {
      cfg.headers.Authorization = `Bearer ${accessToken}`;
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

// Response interceptor (refresh on 401)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const resp = await api.post("/api/auth/refresh");
        const newToken = resp.data.token;

        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (e) {
        clearAccessToken();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

// Payment helper
export async function startPayment({ items, amount, provider }) {
  const res = await api.post("/api/payments/create", {
    items,
    amount,
    provider,
  });
  return res.data;
}

export default api;