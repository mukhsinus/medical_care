import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Award, Users, MapPin, Phone } from "lucide-react";
import warehouseImage from "@/assets/warehouse.jpg";
import { useState } from "react";

export default function About() {
  const { t } = useLanguage();

  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const cards = [
    { icon: ShieldCheck, title: t.about.quality, desc: t.about.qualityDesc },
    { icon: Truck, title: t.about.logistics, desc: t.about.logisticsDesc },
    {
      icon: Award,
      title: t.about.certification,
      desc: t.about.certificationDesc,
    },
  ];

  const stats = [
    { value: t.about.stats.years, label: t.about.stats.yearsLabel },
    { value: t.about.stats.shipped, label: t.about.stats.shippedLabel },
    {
      value: t.about.stats.satisfaction,
      label: t.about.stats.satisfactionLabel,
    },
  ];

  const timeline = [
    { year: "2018", event: t.about.timeline.founded },
    { year: "2022", event: t.about.timeline.expanded },
    { year: "2020", event: t.about.timeline.certified },
    { year: "2026", event: t.about.timeline.serving },
  ];

  return (
    <Layout>
      <SEO title={t.about.title} description={t.about.mission} path="/about" />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* HERO TITLE */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.about.title}
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/50 mx-auto rounded-full"></div>
          </div>

          {/* MISSION */}
          <div className="max-w-3xl mx-auto mb-16 text-lg text-muted-foreground text-center leading-relaxed space-y-4">
            <p>{t.about.subtitle}</p>
            <p>{t.about.mission}</p>
          </div>

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
              <div
                key={i}
                className="text-center p-6 rounded-xl bg-card border shadow-sm"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* TIMELINE */}
          <div className="max-w-4xl mx-auto mb-20 hidden">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t.about.journeyTitle}
            </h2>
            <div className="space-y-8">
              {timeline.map((m, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-lg font-bold text-primary">
                      {m.year}
                    </span>
                  </div>
                  <div className="flex-1 pl-6 border-l-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                    <p className="text-foreground">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WHY CHOOSE MEDICARE */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t.about.whyChooseTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {t.about.whyChooseList.map((item, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM */}
          <div className="bg-muted/50 rounded-2xl p-8 md:p-12 text-center mb-20 hidden">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">{t.about.teamTitle}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              {t.about.teamDesc}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {/* Team Member 1 */}
              <div className="bg-muted/50 rounded-2xl p-8 text-center hover:bg-muted/70 transition-all duration-300 group">
                <div className="relative mb-6 mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:blur-xl transition-all duration-500"></div>
                  <img
                    src="https://images.unsplash.com/photo-1556157382-97eda2d9aa3b?w=400&h=400&fit=crop&crop=face"
                    alt="Ahmet Yılmaz"
                    className="relative w-full h-full rounded-full object-cover border-4 border-background shadow-2xl"
                  />
                </div>
                <h4 className="text-xl font-bold mb-1">Ahmet Yılmaz</h4>
                <p className="text-primary font-semibold mb-3">{t.about.ceo}</p>
                <p className="text-muted-foreground text-sm">
                  {t.about.ceoDesc}
                </p>
              </div>

              {/* Team Member 2 */}
              <div className="bg-muted/50 rounded-2xl p-8 text-center hover:bg-muted/70 transition-all duration-300 group">
                <div className="relative mb-6 mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:blur-xl transition-all duration-500"></div>
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face"
                    alt="Elif Kaya"
                    className="relative w-full h-full rounded-full object-cover border-4 border-background shadow-2xl"
                  />
                </div>
                <h4 className="text-xl font-bold mb-1">Elif Kaya</h4>
                <p className="text-primary font-semibold mb-3">{t.about.cto}</p>
                <p className="text-muted-foreground text-sm">
                  {t.about.ctoDesc}
                </p>
              </div>

              {/* Team Member 3 */}
              <div className="bg-muted/50 rounded-2xl p-8 text-center hover:bg-muted/70 transition-all duration-300 group">
                <div className="relative mb-6 mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:blur-xl transition-all duration-500"></div>
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b9350c73b68?w=400&h=400&fit=crop&crop=face"
                    alt="Mehmet Demir"
                    className="relative w-full h-full rounded-full object-cover border-4 border-background shadow-2xl"
                  />
                </div>
                <h4 className="text-xl font-bold mb-1">Mehmet Demir</h4>
                <p className="text-primary font-semibold mb-3">{t.about.cmo}</p>
                <p className="text-muted-foreground text-sm">
                  {t.about.cmoDesc}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">{t.about.ctaTitle}</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {t.about.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="w-[200px]"
                onClick={() =>
                  window.open(
                    "https://maps.google.com/maps?q=41.159574,69.251526&ll=41.159574,69.251526&z=16",
                    "_blank"
                  )
                }
              >
                <MapPin className="mr-2 h-5 w-5" />
                {t.common.findLocation}
              </Button>

              <div className="relative">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setPhoneMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={phoneMenuOpen}
                  className="w-full h-12 rounded-md w-[200px] border border-input flex items-center justify-center gap-2 text-base font-medium px-8 py-0"
                >
                  {/* Icon */}
                  <Phone className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />

                  {/* Text + ▾ in one container */}
                  <div className="flex flex-1 items-center justify-center gap-1">
                    <span className="text-center">
                      {t.contacts.phoneLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">▾</span>
                  </div>
                </Button>

                {/* Dropdown Menu */}
                {phoneMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Выберите номер"
                    className="
                    absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2
                    bg-white rounded-md shadow-lg border overflow-hidden
                    min-w-[160px] whitespace-nowrap
                    animate-in fade-in slide-in-from-bottom-2 duration-200
                  "
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        window.location.href = "tel:+998997013022";
                        setPhoneMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors text-sm"
                    >
                      +998 99 701 3022
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        window.location.href = "tel:+998559013022";
                        setPhoneMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors text-sm"
                    >
                      +998 55 901 3022
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
