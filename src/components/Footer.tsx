import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

import logo1x from '@/assets/logo.png';
import logo2x from '@/assets/logo.png';

export const Footer = () => {
  const { locale, t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div>
            {/* Logo in footer */}
            <div className="logo-section">
              <img
                src={logo1x}
                srcSet={`${logo2x} 2x`}
                alt="Medicare"
                className="footer-logo-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="footer-description">{t.footer.description}</p>
          </div>

          <div>
            <h3 className="footer-section-title">{t.nav.catalog}</h3>
            <ul className="footer-list">
              <li className="catalog-item">{t.categories.gloves.name}</li>
              <li className="catalog-item">{t.categories.masks.name}</li>
              <li className="catalog-item">{t.categories.syringes.name}</li>
            </ul>
          </div>

          <div>
            <h3 className="footer-section-title">{t.footer.legal}</h3>
            <ul className="footer-list">
              <li>
                <Link to={`/${locale}/legal/privacy`} className="legal-link">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to={`/${locale}/legal/terms`} className="legal-link">
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="copyright">
          © {new Date().getFullYear()} Medicare. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
