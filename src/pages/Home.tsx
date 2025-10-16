import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Package, ShieldCheck, Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroImage from '@/assets/hero-image.jpg';
import categoryGloves from '@/assets/category-gloves.jpg';
import categoryMasks from '@/assets/category-masks.jpg';
import categorySyringes from '@/assets/category-syringes.jpg';
import categoryGowns from '@/assets/category-gowns.jpg';
import categoryDressings from '@/assets/category-dressings.jpg';
import categoryLab from '@/assets/category-lab.jpg';

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


                    {/* hero */}
      <section
        className="hero relative min-h-[calc(100dvh-64px)] md:min-h-[560px] lg:min-h-[720px]"
        style={{
          ['--hero-full-bg-image' as any]: `url(${heroImage})`,
          ['--hero-image-opacity' as any]: '1',
          ['--hero-overlap' as any]: '80px',
        }}
      >
        <div className="hero-scene mx-2 md:mx-4 px-2 md:px-3 py-3 md:py-4">
          <div className="glass-panel w-full  min-h-[300px] md:min-h-[680px] flex flex-col justify-center md:mt-2.5">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-1 gap-12 items-center">
                <div>
                  {/* <div className="eyebrow">{t.hero.eyebrow}</div> */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                    {t.hero.title}
                  </h1>
                  {/* <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl">
                    {t.hero.subtitle}
                  </p> */}
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
      </div>
    </section>

      {/* ===================== CATEGORIES ===================== */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t.categories.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => {
              const catData = t.categories[category.key as keyof typeof t.categories] as {
                name: string;
                desc: string;
              };
              return (
                <Link key={category.key} to={`/${locale}/catalog`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden">
                    <div className="aspect-square overflow-hidden bg-accent/20">
                      <img
                        src={category.image}
                        alt={catData.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{catData.name}</CardTitle>
                      <CardDescription>{catData.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== HOW WE WORK ===================== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {t.howWeWork.title}
          </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {(['step1', 'step2', 'step3', 'step4'] as const).map((step, index) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-lg">
                  {t.howWeWork[step]}
                </h3>
              </div>
            ))}
          </div>
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

            <Button
              size="lg"
              variant="outline"
              onClick={() => handleContactClick('telegram')}
              className="btn-outline"
            >
              <Send className="mr-2 h-5 w-5" />
              {t.contacts.telegram}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => handleContactClick('whatsapp')}
              className="btn-outline"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              {t.contacts.whatsapp}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}