import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

export default function Contacts() {
  const { t } = useLanguage();

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

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
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

          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-accent/30 to-background border-2">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {t.contacts.getInTouch}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => window.open('https://t.me/medicare_uz', '_blank')}
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {t.contacts.telegram}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open('https://wa.me/998901234567', '_blank')}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {t.contacts.whatsapp}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open('mailto:info@medicare.uz', '_blank')}
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    {t.contacts.email}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
