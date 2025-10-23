import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// ↓ импортируем тот же логотип
import logo1x from '@/assets/logo.png';
import logo2x from '@/assets/logo.png';

export const Footer = () => {
  const { locale, t } = useLanguage();

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            {/* Лого в футере */}
            <div className="flex items-center gap-2 mb-3">
              <img
                src={logo1x}
                srcSet={`${logo2x} 2x`}
                alt="Medicare"
                className="h-8 w-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-sm text-muted-foreground">{t.footer.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t.nav.catalog}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t.categories.injection.name}</li>
              <li>{t.categories.equipment.name}</li>
              <li>{t.categories.surgery.name}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t.footer.legal}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to={`/${locale}/legal/privacy`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  to={`/${locale}/legal/terms`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Medicare. All rights reserved.
        </div>
      </div>
    </footer>
  );
};