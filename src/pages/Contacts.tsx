import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Camera,
  Navigation,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export default function Contacts() {
  const { t } = useLanguage();
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);

  const handleContactClick = (type: "email" | "telegram" | "instagram") => {
    const links = {
      email: "mailto:medicareuz2023@gmail.com",
      telegram: "https://t.me/medicareuz",
      instagram: "https://www.instagram.com/medicareuz",
    } as const;
    window.open(links[type], "_blank");
  };

  const faqs = [
    { q: t.contacts.faq.q1, a: t.contacts.faq.a1 },
    { q: t.contacts.faq.q2, a: t.contacts.faq.a2 },
    { q: t.contacts.faq.q3, a: t.contacts.faq.a3 },
    { q: t.contacts.faq.q4, a: t.contacts.faq.a4 },
  ];

  return (
    <Layout>
      <SEO
        title={t.contacts.title}
        description={t.contacts.subtitle}
        path="/contacts"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* HERO */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.contacts.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t.contacts.subtitle}
            </p>
          </div>

          {/* MAP + ADDRESS */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="grid md:grid-cols-2 gap-0 overflow-hidden rounded-xl bg-card border shadow-lg">
              {/* LEFT: MAP */}
              <div className="relative h-96 md:h-full min-h-96 bg-muted/20">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=41.3111,69.2401"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block absolute inset-0 z-10"
                  aria-label="Open location in Google Maps"
                />
                <iframe
                  title="Our location"
                  className="absolute inset-0 w-full h-full border-0"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.9!2d69.2401!3d41.3111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b0a8b0a8b0b%3A0x8b0a8b0a8b0a8b0b!2sTashkent!5e0!3m2!1sen!2suz!4v1234567890"
                  allowFullScreen={false}
                  loading="lazy"
                  style={{ pointerEvents: "none" }}
                  referrerPolicy="no-referrer"
                ></iframe>
                <div className="absolute inset-0 bg-black/5 pointer-events-none" />
              </div>

              {/* RIGHT: ADDRESS + HOURS */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {t.contacts.visitOffice}
                  </h3>
                </div>

                <div className="space-y-5 text-muted-foreground">
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      {t.contacts.addressValue}
                    </p>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      {t.contacts.workingHours}
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <span className="font-medium text-foreground">
                          {t.contacts.monFri}:
                        </span>{" "}
                        {t.contacts.morningHours}
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          {t.contacts.saturday}:
                        </span>{" "}
                        {t.contacts.saturdayHours}
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          {t.contacts.sunday}:
                        </span>{" "}
                        {t.contacts.closed}
                      </li>
                    </ul>
                  </div>

                  <Button asChild className="w-full md:w-auto">
                    <a
                      href="https://maps.google.com?q=123+Business+Avenue"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {t.contacts.getDirections}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTACT BUTTONS */}
          <div className="max-w-5xl mx-auto mb-16">
            {/* OFFICES IN OTHER CITIES */}
            <Card className="bg-card border-2 mb-8 py-6 px-4">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {t.contacts.otherOffices}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{t.contacts.andijan}</p>
                      <a href="tel:+998774043022" className="text-primary hover:underline text-sm">
                        +998 77 404 3022
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{t.contacts.namangan}</p>
                      <a href="tel:+998774043022" className="text-primary hover:underline text-sm">
                        +998 77 404 3022
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{t.contacts.fergana}</p>
                      <a href="tel:+998774043022" className="text-primary hover:underline text-sm">
                        +998 77 404 3022
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{t.contacts.samarkand}</p>
                      <a href="tel:+998777053022" className="text-primary hover:underline text-sm">
                        +998 77 705 3022
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{t.contacts.bukhara}</p>
                      <a href="tel:+998773773022" className="text-primary hover:underline text-sm">
                        +998 77 377 3022
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{t.contacts.navoi}</p>
                      <a href="tel:+998773773022" className="text-primary hover:underline text-sm">
                        +998 77 377 3022
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GET IN TOUCH */}
            <Card className="bg-card border-2 py-6 px-4">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {t.contacts.getInTouch}
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {/* PHONE DROPDOWN */}
                <div className="relative col-span-1">
                  <Button
                    // type="button"
                    variant="outline"
                    onClick={() => setPhoneMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={phoneMenuOpen}
                    className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium px-6 py-0"
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
                    className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium px-6 py-0"
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
                    className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium px-6 py-0"
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
                    className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium px-6 py-0"
                  >
                    <Mail className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                    <span className="flex-1 text-center">
                      {t.contacts.email ?? "Электронная почта"}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* FAQ ACCORDION */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              {t.contacts.faqTitle}
            </h2>
            <Accordion
              type="single"
              collapsible
              className="bg-card rounded-xl shadow-sm border"
            >
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-b last:border-b-0"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </Layout>
  );
}
