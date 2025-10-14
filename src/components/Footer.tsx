import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { locale, t } = useLanguage();

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                M
              </div>
              <span className="text-xl font-bold">MEDICARE</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.footer.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t.nav.catalog}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t.categories.gloves.name}</li>
              <li>{t.categories.masks.name}</li>
              <li>{t.categories.syringes.name}</li>
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
