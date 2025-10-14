import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';

export default function Privacy() {
  const { t } = useLanguage();
  const content = t.legal.privacy;

  return (
    <Layout>
      <SEO
        title={content.title}
        description={content.intro}
        path="/legal/privacy"
      />

      <article className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.title}</h1>
          <p className="text-lg text-muted-foreground mb-12">{content.intro}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{content.collection}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.collectionText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{content.usage}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.usageText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{content.protection}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.protectionText}</p>
            </section>
          </div>
        </div>
      </article>
    </Layout>
  );
}
