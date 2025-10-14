import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import Contacts from "./pages/Contacts";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to /en */}
              <Route path="/" element={<Navigate to="/en" replace />} />
              
              {/* Localized routes */}
              {['en', 'ru', 'uz'].map((locale) => (
                <React.Fragment key={locale}>
                  <Route path={`/${locale}`} element={<Home />} />
                  <Route path={`/${locale}/about`} element={<About />} />
                  <Route path={`/${locale}/catalog`} element={<Catalog />} />
                  <Route path={`/${locale}/contacts`} element={<Contacts />} />
                  <Route path={`/${locale}/legal/privacy`} element={<Privacy />} />
                  <Route path={`/${locale}/legal/terms`} element={<Terms />} />
                </React.Fragment>
              ))}
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
