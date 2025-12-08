// src/pages/ResetPassword.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !id) {
      setError(t.reset_password?.invalid_link || 'Invalid reset link');
      return;
    }

    if (!password || !confirmPassword) {
      setError(t.reset_password?.error || 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError(t.reset_password?.password_mismatch || 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(t.reset_password?.password_too_short || 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8090/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, id, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      // Save token if provided
      if (data?.token) {
        localStorage.setItem('authToken', data.token);
      }

      setSuccess(true);
      
      // Redirect to account after 2 seconds
      setTimeout(() => {
        navigate(`/${locale}/account`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t.reset_password?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !id) {
    return (
      <Layout>
        <SEO
          title={t.reset_password?.title || 'Reset Password'}
          description={t.reset_password?.description || 'Reset your password'}
          path="/reset-password"
        />
        <section className="min-h-[calc(100svh-4rem)] py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">
                {t.reset_password?.invalid_link || 'Invalid Reset Link'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t.reset_password?.invalid_link_message || 
                  'This password reset link is invalid or has expired. Please request a new one.'}
              </p>
              <Button onClick={() => navigate(`/${locale}/forgot-password`)}>
                {t.reset_password?.request_new_link || 'Request New Link'}
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={t.reset_password?.title || 'Reset Password'}
        description={t.reset_password?.description || 'Reset your password'}
        path="/reset-password"
      />
      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              {t.reset_password?.title || 'Reset Password'}
            </h1>

            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6">
                {success ? (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-xl font-semibold">
                      {t.reset_password?.success_title || 'Password Reset Successfully'}
                    </h2>
                    <p className="text-muted-foreground">
                      {t.reset_password?.success_message ||
                        'Your password has been reset successfully. Redirecting to your account...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6 text-center">
                      {t.reset_password?.description ||
                        'Enter your new password below.'}
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
                          <Label htmlFor="password" className="text-muted-foreground">
                            {t.reset_password?.new_password || 'New Password'}
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 bg-white/70"
                              placeholder={t.reset_password?.password_placeholder || 'Enter new password'}
                              required
                              disabled={isLoading}
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword" className="text-muted-foreground">
                            {t.reset_password?.confirm_password || 'Confirm Password'}
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pl-10 pr-10 bg-white/70"
                              placeholder={t.reset_password?.confirm_password_placeholder || 'Confirm new password'}
                              required
                              disabled={isLoading}
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full btn-primary"
                          disabled={isLoading}
                        >
                          {isLoading
                            ? (t.common?.loading || 'Resetting...')
                            : (t.reset_password?.submit_button || 'Reset Password')}
                        </Button>
                      </div>
                    </form>
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

export default ResetPassword;
