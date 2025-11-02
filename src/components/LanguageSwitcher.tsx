// LanguageSwitcher.tsx
import { useLanguage, Locale } from '@/contexts/LanguageContext';
import { Button } from './ui/button';
import { useLocation } from 'react-router-dom';

const locales: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
];

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();
  const location = useLocation();

  // Detect homepage: /ru, /uz, /en, or /
  const isHomePage =
    location.pathname === '/' ||
    /^\/(ru|uz|en)\/?$/.test(location.pathname);

  return (
    <div className="flex gap-1">
      {locales.map((loc) => {
        const isActive = locale === loc.code;

        return (
          <Button
            key={loc.code}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLocale(loc.code)}
            className={`
              min-w-[2.5rem] font-medium transition-colors duration-150
              ${
                !isActive && isHomePage
                  ? 'text-white hover:text-cyan-300 hover:bg-white/10'
                  : ''
              }
            `}
          >
            {loc.label}
          </Button>
        );
      })}
    </div>
  );
};