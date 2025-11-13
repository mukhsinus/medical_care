import axios from 'axios';

const API_BASE = 'http://localhost:8090'; // поменяй если нужно

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // КЛЮЧЕВОЕ: отправляем httpOnly cookie (refreshToken)
});

// in-memory access token
let accessToken = null;
export function setAccessToken(token) { accessToken = token; }
export function clearAccessToken() { accessToken = null; }

// Request interceptor — добавляем Authorization, если есть access token
api.interceptors.request.use(cfg => {
  if (accessToken) cfg.headers['Authorization'] = `Bearer ${accessToken}`;
  return cfg;
}, err => Promise.reject(err));

// Response interceptor — при 401 делаем refresh и повторяем запрос
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    // если 401 и ещё не пробовали рефрешить
    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // вызовим endpoint refresh (axios без api, чтобы избежать рекурсии)
        const resp = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        const newToken = resp.data.token;
        setAccessToken(newToken);
        // повторяем исходный запрос с новым access token
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(original);
      } catch (e) {
        // если refresh упал — пользователь должен залогиниться
        clearAccessToken();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;