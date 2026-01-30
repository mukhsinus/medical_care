import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOProps {
  title: string;
  description: string;
  path: string;
}

export const SEO = ({ title, description, path }: SEOProps) => {
  const { locale } = useLanguage();
  const baseUrl = 'https://medicare.uz'; // Replace with actual domain
  const currentUrl = `${baseUrl}/${locale}${path}`;
  
  const alternateLocales = ['en', 'ru', 'uz'].filter(l => l !== locale);
  const hrefLangMap: Record<string, string> = {
    'en': 'en',
    'ru': 'ru',
    'uz': 'uz'
  };

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title} | Medicare</title>
      <meta name="description" content={description} />
      <meta name="content-language" content={locale} />
      
      <link rel="canonical" href={currentUrl} />
      
      {/* Hreflang tags for all locales including default */}
      <link rel="alternate" hrefLang={hrefLangMap[locale]} href={currentUrl} />
      {alternateLocales.map(altLocale => (
        <link
          key={altLocale}
          rel="alternate"
          hrefLang={hrefLangMap[altLocale]}
          href={`${baseUrl}/${altLocale}${path}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/uz${path}`} />
      
      <meta property="og:title" content={`${title} | Medicare`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={locale === 'en' ? 'en_US' : locale === 'ru' ? 'ru_RU' : 'uz_UZ'} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | Medicare`} />
      <meta name="twitter:description" content={description} />
      
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Medicare",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
          "sameAs": []
        })}
      </script>
      
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Medicare",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "UZ",
            "addressLocality": "Tashkent"
          }
        })}
      </script>
    </Helmet>
  );
};
