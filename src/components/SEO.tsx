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

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title} | Medicare</title>
      <meta name="description" content={description} />
      
      <link rel="canonical" href={currentUrl} />
      
      {alternateLocales.map(altLocale => (
        <link
          key={altLocale}
          rel="alternate"
          hrefLang={altLocale}
          href={`${baseUrl}/${altLocale}${path}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${path}`} />
      
      <meta property="og:title" content={`${title} | Medicare`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      
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
