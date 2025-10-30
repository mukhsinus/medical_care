import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Package, Edit } from 'lucide-react';

// API functions using auth token from Login
const fetchUserProfile = async () => {
  // если есть fallback token — используем Authorization
  const token = localStorage.getItem('authToken');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch('http://localhost:8090/api/me', {
    method: 'GET',
    headers,
    credentials: 'include', // если cookie есть — отправится
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};


const fetchUserOrders = async () => {
  const token = localStorage.getItem('authToken');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch('http://localhost:8090/api/user/orders', {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

const updateUserProfile = async (data: { name: string }) => {
  const token = localStorage.getItem('authToken');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch('http://localhost:8090/api/user/profile', {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};


const logoutUser = async () => {
  // call server logout to clear cookie
  const response = await fetch('http://localhost:8090/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  // also clear fallback token
  localStorage.removeItem('authToken');
  if (!response.ok) throw new Error('Failed to logout');
};


const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

const Account: React.FC = () => {
  const { locale, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Added for query invalidation
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');

  // Fetch user profile
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    retry: 1,
    onError: () => navigate(`/${locale}/login`), // Redirect to login if unauthenticated
  });

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: fetchUserOrders,
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error) => console.error('Profile update failed:', error),
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => navigate(`/${locale}/login`),
    onError: (error) => console.error('Logout failed:', error),
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name });
  };

  if (userLoading) {
    return (
      <Layout>
        <section className="min-h-[calc(100svh-4rem)] py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (userError) {
    return (
      <Layout>
        <section className="min-h-[calc(100svh-4rem)] py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-red-500">Please log in to view your account.</p>
            <Button asChild size="lg" className="btn-primary mt-4 shadow-lg hover:shadow-xl">
              <Link to={`/${locale}/login`}>{t.login?.button || 'Log In'}</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={t.account?.title || 'Your Account'}
        description={t.account?.description || 'Manage your account details and view your orders.'}
        path={location.pathname}
      />
      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold rounded-2xl px-4 py-2 text-center mb-12">
            {t.account?.title || 'Your Account'}
          </h1>
          <div className="max-w-2xl mx-auto grid gap-6">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6">
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-muted-foreground">
                        {t.account?.name || 'Name'}
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/70"
                        placeholder={t.account?.name_placeholder || 'Enter your name'}
                        required
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        size="lg"
                        className="btn-primary flex-1 shadow-lg hover:shadow-xl"
                        disabled={updateProfileMutation.isPending}
                      >
                        {t.account?.save || 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="btn-outline flex-1"
                        onClick={() => setIsEditing(false)}
                      >
                        {t.account?.cancel || 'Cancel'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <User className="h-8 w-8 text-sky-500" />
                      <div>
                        <h2 className="text-xl font-semibold">{user?.name || 'User'}</h2>
                        <p className="text-muted-foreground">{user?.email || 'No email'}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="btn-outline w-full"
                      onClick={() => {
                        setName(user?.name || '');
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                      {t.account?.edit_profile || 'Edit Profile'}
                    </Button>
                    <Button
                      variant="outline"
                      className="btn-outline w-full mt-4"
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      {t.account?.logout || 'Log Out'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {t.account?.orders || 'Recent Orders'}
                </h2>
                {ordersLoading ? (
                  <p className="text-muted-foreground text-center">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-muted-foreground text-center">
                    {t.account?.no_orders || 'No recent orders.'}
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {orders.map((order: { id: string; date: string; total: number; status: string }) => (
                      <li
                        key={order.id}
                        className="flex justify-between items-center border-b border-white/20 pb-4"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-sky-500" />
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.total)}</p>
                          <p className="text-sm text-muted-foreground">{order.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="outline" className="btn-outline w-full mt-6">
                  <Link to={`/${locale}/orders`}>
                    {t.account?.view_all_orders || 'View All Orders'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Account;