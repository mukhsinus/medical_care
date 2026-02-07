import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Package,
  ShieldCheck,
  Mail,
  Send,
  Phone,
  Camera,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

import heroImage from "@/assets/hero-image.webp";
import catalogImage from "@/assets/catalog-image.webp";

import categoryInjection from "@/assets/category-injection.png";
import categoryEquipment from "@/assets/category-equipment.png";
import categorySurgery from "@/assets/category-surgery.png";
import categoryHygiene from "@/assets/category-hygiene.png";
import categoryDressings from "@/assets/sterilization.png";
import categoryLab from "@/assets/lab.png";

const categories = [
  { key: "injection", image: categoryInjection },
  { key: "equipment", image: categoryEquipment },
  { key: "surgery", image: categorySurgery },
  { key: "hygiene", image: categoryHygiene },
  { key: "dressings", image: categoryDressings },
  { key: "lab", image: categoryLab },
];

export default function Home() {
  const { locale, t } = useLanguage();

  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const phoneMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!phoneMenuRef.current) return;
      if (!phoneMenuRef.current.contains(e.target as Node)) {
        setPhoneMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleContactClick = (type: "email" | "telegram" | "instagram") => {
    const links = {
      email: "mailto:medicareuz2023@gmail.com",
      telegram: "https://t.me/medicareuz",
      instagram: "https://www.instagram.com/medicareuz",
    } as const;
    window.open(links[type], "_blank");
  };

  return (
    <Layout>
      <SEO title={t.hero.title} description={t.hero.subtitle} path="" />

      {/* ===================== HERO ===================== */}
      <section
        className="
          hero relative min-h-[100vh] lg:min-h-[100vh]
          hero relative min-h-[100svh] lg:min-h-[100svh]
          [--hero-top-gap:1.5rem] md:[--hero-top-gap:1.1rem]
          [--hero-bottom-gap:2.5rem] md:[--hero-bottom-gap:3rem] overflow-x-hidden
        "
        style={{
          ["--hero-full-bg-image" as any]: `url(${heroImage})`,
          ["--hero-image-opacity" as any]: "1",
          ["--hero-overlap" as any]: "132px",
          marginTop: "calc(var(--hero-overlap) * -0.5)",
        }}
      >
        <div className="mx-auto px-4 pt-12 md:pt-16 container">
          <div
            className="
              glass-panel glass-panel--hero w-full rounded-xl
              mt-[var(--hero-top-gap)]
              min-h-[calc(85vh-var(--hero-top-gap)-var(--hero-bottom-gap))]
              min-h-[calc(85svh-var(--hero-top-gap)-var(--hero-bottom-gap))]
              flex flex-col justify-center
            "
          >
            <div className="container mx-auto px-4">
              {/* removedlg:max-w-[1100px] xl:max-w-[1180px] */}
              <div className="grid md:grid-cols-1 gap-12 items-center">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight [text-wrap:balance]">
                    {t.hero.title}
                    {/* Доп. короткая фраза только в русской версии и только на десктопе */}
                    {locale === "ru" && t.hero?.extra && (
                      <span className="hidden lg:inline ml-3">
                        {t.hero.extra}
                      </span>
                    )}
                  </h1>
                  <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl">
                    {t.hero.subtitle}
                  </p>

                  {/* Только почта в HERO */}
                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      onClick={() => handleContactClick("email")}
                      className="btn-primary shadow-lg hover:shadow-xl w-full sm:w-auto"
                    >
                      <Mail className="mr-2 h-5 w-5" />
                      {t.hero.cta_primary}
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

      {/* ===================== CATEGORIES ===================== */}
      <section
        className="
          catalog relative isolate min-h-[100svh] overflow-x-hidden
          [--catalog-top-gap:4rem] md:[--catalog-top-gap:5rem]
          [--catalog-bottom-gap:2.5rem] md:[--catalog-bottom-gap:3rem]
        "
        style={{
          ["--catalog-full-bg-image" as any]: `url(${catalogImage})`,
          ["--catalog-image-opacity" as any]: "0.45",
          ["--catalog-overlap" as any]: "0px",
        }}
      >
        <div className="container mx-auto px-4 pt-12 md:pt-16">
          {/* removedlg:max-w-[1100px] xl:max-w-[1180px] */}
          <h2
            className="
              text-3xl md:text-4xl font-bold text-center mb-12
              glass-card rounded-xl w-full
              h-12 md:h-16 flex items-center justify-center
            "
          >
            {t.categories.title}
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3 lg:gap-6">
            {categories.map((category) => {
              const catData = t.categories[
                category.key as keyof typeof t.categories
              ] as { name: string; desc: string };
              return (
                <Link
                  key={category.key}
                  to={`/${locale}/catalog?category=${category.key}`}
                >
                  <div
                    className="
                    h-full w-full group relative glass-card overflow-hidden rounded-xl isolate
                    aspect-square lg:aspect-[4/3]
                    transition-transform duration-200
                    hover:scale-[1.01] active:scale-[.99]
                    lg:hover:scale-100 lg:hover:-translate-y-0.5
                    lg:hover:shadow-soft
                    grid place-items-center
                    
                    "
                  >
                    <div className="w-full h-full p-4 md:p-6 lg:p-0 grid place-items-center">
                      <img
                        src={category.image}
                        alt={catData.name}
                        className="
                          block object-contain
                          max-w-[72%] max-h-[72%]
                          lg:max-w-[58%] lg:max-h-[58%]
                          "
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:bottom-3 w-[90%] max-w-[200px] sm:w-auto">
                      <div className="w-full text-center rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 flex items-end justify-center">
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

      {/* ===================== GET IN TOUCH (контакты) ===================== */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t.contacts.getInTouch}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.contacts.text}
          </p>

          {/* Контакты — grid: 2 колонки на мобилке, 4 на md+ */}
          <div className="w-full max-w-lg md:max-w-5xl mx-auto">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* PHONE SELECTOR */}
              <div className="relative col-span-1">
                <Button
                  // type="button"
                  variant="outline"
                  onClick={() => setPhoneMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={phoneMenuOpen}
                  className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium px-8 py-0"
                >
                  {/* Icon */}
                  <Phone className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />

                  {/* Text + ▾ in one container */}
                  <div className="flex flex-1 items-center justify-center gap-1">
                    <span className="text-center">
                      {t.contacts.phoneLabel ?? "Телефон"}
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
              {/* TELEGRAM */}
              <div className="col-span-1">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleContactClick("telegram")}
                  className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium"
                >
                  <Send className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                  <span className="flex-1 text-center">
                    {t.contacts.telegram ?? "Telegram"}
                  </span>
                </Button>
              </div>

              {/* INSTAGRAM */}
              <div className="col-span-1">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleContactClick("instagram")}
                  className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium"
                >
                  <Camera className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                  <span className="flex-1 text-center">
                    {t.contacts.instagram ?? "Instagram"}
                  </span>
                </Button>
              </div>

              {/* EMAIL */}
              <div className="col-span-1">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleContactClick("email")}
                  className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium"
                >
                  <Mail className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                  <span className="flex-1 text-center">
                    {t.contacts.email ?? "Электронная почта"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
