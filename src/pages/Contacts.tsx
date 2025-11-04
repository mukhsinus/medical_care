import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Camera } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Contacts() {
  const { t } = useLanguage();

  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const phoneMenuRef = useRef<HTMLDivElement | null>(null);

  const contactItems = [
    {
      icon: Phone,
      title: t.contacts.phone,
      value: '+998 (90) 123-45-67',
      action: () => window.open('tel:+998901234567', '_self'),
    },
    {
      icon: Mail,
      title: t.contacts.email,
      value: 'info@medicare.uz',
      action: () => window.open('mailto:info@medicare.uz', '_blank'),
    },
    {
      icon: MapPin,
      title: t.contacts.address,
      value: t.contacts.addressValue,
    },
    {
      icon: Clock,
      title: t.contacts.hours,
      value: t.contacts.hoursValue,
    },
  ];
  const handleContactClick = (type: 'email' | 'telegram' | 'instagram') => {
    const links = {
      email: 'mailto:medicareuz2023@gmail.com',
      telegram: 'https://t.me/medicareuz',
      instagram: 'https://www.instagram.com/medicareuz',
    } as const;
    window.open(links[type], '_blank');
  };

  return (
    <Layout>
      <SEO
        title={t.contacts.title}
        description={t.contacts.subtitle}
        path="/contacts"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.contacts.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t.contacts.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {contactItems.map((item, index) => (
              <Card
                key={index}
                className={`${item.action ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={item.action}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-5xl mx-auto">

            
            <Card className="bg-gradient-to-br from-accent/30 to-background border-2 px-6 pb-8">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {t.contacts.getInTouch}
                </CardTitle>
              </CardHeader>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mx-2 my-4">
            {/* PHONE SELECTOR */}
            <div className="relative col-span-1">
              <Button
                // type="button"
                variant='outline'
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
                    {t.contacts.phoneLabel ?? 'Телефон'}
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
                      window.location.href = 'tel:+998997013022'
                      setPhoneMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors text-sm"
                  >
                    +998 99 701 3022
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      window.location.href = 'tel:+998559013022'
                      setPhoneMenuOpen(false)
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
                onClick={() => handleContactClick('telegram')}
                className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium"
              >
                <Send className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                <span className="flex-1 text-center">{t.contacts.telegram ?? 'Telegram'}</span>
              </Button>
            </div>

            {/* INSTAGRAM */}
            <div className="col-span-1">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleContactClick('instagram')}
                className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium"
              >
                <Camera className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                <span className="flex-1 text-center">{t.contacts.instagram ?? 'Instagram'}</span>
              </Button>
            </div>

            {/* EMAIL */}
            <div className="col-span-1">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleContactClick('email')}
                className="w-full h-12 rounded-md border border-input flex items-center justify-center gap-2 text-base font-medium"
              >
                <Mail className="h-5 w-5 flex-shrink-0 text-[hsl(200_90%_45%)]" />
                <span className="flex-1 text-center">{t.contacts.email ?? 'Электронная почта'}</span>
              </Button>
            </div>
          </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
