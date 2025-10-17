import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
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

export default function Catalog() {
  const { t } = useLanguage();

  const handleContactClick = () => {
    window.open('mailto:info@medicare.uz?subject=Catalog Inquiry', '_blank');
  };

  return (
    <Layout>
      <SEO
        title={t.catalog.title}
        description={t.catalog.subtitle}
        path="/catalog"
      />

      <section className="catalog-section">
        <div className="catalog-container">
          <div className="catalog-header">
            <h1 className="catalog-title">{t.catalog.title}</h1>
            <p className="catalog-subtitle">{t.catalog.subtitle}</p>
          </div>

          <div className="catalog-grid">
            {categories.map((category) => {
              const catData = t.categories[category.key as keyof typeof t.categories] as { name: string; desc: string };
              return (
                <Card key={category.key} className="catalog-card">
                  <div className="card-image-wrapper">
                    <img
                      src={category.image}
                      alt={catData.name}
                      className="card-image"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader className="card-header">
                    <CardTitle className="card-title">{catData.name}</CardTitle>
                    <CardDescription className="card-description">{catData.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="card-content">
                    <Button
                      className="catalog-button"
                      onClick={handleContactClick}
                    >
                      <Mail className="catalog-icon" />
                      {t.catalog.contactCta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
