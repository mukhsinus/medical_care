import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

import logo1x from '@/assets/logo.png';
import logo2x from '@/assets/logo.png';

export const Header = () => {
  const { locale, t } = useLanguage();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: `/${locale}`, label: t.nav.home },
    { path: `/${locale}/about`, label: t.nav.about },
    { path: `/${locale}/catalog`, label: t.nav.catalog },
    { path: `/${locale}/contacts`, label: t.nav.contacts },
  ];

  const isActive = (path: string) => {
    if (path === `/${locale}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-4 z-50">
      {/* относительная обёртка — якорь для выпадающего меню */}
      <div className="mx-4 md:mx-7 relative">
        {/* стеклянная «плавающая» капсула */}
        <div className={`nav-glass w-full ${isScrolled ? 'nav-glass--scrolled' : ''} mb-3 sm:mb-3 md:mb-0`}>
          <div className="h-12 md:h-16 px-4 md:px-5 flex items-center justify-between">
            {/* ЛОГО */}
            <Link to={`/${locale}`} className="flex items-center">
              <img
                src={logo1x}
                srcSet={`${logo2x} 2x`}
                alt="Medicare"
                className="h-8 w-auto"
                loading="eager"
                decoding="async"
              />
            </Link>

            {/* Навигация — десктоп */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-white/70 text-slate-900'
                      : 'text-slate-700/80 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Переключатель языка — десктоп */}
            <div className="hidden md:flex">
              <LanguageSwitcher />
            </div>

            {/* Бургер — мобилка */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle Menu"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Мобильное меню — выпадает ВНИЗ под капсулой */}
        {isMobileMenuOpen && (
          <>
            {/* кликабельная подложка для закрытия вне меню */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 right-0 top-full mt-2 z-50 md:hidden">
              <div className="nav-glass overflow-hidden rounded-2xl">
                <nav className="p-3 bg-white/80">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-white text-slate-900'
                          : 'text-slate-700/80 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="pt-2 mt-2 border-t border-white/60">
                    <LanguageSwitcher />
                  </div>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};