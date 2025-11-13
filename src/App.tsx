// src/App.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import Home from './pages/Home';
import About from './pages/About';
import Catalog from './pages/Catalog';
import Contacts from './pages/Contacts';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Basket from './pages/Basket';
import Login from './pages/Login';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';

import api, { setAccessToken, clearAccessToken } from './api'; // must exist

const queryClient = new QueryClient();

/**
 * Auth context + provider
 */
const AuthContext = createContext({
  user: null,
  setUser: () => {},
  login: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // init on mount: try refresh using httpOnly cookie (api has withCredentials: true)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.post('/api/auth/refresh'); // sends refresh cookie automatically
        const { token, user } = res.data || {};
        if (token) {
          setAccessToken(token); // set in-memory token for api
        }
        if (mounted) setUser(user || null);
      } catch (err) {
        // not logged in or refresh failed
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoaded(true);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    // example helper: perform login and set user & token
    const res = await api.post('/api/auth/login', { identifier, password });
    const { token, user } = res.data || {};
    if (token) setAccessToken(token);
    setUser(user || null);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout'); // clears refreshToken on server
    } catch (e) {
      // ignore network errors
      console.error('Logout request failed:', e && (e.response?.data || e.message));
    } finally {
      clearAccessToken(); // local clear
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, authLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Protected route wrapper
 */
function RequireAuth({ children }) {
  const { user, authLoaded } = useAuth();
  const loc = useLocation();

  if (!authLoaded) {
    // waiting for auth init (avoid flicker)
    return <div style={{padding:20}}>Loading...</div>;
  }

  if (!user) {
    // redirect to locale login preserving return url
    // we try to infer locale from path (first segment)
    const parts = loc.pathname.split('/').filter(Boolean);
    const locale = parts[0] || 'en';
    return <Navigate to={`/${locale}/login`} state={{ from: loc }} replace />;
  }

  return children;
}

/**
 * Main App
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <LanguageProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </TooltipProvider>
        </CartProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />
      {['en', 'ru', 'uz'].map((locale) => (
        <React.Fragment key={locale}>
          <Route path={`/${locale}`} element={<Home />} />
          <Route path={`/${locale}/about`} element={<About />} />
          <Route path={`/${locale}/catalog`} element={<Catalog />} />
          <Route path={`/${locale}/contacts`} element={<Contacts />} />
          <Route path={`/${locale}/legal/privacy`} element={<Privacy />} />
          <Route path={`/${locale}/legal/terms`} element={<Terms />} />
          <Route path={`/${locale}/basket`} element={<Basket />} />
          <Route path={`/${locale}/login`} element={<Login />} />
          <Route path={`/${locale}/forgot-password`} element={<ForgotPassword />} />

          {/* Protected account route */}
          <Route
            path={`/${locale}/account`}
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
        </React.Fragment>
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;