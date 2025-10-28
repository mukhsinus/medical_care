// src/pages/ForgotPassword.tsx
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { useLocation } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const { t, locale } = useLanguage();
  const location = useLocation();

  return (
    <Layout>
      <SEO
        title={t.forgot_password?.title || 'Forgot Password'}
        description={t.forgot_password?.description || 'Reset your password.'}
        path={location.pathname}
      />
      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold glass-card rounded-2xl px-4 py-2 text-center mb-12">
            {t.forgot_password?.title || 'Forgot Password'}
          </h1>
          {/* Add reset password form */}
        </div>
      </section>
    </Layout>
  );
};
export default ForgotPassword;