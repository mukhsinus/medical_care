import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { useLanguage } from '../contexts/LanguageContext';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, Edit2, Trash2, Shield, User, Users, Eye } from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  address?: string;
  createdAt?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

interface OrderData {
  _id: string;
  date: string;
  amount: number;
  paymentStatus: string;
  paymentProvider: string;
  items: OrderItem[];
  customer?: {
    fullName: string;
    phone: string;
    address: string;
  };
}

interface UserDetailsData {
  user: UserData;
  orders: OrderData[];
  summary: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
    completedOrders: number;
    pendingOrders: number;
  };
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { locale } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetailsData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log(`📡 Fetching users: /api/admin/users?page=${page}&limit=10`);
      const res = await api.get(`/api/admin/users?page=${page}&limit=10`);

      console.log('✅ Users fetched:', res.data);
      setUsers(res.data.users || []);
      if (!res.data.users || res.data.users.length === 0) {
        console.log('⚠️  No users returned from API');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/api/admin/users/${userId}`);
      setSelectedUserDetails(res.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (!authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [page, authUser, navigate, fetchUsers]);

  const startEdit = (user: UserData) => {
    setEditingId(user._id);
    setEditData(user);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      await api.put(`/api/admin/users/${editingId}`, {
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        role: editData.role,
        address: editData.address,
      });
      setEditingId(null);
      setEditData({});
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const deleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await api.delete(`/api/admin/users/${deleteUserId}`);
      setDeleteUserId(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const t = {
    en: {
      manage_users: 'Manage Users',
      back: 'Back to Dashboard',
      users: 'Users',
      email: 'Email',
      phone: 'Phone',
      name: 'Name',
      role: 'Role',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm_delete: 'Confirm Delete',
      delete_warning:
        'Are you sure you want to delete this user? This action cannot be undone.',
      loading: 'Loading...',
      created_at: 'Created',
    },
    ru: {
      manage_users: 'Управление пользователями',
      back: 'Вернуться на панель',
      users: 'Пользователи',
      email: 'Email',
      phone: 'Телефон',
      name: 'Имя',
      role: 'Роль',
      actions: 'Действия',
      edit: 'Редактировать',
      delete: 'Удалить',
      save: 'Сохранить',
      cancel: 'Отмена',
      confirm_delete: 'Подтверждение удаления',
      delete_warning:
        'Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.',
      loading: 'Загрузка...',
      created_at: 'Создано',
    },
    uz: {
      manage_users: 'Foydalanuvchilarni boshqarish',
      back: 'Dashboard ga qaytish',
      users: 'Foydalanuvchilar',
      email: 'Email',
      phone: 'Telefon',
      name: 'Ism',
      role: 'Rol',
      actions: 'Amallar',
      edit: 'Tahrirlash',
      delete: "O'chirish",
      save: 'Saqlash',
      cancel: 'Bekor qilish',
      confirm_delete: "O'chirishni tasdiqlash",
      delete_warning:
        'Siz bu foydalanuvchini o\'chirishni xohlaysizmi? Bu harakatni ortga qaytarib bo\'lmaydi.',
      loading: 'Yuklanmoqda...',
      created_at: 'Yaratilgan',
    },
  };

  const trans = t[locale] || t.en;

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {trans.loading}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/admin')}
          variant="outline"
          className="mb-6 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {trans.back}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {trans.manage_users}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Error Message Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <p className="font-medium">Error loading users:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {trans.loading}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {locale === 'ru' ? 'Пользователей не найдено' : locale === 'uz' ? 'Foydalanuvchilar topilmadi' : 'No users found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{trans.name}</TableHead>
                    <TableHead>{trans.email}</TableHead>
                    <TableHead>{trans.phone}</TableHead>
                    <TableHead>{trans.role}</TableHead>
                    <TableHead>{trans.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        {editingId === user._id ? (
                          <Input
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="h-8"
                          />
                        ) : (
                          user.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === user._id ? (
                          <Input
                            value={editData.email}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                email: e.target.value,
                              })
                            }
                            className="h-8"
                          />
                        ) : (
                          user.email
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === user._id ? (
                          <Input
                            value={editData.phone}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                phone: e.target.value,
                              })
                            }
                            className="h-8"
                          />
                        ) : (
                          user.phone
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === user._id ? (
                          <select
                            value={editData.role}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                role: e.target.value as 'user' | 'admin',
                              })
                            }
                            className="h-8 px-2 rounded border"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <Badge
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {user.role === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {user.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {editingId === user._id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              variant="default"
                            >
                              {trans.save}
                            </Button>
                            <Button
                              size="sm"
                              onClick={cancelEdit}
                              variant="outline"
                            >
                              {trans.cancel}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => fetchUserDetails(user._id)}
                              variant="outline"
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              {locale === 'ru' ? 'Подробно' : locale === 'uz' ? 'Batafsil' : 'Details'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => startEdit(user)}
                              variant="outline"
                              className="gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                              {trans.edit}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setDeleteUserId(user._id)}
                              variant="destructive"
                              className="gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              {trans.delete}
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{trans.confirm_delete}</AlertDialogTitle>
          <AlertDialogDescription>{trans.delete_warning}</AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>{trans.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive hover:bg-destructive/90">
              {trans.delete}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUserDetails} onOpenChange={(open) => !open && setSelectedUserDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {locale === 'ru' ? 'Подробная информация пользователя' : locale === 'uz' ? 'Foydalanuvchi haqida batafsil' : 'User Details'}
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="text-center py-8">
              {locale === 'ru' ? 'Загрузка...' : locale === 'uz' ? 'Yuklanmoqda...' : 'Loading...'}
            </div>
          ) : selectedUserDetails ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-lg">
                  {locale === 'ru' ? 'Информация о пользователе' : locale === 'uz' ? 'Foydalanuvchi ma\'lumoti' : 'User Information'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Имя' : locale === 'uz' ? 'Ism' : 'Name'}
                    </p>
                    <p className="font-medium">{selectedUserDetails.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Email' : locale === 'uz' ? 'Email' : 'Email'}
                    </p>
                    <p className="font-medium">{selectedUserDetails.user.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Телефон' : locale === 'uz' ? 'Telefon' : 'Phone'}
                    </p>
                    <p className="font-medium">{selectedUserDetails.user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Роль' : locale === 'uz' ? 'Rol' : 'Role'}
                    </p>
                    <Badge variant={selectedUserDetails.user.role === 'admin' ? 'default' : 'secondary'}>
                      {selectedUserDetails.user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">
                  {locale === 'ru' ? 'Статистика заказов' : locale === 'uz' ? 'Buyurtmalar statistikasi' : 'Orders Summary'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Всего заказов' : locale === 'uz' ? 'Jami buyurtmalar' : 'Total Orders'}
                    </p>
                    <p className="text-2xl font-bold">{selectedUserDetails.summary.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Завершено' : locale === 'uz' ? 'Tugatildi' : 'Completed'}
                    </p>
                    <p className="text-2xl font-bold text-green-600">{selectedUserDetails.summary.completedOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'В ожидании' : locale === 'uz' ? 'Kutilmoqda' : 'Pending'}
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">{selectedUserDetails.summary.pendingOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'ru' ? 'Потрачено' : locale === 'uz' ? 'Sarflangan' : 'Total Spent'}
                    </p>
                    <p className="text-2xl font-bold">{(selectedUserDetails.summary.totalSpent / 1000).toFixed(0)}K UZS</p>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {locale === 'ru' ? 'Заказы' : locale === 'uz' ? 'Buyurtmalar' : 'Orders'} ({selectedUserDetails.orders.length})
                </h3>
                {selectedUserDetails.orders.length === 0 ? (
                  <p className="text-gray-500 py-4">
                    {locale === 'ru' ? 'Нет заказов' : locale === 'uz' ? 'Buyurtmalar yo\'q' : 'No orders'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedUserDetails.orders.map((order) => (
                      <Card key={order._id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                {locale === 'ru' ? 'Заказ ID' : locale === 'uz' ? 'Buyurtma ID' : 'Order ID'}
                              </p>
                              <p className="font-mono text-sm">{order._id.slice(-8)}</p>
                            </div>
                            <Badge
                              variant={
                                order.paymentStatus === 'completed'
                                  ? 'default'
                                  : order.paymentStatus === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {order.paymentStatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-gray-600">
                                {locale === 'ru' ? 'Дата' : locale === 'uz' ? 'Sana' : 'Date'}
                              </p>
                              <p className="font-medium">
                                {new Date(order.date).toLocaleDateString(
                                  locale === 'ru' ? 'ru-RU' : locale === 'uz' ? 'uz-UZ' : 'en-US'
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                {locale === 'ru' ? 'Сумма' : locale === 'uz' ? 'Summa' : 'Amount'}
                              </p>
                              <p className="font-medium">{(order.amount / 1000).toFixed(0)}K UZS</p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                {locale === 'ru' ? 'Поставщик' : locale === 'uz' ? 'Provajder' : 'Provider'}
                              </p>
                              <p className="font-medium uppercase">{order.paymentProvider}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <p className="text-sm font-medium mb-2">
                              {locale === 'ru' ? 'Товары' : locale === 'uz' ? 'Mahsulotlar' : 'Items'} ({order.items.length})
                            </p>
                            <div className="space-y-1 text-sm">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-gray-700">
                                  <span>{item.name} {item.size ? `(${item.size})` : ''} x{item.quantity}</span>
                                  <span>{(item.price / 1000).toFixed(0)}K UZS</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
