import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Package, ShieldCheck, Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroImage from '@/assets/hero-image.jpg';
import catalogImage from '@/assets/catalog-image.webp';

import categoryGloves from '@/assets/gloves.webp';
import categoryMasks from '@/assets/mask.png';
import categorySyringes from '@/assets/needles.webp';
import categoryGowns from '@/assets/gown.png';
import categoryDressings from '@/assets/plaster.png';
import categoryLab from '@/assets/disposable.png';

const categories = [
  { key: 'gloves', image: categoryGloves },
  { key: 'masks', image: categoryMasks },
  { key: 'syringes', image: categorySyringes },
  { key: 'gowns', image: categoryGowns },
  { key: 'dressings', image: categoryDressings },
  { key: 'lab', image: categoryLab },
];

export default function Home() {
  const { locale, t } = useLanguage();

  const handleContactClick = (type: 'email' | 'telegram' | 'whatsapp') => {
    const links = {
      email: 'mailto:info@medicare.uz?subject=Price List Request',
      telegram: 'https://t.me/medicare_uz',
      whatsapp: 'https://wa.me/998901234567',
    } as const;
    window.open(links[type], '_blank');
  };

  return (
    <Layout>
      <SEO title={t.hero.title} description={t.hero.subtitle} path="" />

      {/* ===================== HERO ===================== */}
      <section
        className="
          hero relative min-h-[100svh]
          [--hero-top-gap:5rem] md:[--hero-top-gap:6rem]
          [--hero-bottom-gap:2.5rem] md:[--hero-bottom-gap:3rem] overflow-x-hidden
        "
        style={{
          ['--hero-full-bg-image' as any]: `url(${heroImage})`,
          ['--hero-image-opacity' as any]: '1',
          ['--hero-overlap' as any]: '132px',
          marginTop: 'calc(var(--hero-overlap) * -0.5)',
        }}
      >
        <div className="hero-scene mx-2 md:mx-4 px-2 md:px-3">
          <div
            className="
              glass-panel w-full
              mt-[var(--hero-top-gap)]
              min-h-[calc(100svh-var(--hero-top-gap)-var(--hero-bottom-gap))]
              flex flex-col justify-center
            "
          >
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-1 gap-12 items-center">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight [text-wrap:balance]">
                    {t.hero.title}
                  </h1>
                  <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl">
                    {t.hero.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" onClick={() => handleContactClick('email')} className="btn-primary shadow-lg hover:shadow-xl">
                      <Mail className="mr-2 h-5 w-5" />
                      {t.hero.cta_primary}
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => handleContactClick('telegram')} className="btn-outline">
                      <Send className="mr-2 h-5 w-5" />
                      {t.hero.cta_secondary}
                    </Button>
                  </div>
                </div>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                <Card className="glass-card">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-[hsl(200_80%_94%)] rounded-lg">
                      <Clock className="h-6 w-6 text-[hsl(200_90%_45%)]" />
                    </div>
                    <p className="font-semibold text-lg">{t.kpi.delivery}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-[hsl(200_80%_94%)] rounded-lg">
                      <Package className="h-6 w-6 text-[hsl(200_90%_45%)]" />
                    </div>
                    <p className="font-semibold text-lg">{t.kpi.sku}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-[hsl(200_80%_94%)] rounded-lg">
                      <ShieldCheck className="h-6 w-6 text-[hsl(200_90%_45%)]" />
                    </div>
                    <p className="font-semibold text-lg">{t.kpi.certified}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="h-[var(--hero-bottom-gap)]" aria-hidden />
        </div>
      </section>

      {/* ===================== CATEGORIES (фон только в этой секции, НЕ заходит под HERO) ===================== */}
      <section
        className="
          catalog relative isolate min-h-[100svh] overflow-x-hidden
          [--catalog-top-gap:4rem] md:[--catalog-top-gap:5rem]
          [--catalog-bottom-gap:2.5rem] md:[--catalog-bottom-gap:3rem]
        "
        style={{
          ['--catalog-full-bg-image' as any]: `url(${catalogImage})`,
          ['--catalog-image-opacity' as any]: '0.45',
          ['--catalog-overlap' as any]: '0px',          // ⬅️ отключаем «заезд» вверх
          // marginTop убираем полностью, чтобы фон каталога не лез под hero
        }}
      >
        <div className="container mx-auto px-4 pt-12 md:pt-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t.categories.title}
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3 lg:gap-7">
            {categories.map((category) => {
              const catData = t.categories[category.key as keyof typeof t.categories] as { name: string; desc: string };
              return (
                <Link key={category.key} to={`/${locale}/catalog`}>
                  <div className="h-full w-full group relative glass-card overflow-hidden rounded-2xl isolate aspect-square transition-transform duration-200 hover:scale-[1.01] active:scale-[.99] flex justify-center">
                    <img
                      src={category.image}
                      alt={catData.name}
                      className="z-content h-[65%] w-[70%] object-contain transition-transform duration-300 group-hover:scale-[0.95]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:bottom-3 w-[90%] max-w-[200px] sm:w-auto">
                      <div className="w-full text-center rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 flex items-end justify-center"> {/*  убрал glass panel */}
                        <span className="text-[12px] md:text-sm font-semibold leading-tight">
                          {catData.name}
                        </span>
                      </div>
                    </div>
                    <p className="sr-only">{catData.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="h-[var(--catalog-bottom-gap)]" aria-hidden />
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t.contacts.getInTouch}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => handleContactClick('email')} className="btn-primary">
              <Mail className="mr-2 h-5 w-5" />
              {t.contacts.email}
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleContactClick('telegram')} className="btn-outline">
              <Send className="mr-2 h-5 w-5" />
              {t.contacts.telegram}
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleContactClick('whatsapp')} className="btn-outline">
              <MessageCircle className="mr-2 h-5 w-5" />
              {t.contacts.whatsapp}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}