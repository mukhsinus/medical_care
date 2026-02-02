// src/pages/Login.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import api, { setAccessToken, setRefreshToken } from '@/api';
import { Mail, Lock, UserPlus, AlertCircle, User, Phone, Eye, EyeOff } from 'lucide-react';


/* ===================== TYPES ===================== */

type LoginPayload = {
  nameOrEmail: string;
  password: string;
};

type SignupPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

/* ===================== API CALLS ===================== */

// LOGIN
const loginUser = async ({ nameOrEmail, password }: LoginPayload) => {
  const payload = {
    identifier: nameOrEmail,
    password,
  };

  const { data } = await api.post("/api/auth/login", payload);
  return data;
};

// SIGNUP
const signupUser = async ({ name, email, phone, password }: SignupPayload) => {
  const payload = {
    name,
    email,
    phone,
    password,
  };

  const { data } = await api.post("/api/auth/signup", payload);
  return data;
};

/* ===================== COMPONENT ===================== */

const Login: React.FC = () => {
  const { locale, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  /* ===================== MUTATIONS ===================== */

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      // Store tokens for Safari compatibility
      if (data.accessToken) setAccessToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);

      setError(null);
      navigate(`/${locale}/account`);
    },
  });

  const signupMutation = useMutation({
    mutationFn: signupUser,
    onSuccess: async (data) => {
      // Store tokens for Safari compatibility
      if (data.accessToken) setAccessToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);

      setError(null);
      navigate(`/${locale}/account`);
    },
  });

  /* ===================== ERROR HANDLING ===================== */

  React.useEffect(() => {
    if (loginMutation.isError) {
      const error = loginMutation.error as any;
      setError(error?.response?.data?.message || t.login?.error || "Invalid credentials");
    }
  }, [loginMutation.isError, t.login?.error]);

  React.useEffect(() => {
    if (signupMutation.isError) {
      const error = signupMutation.error as any;
      setError(error?.response?.data?.message || t.signup?.error || "Sign-up failed");
    }
  }, [signupMutation.isError, t.signup?.error]);

  /* ===================== SUBMIT ===================== */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      if (!nameOrEmail || !password) {
        setError(t.login?.error || "Please fill in all required fields");
        return;
      }
      loginMutation.mutate({ nameOrEmail, password });
    } else {
      if (!name || !email || !password || !repeatPassword) {
        setError(t.signup?.error || "Please fill in all required fields");
        return;
      }
      if (password !== repeatPassword) {
        setError(t.signup?.password_mismatch || "Passwords do not match");
        return;
      }
      signupMutation.mutate({ name, email, phone, password });
    }
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
          <h1 className="text-3xl md:text-4xl font-bold rounded-2xl px-4 py-2 text-center mb-12">
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
                {error && (
                  <div className="flex items-center gap-2 text-red-500 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {isLogin ? (
                      <>
                        <div>
                          <Label htmlFor="nameOrEmail" className="text-muted-foreground">
                            {t.login?.name_or_email || 'Name or Email'}
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="nameOrEmail"
                              type="text"
                              value={nameOrEmail}
                              onChange={(e) => setNameOrEmail(e.target.value)}
                              className="pl-10 bg-white/70"
                              placeholder={t.login?.name_or_email_placeholder || 'Enter your name or email'}
                              required
                              disabled={loginMutation.isPending || signupMutation.isPending}
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
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 bg-white/70"
                              placeholder={t.login?.password_placeholder || 'Enter your password'}
                              required
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <Link
                            to={`/${locale}/forgot-password`}
                            className="text-sm text-primary hover:underline"
                          >
                            {t.login?.forgot_password || 'Forgot password?'}
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="name" className="text-muted-foreground">
                            {t.signup?.name || 'Name (or Company Name)'}
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="pl-10 bg-white/70"
                              placeholder={t.signup?.name_placeholder || 'Enter your name or company name'}
                              required
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-muted-foreground">
                            {t.signup?.email || 'Email'}
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 bg-white/70"
                              placeholder={t.signup?.email_placeholder || 'Enter your email'}
                              required
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-muted-foreground">
                            {t.signup?.phone || 'Phone (optional)'}
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="pl-10 bg-white/70"
                              placeholder={t.signup?.phone_placeholder || 'Enter your phone number'}
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="password" className="text-muted-foreground">
                            {t.signup?.password || 'Password'}
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 bg-white/70"
                              placeholder={t.signup?.password_placeholder || 'Enter your password'}
                              required
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loginMutation.isPending || signupMutation.isPending}
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
                          <Label htmlFor="repeatPassword" className="text-muted-foreground">
                            {t.signup?.repeat_password || 'Repeat Password'}
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="repeatPassword"
                              type={showRepeatPassword ? 'text' : 'password'}
                              value={repeatPassword}
                              onChange={(e) => setRepeatPassword(e.target.value)}
                              className="pl-10 pr-10 bg-white/70"
                              placeholder={t.signup?.repeat_password_placeholder || 'Repeat your password'}
                              required
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                              disabled={loginMutation.isPending || signupMutation.isPending}
                            >
                              {showRepeatPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    <Button
                      type="submit"
                      size="lg"
                      className="btn-primary w-full shadow-lg hover:shadow-xl"
                      disabled={loginMutation.isPending || signupMutation.isPending}
                    >
                      {loginMutation.isPending || signupMutation.isPending
                        ? t.login?.loading || 'Loading...'
                        : isLogin
                        ? t.login?.submit || 'Log In'
                        : t.signup?.submit || 'Sign Up'}
                      {!isLogin && !loginMutation.isPending && !signupMutation.isPending && (
                        <UserPlus className="ml-2 h-5 w-5" />
                      )}
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