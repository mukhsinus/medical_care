import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { useLanguage } from '../contexts/LanguageContext';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Package, LogOut, ChevronRight } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalProducts: number;
  lowStockItems: number;
  loading: boolean;
  error: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, authLoaded } = useAuth();
  const { locale } = useLanguage();
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!authLoaded) return;

    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchStats();
  }, [authLoaded, user, navigate]);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch users count
      const usersData = await api.get('/api/admin/users?page=1&limit=1');
      const totalUsers = usersData.data?.pagination?.total || 0;

      // Fetch stock
      const stockData = await api.get('/api/admin/stock?page=1&limit=1000');
      const totalProducts = stockData.data?.pagination?.total || 0;
      const lowStockItems = (stockData.data?.stock || []).filter(
        (s: { quantity: number; minStockLevel: number }) => s.quantity < s.minStockLevel
      ).length;

      setStats({
        totalUsers,
        totalProducts,
        lowStockItems,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Silently fail - don't display error to user
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: null 
      }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(`/${locale}/login`);
  };

  if (!authLoaded) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const t: Record<string, Record<string, string>> = {
    en: {
      admin_panel: 'Admin Panel',
      welcome: 'Welcome, Admin',
      dashboard: 'Dashboard',
      total_users: 'Total Users',
      total_products: 'Total Products',
      low_stock: 'Low Stock Items',
      manage_users: 'Manage Users',
      manage_stock: 'Manage Stock',
      logout: 'Logout',
      quick_stats: 'Quick Stats',
      error_fetching: 'Error fetching stats',
      view_users: 'View and manage user accounts and their roles',
      view_stock: 'Manage inventory and stock levels',
    },
    ru: {
      admin_panel: 'Панель администратора',
      welcome: 'Добро пожаловать, администратор',
      dashboard: 'Панель',
      total_users: 'Всего пользователей',
      total_products: 'Всего продуктов',
      low_stock: 'Товары заканчиваются',
      manage_users: 'Управление пользователями',
      manage_stock: 'Управление запасами',
      logout: 'Выход',
      quick_stats: 'Статистика',
      error_fetching: 'Ошибка при загрузке статистики',
      view_users: 'Просмотр и управление учетными записями пользователей и ролями',
      view_stock: 'Управление инвентарем и уровнями запасов',
    },
    uz: {
      admin_panel: 'Administrator paneli',
      welcome: 'Xush kelibsiz, Administrator',
      dashboard: 'Dashboard',
      total_users: 'Jami foydalanuvchilar',
      total_products: 'Jami mahsulotlar',
      low_stock: 'Kam qolgan tovarlar',
      manage_users: 'Foydalanuvchilarni boshqarish',
      manage_stock: 'Ehtiyotlarni boshqarish',
      logout: 'Chiqish',
      quick_stats: 'Statistika',
      error_fetching: 'Statistikani yuklash xatosi',
      view_users: 'Foydalanuvchi hisoblarini va rollarini ko\'rish va boshqarish',
      view_stock: 'Inventarni va zaxira darajalarini boshqarish',
    },
  };

  const trans = t[locale] || t.en;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{trans.admin_panel}</h1>
          <p className="text-slate-600 mt-1">
            {trans.welcome}: {user.name}
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          {trans.logout}
        </Button>
      </div>

      {/* Loading State */}
      {stats.loading ? (
        <div className="text-center py-12">Loading statistics...</div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {trans.total_users}
                </CardTitle>
                <Users className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {trans.total_products}
                </CardTitle>
                <Package className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {trans.low_stock}
                </CardTitle>
                <Package className="w-5 h-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.lowStockItems}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {trans.manage_users}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">{trans.view_users}</p>
                <Button 
                  className="w-full gap-2"
                  onClick={() => navigate('/admin/users')}
                >
                  {trans.manage_users}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {trans.manage_stock}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">{trans.view_stock}</p>
                <Button 
                  className="w-full gap-2"
                  onClick={() => navigate('/admin/stock')}
                >
                  {trans.manage_stock}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
