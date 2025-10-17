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
    <header className="header">
      {/* Relative wrapper — anchor for dropdown menu */}
      <div className="header-wrapper">
        {/* Glass "floating" capsule */}
        <div className={`nav-glass ${isScrolled ? 'nav-glass--scrolled' : ''}`}>
          <div className="nav-bar">
            {/* Logo */}
            <Link to={`/${locale}`} className="logo-link">
              <img
                src={logo1x}
                srcSet={`${logo2x} 2x`}
                alt="Medicare"
                className="logo-img"
                loading="eager"
                decoding="async"
              />
            </Link>

            {/* Navigation — desktop */}
            <nav className="nav-desktop">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Language switcher — desktop */}
            <div className="language-switcher-desktop">
              <LanguageSwitcher />
            </div>

            {/* Burger — mobile */}
            <Button
              className="mobile-menu-button"
              aria-label="Toggle Menu"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              {isMobileMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu — drops DOWN below capsule */}
        {isMobileMenuOpen && (
          <>
            {/* Clickable overlay to close outside menu */}
            <div
              className="mobile-menu-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="mobile-menu">
              <div className="mobile-menu-glass">
                <nav className="nav-mobile">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="mobile-language-divider">
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