import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Truck, Award, Users, Clock, MapPin } from 'lucide-react';
import warehouseImage from '@/assets/warehouse.jpg';

export default function About() {
  const { t } = useLanguage();

  const cards = [
    { icon: ShieldCheck, title: t.about.quality, desc: t.about.qualityDesc },
    { icon: Truck, title: t.about.logistics, desc: t.about.logisticsDesc },
    { icon: Award, title: t.about.certification, desc: t.about.certificationDesc },
  ];

  const stats = [
    { value: t.about.stats.years, label: t.about.stats.yearsLabel },
    { value: t.about.stats.shipped, label: t.about.stats.shippedLabel },
    { value: t.about.stats.satisfaction, label: t.about.stats.satisfactionLabel },
  ];

  const timeline = [
    { year: '2008', event: t.about.timeline.founded },
    { year: '2015', event: t.about.timeline.expanded },
    { year: '2020', event: t.about.timeline.certified },
    { year: '2024', event: t.about.timeline.serving },
  ];

  return (
    <Layout>
      <SEO title={t.about.title} description={t.about.mission} path="/about" />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">

          {/* HERO TITLE */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.about.title}</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/50 mx-auto rounded-full"></div>
          </div>

          {/* MISSION */}
          <p className="max-w-3xl mx-auto mb-16 text-lg text-muted-foreground text-center leading-relaxed">
            {t.about.mission}
          </p>

          {/* IMAGE + CARDS */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch mb-20">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src={warehouseImage}
                alt={t.about.imageAlt}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>

            <div className="grid gap-6">
              {cards.map((c, i) => (
                <Card
                  key={i}
                  className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/50 h-full"
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <c.icon className="h-6 w-6 text-primary group-hover:animate-pulse" />
                      </div>
                      <CardTitle className="text-lg">{c.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-muted-foreground">{c.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="flex justify-center items-center gap-3 my-20">
            <div className="h-px bg-border flex-1"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="h-px bg-border flex-1"></div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-card border shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* TIMELINE */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t.about.journeyTitle}</h2>
            <div className="space-y-8">
              {timeline.map((m, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-lg font-bold text-primary">{m.year}</span>
                  </div>
                  <div className="flex-1 pl-6 border-l-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                    <p className="text-foreground">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM */}
          <div className="bg-muted/50 rounded-2xl p-8 md:p-12 text-center mb-20">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">{t.about.teamTitle}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">{t.about.teamDesc}</p>
            <Button variant="outline">{t.common.viewLeadership}</Button>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">{t.about.ctaTitle}</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{t.about.ctaDesc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <MapPin className="mr-2 h-5 w-5" />
                {t.common.findLocation}
              </Button>
              <Button size="lg" variant="outline">
                <Clock className="mr-2 h-5 w-5" />
                {t.common.scheduleCall}
              </Button>
            </div>
          </div>

        </div>
      </section>
    </Layout>
  );
}