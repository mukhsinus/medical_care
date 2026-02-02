// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError(t.forgot_password?.error || 'Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || t.forgot_password?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={t.forgot_password?.title || 'Forgot Password'}
        description={t.forgot_password?.description || 'Reset your password'}
        path="/forgot-password"
      />
      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate(`/${locale}/login`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.common?.back || 'Back to Login'}
            </Button>

            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              {t.forgot_password?.title || 'Forgot Password'}
            </h1>

            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6">
                {success ? (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-xl font-semibold">
                      {t.forgot_password?.success_title || 'Check Your Email'}
                    </h2>
                    <p className="text-muted-foreground">
                      {t.forgot_password?.success_message ||
                        'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.'}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate(`/${locale}/login`)}
                    >
                      {t.common?.back_to_login || 'Back to Login'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6 text-center">
                      {t.forgot_password?.description ||
                        'Enter your email address and we\'ll send you a link to reset your password.'}
                    </p>

                    {error && (
                      <div className="flex items-center gap-2 text-red-500 mb-4 p-3 bg-red-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" className="text-muted-foreground">
                            {t.forgot_password?.email_label || 'Email Address'}
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 bg-white/70"
                              placeholder={t.forgot_password?.email_placeholder || 'Enter your email'}
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full btn-primary"
                          disabled={isLoading}
                        >
                          {isLoading
                            ? (t.common?.loading || 'Sending...')
                            : (t.forgot_password?.submit_button || 'Send Reset Link')}
                        </Button>
                      </div>
                    </form>

                    <div className="mt-6 text-center">
                      <Link
                        to={`/${locale}/login`}
                        className="text-sm text-primary hover:underline"
                      >
                        {t.common?.back_to_login || 'Back to Login'}
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default ForgotPassword;