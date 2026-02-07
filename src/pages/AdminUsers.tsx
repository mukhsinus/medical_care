import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { useLanguage } from '../contexts/LanguageContext';
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
import { Badge } from '../components/ui/badge';
import { ChevronLeft, Edit2, Trash2, Shield, User, Users } from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  address?: string;
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const res = await fetch(`/api/admin/users?page=${page}&limit=10`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

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
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          phone: editData.phone,
          role: editData.role,
          address: editData.address,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditData({});
        fetchUsers();
      }
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const deleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeleteUserId(null);
        fetchUsers();
      }
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
    </div>
  );
}
