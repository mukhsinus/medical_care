import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';

export default function Terms() {
  const { t } = useLanguage();
  const content = t.legal.terms;

  return (
    <Layout>
      <SEO
        title={content.title}
        description={content.intro}
        path="/legal/terms"
      />

      <article className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.title}</h1>
          <p className="text-lg text-muted-foreground mb-12">{content.intro}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{content.services}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.servicesText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{content.orders}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.ordersText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{content.liability}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.liabilityText}</p>
            </section>
          </div>
        </div>
      </article>
    </Layout>
  );
}
