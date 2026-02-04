import axios from "axios";

// Determine API base URL based on environment
let API_BASE;

if (typeof window !== "undefined") {
  const isDevelopment = !window.location.hostname.includes("medicare.uz");
  
  if (isDevelopment) {
    // In development, use localhost
    API_BASE = "http://localhost:8090";
  } else {
    // In production, use the production subdomain
    API_BASE = "https://api.medicare.uz";
  }
} else {
  // Fallback for SSR
  API_BASE = "https://api.medicare.uz";
}

console.log("[API] Using API_BASE:", API_BASE);

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

/**
 * Auth initialization state (prevents concurrent refresh attempts)
 */


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
 * On first request, waits for auth initialization (but NOT for auth routes)
 */
api.interceptors.request.use(
  async (config) => {

    // const isAuthRoute = AUTH_ROUTES.some((route) =>
    //   config.url?.includes(route)
    // );
    
    // // Wait for initialization to complete if it's happening (but not for auth routes)
    // if (!isAuthRoute && isInitializing && initializePromise) {
    //   console.log("[REQUEST INTERCEPTOR] Waiting for auth initialization...");
    //   try {
    //     await Promise.race([
    //       initializePromise,
    //       new Promise((_, reject) => 
    //         setTimeout(() => reject(new Error("Auth initialization timeout")), 5000)
    //       )
    //     ]);
    //     console.log("[REQUEST INTERCEPTOR] Auth initialization complete");
    //   } catch (err) {
    //     console.error("[REQUEST INTERCEPTOR] Auth initialization failed or timed out:", err.message);
    //     // Continue anyway for non-auth routes
    //   }
    // }
    
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
        if (!refreshToken || refreshToken === "undefined") {
          console.log("[INTERCEPTOR] ❌ No refresh token available");
          clearAccessToken();
          clearRefreshToken();
          return Promise.reject(error);
        }
        
        console.log("[INTERCEPTOR] Attempting to refresh token...");
        
        // ✅ Send refresh token in body (Safari compatible)
        // Cookies are sent automatically as fallback
        const resp = await api.post(
          "/api/auth/refresh",
          { refreshToken },
          { withCredentials: true }
        );
        
        // Handle both old and new response structures
        const newAccessToken = resp.data.accessToken || resp.data.token;
        const newRefreshToken = resp.data.refreshToken;
        
        if (!newAccessToken) {
          console.error("[INTERCEPTOR] ❌ No accessToken in refresh response", resp.data);
          throw new Error("Invalid refresh response");
        }

        setAccessToken(newAccessToken);
        if (newRefreshToken) setRefreshToken(newRefreshToken);
        
        console.log("[INTERCEPTOR] ✅ Token refreshed successfully");
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(original);
      } catch (refreshError) {
        console.error("[INTERCEPTOR] ❌ Refresh failed:", refreshError.message);
        clearAccessToken();
        clearRefreshToken();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


// export async function initializeAuth() {
//   // Prevent concurrent initialization attempts
//   if (isInitializing) {
//     return initializePromise;
//   }

//   isInitializing = true;
  
//   initializePromise = (async () => {
//     const refreshToken = getRefreshToken();
    
//     if (refreshToken && !accessToken) {
//       try {
//         console.log("[AUTH] Initializing from refresh token stored in localStorage");
//         const resp = await api.post(
//           "/api/auth/refresh",
//           { refreshToken },
//           { withCredentials: true }
//         );
        
//         // Handle both old and new response structures
//         const newAccessToken = resp.data.accessToken || resp.data.token;
//         const newRefreshToken = resp.data.refreshToken;
        
//         if (!newAccessToken) {
//           console.error("[AUTH] ❌ No accessToken in refresh response", resp.data);
//           clearAccessToken();
//           clearRefreshToken();
//           isInitializing = false;
//           return false;
//         }
        
//         setAccessToken(newAccessToken);
//         if (newRefreshToken) setRefreshToken(newRefreshToken);
        
//         console.log("[AUTH] ✅ Re-authenticated from refresh token");
//         isInitializing = false;
//         return true;
//       } catch (error) {
//         console.log("[AUTH] ❌ Failed to re-authenticate:", error.message);
//         clearAccessToken();
//         clearRefreshToken();
//         isInitializing = false;
//         return false;
//       }
//     }
    
//     isInitializing = false;
//     return !!accessToken;
//   })();

//   return initializePromise;
// }


/**
 * Start payment process
 */
export async function startPayment({ items, amount, provider }) {
  try {
    const response = await api.post("/api/payments/create", {
      items,
      amount,
      provider,
    });
    return response.data;
  } catch (error) {
    console.error("[PAYMENT] ❌ Failed to start payment:", error.message);
    throw error;
  }
}

export default api;
