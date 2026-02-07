import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useState, useEffect } from 'react';
import { Menu, X, ShoppingBasket, User } from 'lucide-react';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';

import logo from '@/assets/logo-removebg-preview.png';

export const Header = () => {
  const { locale, t } = useLanguage();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const uniqueItemsCount = items.length;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mobileNavItems = [
    { path: `/${locale}`, label: t.nav.home },
    { path: `/${locale}/about`, label: t.nav.about },
    { path: `/${locale}/catalog`, label: t.nav.catalog },
    { path: `/${locale}/contacts`, label: t.nav.contacts },
  ];

  const desktopNavItems = [
    ...mobileNavItems
  ];

  const isActive = (path: string) => {
    if (path === `/${locale}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-2 z-50">
      {/* Используем ТУТ ту же контейнерную систему, что и в Home */}
      <div className="container mx-auto px-4 relative">{ /* removedlg:max-w-[1100px] xl:max-w-[1180px] */}
        {/* стеклянная «капсула» навбара — теперь будет ровно по ширине контейнера */}
        <div
          className={`nav-glass w-full lg:px-4 ${
            isScrolled ? 'nav-glass--scrolled' : ''
          } mb-3 sm:mb-3 md:mb-0 rounded-xl`}
        >
          <div className="h-12 md:h-16 px-4 md:px-5 lg:px-4 flex items-center justify-between">
            {/* ЛОГО */}
            <Link to={`/${locale}`} className="flex items-center">
              <img
                src={logo}
                alt="Medicare"
                className="h-8 w-auto rounded-none"
                loading="eager"
                decoding="async"
              />
            </Link>

            {/* Мобилка: бургер, корзина, логин */}
            <div className="flex items-center gap-2 md:hidden">
              <Link to={`/${locale}/basket`} className="relative">
                <ShoppingBasket className="h-5 w-5 text-slate-700/80 hover:text-slate-900" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {uniqueItemsCount}
                </span>
              </Link>
              <Link to={`/${locale}/login`}>
                <User className="h-5 w-5 text-slate-700/80 hover:text-slate-900" />
              </Link>
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

            {/* Навигация — десктоп */}
            <nav className="hidden md:flex items-center gap-1">
              {desktopNavItems.map((item) => (
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

            {/* Переключатель языка и иконки — десктоп */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <Link to={`/${locale}/basket`} className="relative">
                <ShoppingBasket className="h-5 w-5 text-slate-700/80 hover:text-slate-900" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {uniqueItemsCount}
                </span>
              </Link>
              <Link to={`/${locale}/login`}>
                <User className="h-5 w-5 text-slate-700/80 hover:text-slate-900" />
              </Link>
            </div>
          </div>
        </div>

        {/* Мобильное меню — выпадает вниз под капсулой (ширина мобилки как раньше) */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 right-0 top-full mt-2 z-50 md:hidden">
              <div className="container mx-auto px-4 lg:max-w-[1100px] xl:max-w-[1180px]">
                <div className="nav-glass overflow-hidden rounded-2xl">
                  <nav className="p-3 nav-glass-blurred">
                  {mobileNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-white/70 text-slate-900'
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
          </div>
          </>
        )}
      </div>
    </header>
  );
};