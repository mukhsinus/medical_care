import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Lock, UserPlus } from 'lucide-react';

const Login: React.FC = () => {
  const { locale, t } = useLanguage();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and sign-up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for auth logic (e.g., API call)
    console.log(isLogin ? 'Login' : 'Sign Up', { email, password });
  };

  return (
    <Layout>
      <SEO
        title={t.login?.title || 'Login / Sign Up'}
        description={t.login?.description || 'Log in or create an account to manage your orders.'}
        path={location.pathname}
      />
      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold  rounded-2xl px-4 py-2 text-center mb-12">
            {isLogin ? t.login?.title || 'Login' : t.signup?.title || 'Sign Up'}
          </h1>
          <div className="max-w-md mx-auto">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6">
                <div className="flex justify-center gap-4 mb-6">
                  <Button
                    variant={isLogin ? 'default' : 'outline'}
                    className={isLogin ? 'btn-primary' : 'btn-outline'}
                    onClick={() => setIsLogin(true)}
                  >
                    {t.login?.button || 'Login'}
                  </Button>
                  <Button
                    variant={isLogin ? 'outline' : 'default'}
                    className={isLogin ? 'btn-outline' : 'btn-primary'}
                    onClick={() => setIsLogin(false)}
                  >
                    {t.signup?.button || 'Sign Up'}
                  </Button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-muted-foreground">
                        {t.login?.email || 'Email'}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-white/70"
                          placeholder={t.login?.email_placeholder || 'Enter your email'}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-muted-foreground">
                        {t.login?.password || 'Password'}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 bg-white/70"
                          placeholder={t.login?.password_placeholder || 'Enter your password'}
                          required
                        />
                      </div>
                    </div>
                    {isLogin && (
                      <div className="text-right">
                        <Link
                          to={`/${locale}/forgot-password`}
                          className="text-sm text-sky-500 hover:text-sky-600"
                        >
                          {t.login?.forgot_password || 'Forgot Password?'}
                        </Link>
                      </div>
                    )}
                    <Button
                      type="submit"
                      size="lg"
                      className="btn-primary w-full shadow-lg hover:shadow-xl"
                    >
                      {isLogin ? t.login?.submit || 'Log In' : t.signup?.submit || 'Sign Up'}
                      {!isLogin && <UserPlus className="ml-2 h-5 w-5" />}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <p className="text-center text-muted-foreground mt-4">
              {isLogin
                ? t.login?.no_account || 'Don’t have an account?'
                : t.signup?.have_account || 'Already have an account?'}{' '}
              <Button
                variant="link"
                className="text-sky-500 hover:text-sky-600 p-0"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? t.signup?.button || 'Sign Up' : t.login?.button || 'Log In'}
              </Button>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;