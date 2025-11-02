import { useLanguage, Locale } from '@/contexts/LanguageContext';
import { Button } from './ui/button';

const locales: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
];

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex gap-1">
      {locales.map((loc) => (
        <Button
          key={loc.code}
          variant={locale === loc.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLocale(loc.code)}
          className="min-w-[2.5rem] font-medium"
        >
          {loc.label}
        </Button>
      ))}
    </div>
  );
};
