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

      {/* Hero */}
      <section
        className="hero"
        style={{
          ['--hero-full-bg-image' as any]: `url(${heroImage})`,
          ['--hero-image-opacity' as any]: '1',
          ['--hero-overlap' as any]: '80px',
        }}
      >
        <div className="hero-scene">
          <div className="hero-glass-panel">
            <div className="hero-container">
              <div className="hero-grid">
                <div>
                  <h1 className="hero-title">{t.hero.title}</h1>
                  <div className="hero-buttons">
                    <Button
                      className="btn-primary"
                      onClick={() => handleContactClick('email')}
                    >
                      <Mail className="icon" />
                      {t.hero.cta_primary}
                    </Button>
                    <Button
                      className="btn-outline"
                      onClick={() => handleContactClick('telegram')}
                    >
                      <Send className="icon" />
                      {t.hero.cta_secondary}
                    </Button>
                  </div>
                </div>
              </div>

              {/* KPI */}
              <div className="kpi-grid">
                <Card className="glass-card">
                  <CardContent className="kpi-content">
                    <div className="kpi-icon-wrapper">
                      <Clock className="kpi-icon" />
                    </div>
                    <p className="kpi-text">{t.kpi.delivery}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="kpi-content">
                    <div className="kpi-icon-wrapper">
                      <Package className="kpi-icon" />
                    </div>
                    <p className="kpi-text">{t.kpi.sku}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="kpi-content">
                    <div className="kpi-icon-wrapper">
                      <ShieldCheck className="kpi-icon" />
                    </div>
                    <p className="kpi-text">{t.kpi.certified}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="categories-container">
          <h2 className="categories-title">{t.categories.title}</h2>
          <div className="categories-grid">
            {categories.map((category) => {
              const catData = t.categories[category.key as keyof typeof t.categories] as {
                name: string;
                desc: string;
              };
              return (
                <Link key={category.key} to={`/${locale}/catalog`} className="category-link">
                  <Card className="category-card">
                    <div className="category-image-wrapper">
                      <img
                        src={category.image}
                        alt={catData.name}
                        className="category-image"
                        loading="lazy"
                      />
                    </div>
                    <CardHeader className="category-header">
                      <CardTitle className="category-title">{catData.name}</CardTitle>
                      <CardDescription className="category-description">{catData.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="how-we-work-section">
        <div className="how-we-work-container">
          <h2 className="how-we-work-title">{t.howWeWork.title}</h2>
          <div className="how-we-work-grid">
            {(['step1', 'step2', 'step3', 'step4'] as const).map((step, index) => (
              <div key={step} className="how-we-work-step">
                <div className="step-number">{index + 1}</div>
                <h3 className="step-title">{t.howWeWork[step]}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">{t.contacts.getInTouch}</h2>
          <p className="cta-description">{t.hero.subtitle}</p>
          <div className="cta-buttons">
            <Button className="btn-primary" onClick={() => handleContactClick('email')}>
              <Mail className="icon" />
              {t.contacts.email}
            </Button>
            <Button className="btn-outline" onClick={() => handleContactClick('telegram')}>
              <Send className="icon" />
              {t.contacts.telegram}
            </Button>
            <Button className="btn-outline" onClick={() => handleContactClick('whatsapp')}>
              <MessageCircle className="icon" />
              {t.contacts.whatsapp}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
