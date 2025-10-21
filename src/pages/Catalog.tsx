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
import catalogImage from '@/assets/catalog-image.webp';


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


      <section
        className="
          catalog relative min-h-[100svh]
          [--catalog-top-gap:5rem] md:[--catalog-top-gap:6rem]
          [--catalog-bottom-gap:2.5rem] md:[--catalog-bottom-gap:3rem] overflow-x-hidden
        "
        style={{
          // backgroundImage:`url(${catalogImage})`,
          ['--catalog-full-bg-image' as any]: `url(${catalogImage})`,
          ['--catalog-image-opacity' as any]: '1',
          ['--catalog-overlap' as any]: '132px',
        }}
      ></section>


      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.catalog.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.catalog.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {categories.map((category) => {
              const catData = t.categories[category.key as keyof typeof t.categories] as { name: string; desc: string };
              return (
                <Card key={category.key} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden bg-accent/20">
                    <img
                      src={category.image}
                      alt={catData.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{catData.name}</CardTitle>
                    <CardDescription className="text-base">{catData.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleContactClick}
                    >
                      <Mail className="mr-2 h-4 w-4" />
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
