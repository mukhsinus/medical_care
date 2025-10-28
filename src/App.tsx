// src/App.jsx
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Account from './pages/Account'; // Add Account
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <LanguageProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                    <Route path={`/${locale}/account`} element={<Account />} />
                    <Route path={`/${locale}/forgot-password`} element={<ForgotPassword />} />
                  </React.Fragment>
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;