// src/App.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import ItemDetails from "./pages/ItemDetails";
import Contacts from "./pages/Contacts";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Basket from "./pages/Basket";
import Login from "./pages/Login";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import api, { setAccessToken, setRefreshToken, clearAccessToken, initializeAuth } from "./api";

const queryClient = new QueryClient();

/* ================= AUTH CONTEXT ================= */

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  login: async () => {},
  logout: async () => {},
  authLoaded: false
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Initialize auth from refresh token if available
        await initializeAuth();
        
        // Fetch current user profile
        const res = await api.get("/api/user/me");
        const { user } = res.data || {};
        if (mounted) setUser(user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoaded(true);
      }
    })();

    return () => (mounted = false);
  }, []);

  const login = useCallback(async (data) => {
    const res = await api.post("/api/auth/login", data);
    const { accessToken, refreshToken, user } = res.data || {};
    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    setUser(user || null);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, authLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================= PROTECTED ROUTE ================= */

function RequireAuth({ children }) {
  const { user, authLoaded } = useAuth();
  const location = useLocation();

  if (!authLoaded) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!user) {
    const locale = location.pathname.split("/")[1] || "en";
    return <Navigate to={`/${locale}/login`} replace />;
  }

  return children;
}

/* ================= APP ================= */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <LanguageProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </TooltipProvider>
          </CartProvider>
        </LanguageProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />

      {["en", "ru", "uz"].map((locale) => (
        <React.Fragment key={locale}>
          <Route path={`/${locale}`} element={<Home />} />
          <Route path={`/${locale}/about`} element={<About />} />
          <Route path={`/${locale}/catalog`} element={<Catalog />} />
          <Route path={`/${locale}/catalog/:itemId`} element={<ItemDetails />} />
          <Route path={`/${locale}/contacts`} element={<Contacts />} />
          <Route path={`/${locale}/legal/privacy`} element={<Privacy />} />
          <Route path={`/${locale}/legal/terms`} element={<Terms />} />
          <Route path={`/${locale}/basket`} element={<Basket />} />
          <Route path={`/${locale}/login`} element={<Login />} />
          <Route path={`/${locale}/forgot-password`} element={<ForgotPassword />} />
          <Route path={`/${locale}/reset-password`} element={<ResetPassword />} />

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
