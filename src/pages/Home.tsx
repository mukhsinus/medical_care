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
    };
    window.open(links[type], '_blank');
  };

  return (
    <Layout>
      <SEO
        title={t.hero.title}
        description={t.hero.subtitle}
        path=""
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-accent/30 via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                {t.hero.eyebrow}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                {t.hero.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => handleContactClick('email')}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  {t.hero.cta_primary}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleContactClick('telegram')}
                >
                  <Send className="mr-2 h-5 w-5" />
                  {t.hero.cta_secondary}
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Medical warehouse"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                loading="eager"
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{t.kpi.delivery}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{t.kpi.sku}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{t.kpi.certified}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t.categories.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => {
              const catData = t.categories[category.key as keyof typeof t.categories] as { name: string; desc: string };
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

      {/* How We Work */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {t.howWeWork.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {['step1', 'step2', 'step3', 'step4'].map((step, index) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-lg">
                  {t.howWeWork[step as keyof typeof t.howWeWork]}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t.contacts.getInTouch}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => handleContactClick('email')}>
              <Mail className="mr-2 h-5 w-5" />
              {t.contacts.email}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleContactClick('telegram')}
            >
              <Send className="mr-2 h-5 w-5" />
              {t.contacts.telegram}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleContactClick('whatsapp')}
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
