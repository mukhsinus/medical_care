import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Truck, Award } from 'lucide-react';
import warehouseImage from '@/assets/warehouse.jpg';

export default function About() {
  const { t } = useLanguage();

  return (
    <Layout>
      <SEO
        title={t.about.title}
        description={t.about.mission}
        path="/about"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            {t.about.title}
          </h1>
          
          <div className="max-w-3xl mx-auto mb-16">
            <p className="text-lg text-muted-foreground text-center">
              {t.about.mission}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <img
                src={warehouseImage}
                alt="Medicare warehouse"
                className="rounded-2xl shadow-xl w-full h-auto"
                loading="lazy"
              />
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t.about.quality}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t.about.qualityDesc}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t.about.logistics}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t.about.logisticsDesc}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t.about.certification}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t.about.certificationDesc}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
