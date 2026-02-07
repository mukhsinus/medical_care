import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { useLanguage } from '../contexts/LanguageContext';
import { allItems, type CatalogItem } from '../data/CatalogData';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, Edit2, AlertTriangle, Package, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

interface StockItem {
  _id?: string;
  productId: number;
  productName: string;
  quantity: number;
  minStockLevel: number;
  isAvailable: boolean;
  color?: string | null;
  size?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StockFormData {
  productId: number;
  productName: string;
  color: string | null;
  size: string | null;
  quantity: number;
  minStockLevel: number;
}

export default function AdminStock() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { locale, t } = useLanguage();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<CatalogItem | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StockFormData>({
    productId: 0,
    productName: '',
    color: null,
    size: null,
    quantity: 0,
    minStockLevel: 10,
  });

  // Build catalog items from allItems
  const catalogMap: Record<number, CatalogItem> = {};
  const categories = new Set<string>();
  
  allItems.forEach((item: CatalogItem) => {
    catalogMap[item.id] = item;
    categories.add(item.category);
  });

  const categoryList = ['all', ...Array.from(categories).sort()];

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

    fetchStock();
  }, [authUser, navigate]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await api.get('/api/admin/stock?limit=1000');
      const data = res.data;
      setStockItems(data.stock || []);
    } catch (err) {
      console.error('Error fetching stock:', err);
      // Silently fail on fetch errors
    } finally {
      setLoading(false);
    }
  };

  const getTranslatedField = (key: string): string => {
    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
      if (!value) {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };

  const getItemName = (item: CatalogItem) => {
    return getTranslatedField(item.nameKey) || `Item ${item.id}`;
  };

  const getVariantKey = (item: StockItem): string => {
    return `${item.productId}_${item.color || 'none'}_${item.size || 'none'}`;
  };

  const getProductVariants = (productId: number): StockItem[] => {
    return stockItems.filter(item => item.productId === productId);
  };

  const openCreateDialog = (product: CatalogItem) => {
    setSelectedProductForStock(product);
    setFormData({
      productId: product.id,
      productName: getItemName(product),
      color: null,
      size: null,
      quantity: 0,
      minStockLevel: 0, // Default value, not shown to user
    });
    setShowCreateDialog(true);
  };

  const handleCreateStock = async () => {
    try {
      const res = await api.post('/api/admin/stock', formData);
      const data = res.data;

      setShowCreateDialog(false);
      setSelectedProductForStock(null);
      await fetchStock();
    } catch (err) {
      console.error('Error creating stock:', err);
      // Silently fail - user will see dialog close on success
    }
  };

  const handleDeleteStock = async (stockId: string | undefined, productId: number, color: string | null, size: string | null) => {
    if (!stockId) return;
    
    if (!confirm(locale === 'ru' ? 'Вы уверены?' : locale === 'uz' ? 'AniqMi?' : 'Are you sure?')) {
      return;
    }

    try {
      const color_param = color ? `color=${encodeURIComponent(color)}` : '';
      const size_param = size ? `size=${encodeURIComponent(size)}` : '';
      const params = [color_param, size_param].filter(Boolean).join('&');
      const url = `/api/admin/stock/${productId}${params ? '?' + params : ''}`;
      
      await api.delete(url);
      await fetchStock();
    } catch (err) {
      console.error('Error deleting stock:', err);
      // Silently fail
    }
  };

  // Filter catalog items
  let filteredItems = allItems;
  if (selectedCategory !== 'all') {
    filteredItems = filteredItems.filter((item: CatalogItem) => item.category === selectedCategory);
  }
  if (searchTerm) {
    filteredItems = filteredItems.filter((item: CatalogItem) =>
      getItemName(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const getLowStockVariants = (): StockItem[] => {
    return stockItems.filter(item => item.quantity < item.minStockLevel);
  };

  if (loading && stockItems.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        {locale === 'ru' ? 'Загрузка...' : locale === 'uz' ? 'Yuklanmoqda...' : 'Loading...'}
      </div>
    );
  }

  const lowStockItems = getLowStockVariants();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/admin')} size="sm">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          {locale === 'ru' ? 'Управление склад' : locale === 'uz' ? 'Ombor boshqarish' : 'Stock Management'}
        </h1>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="w-5 h-5" />
              {locale === 'ru' ? 'Низкий уровень запасов' : locale === 'uz' ? 'Kam zaxira' : 'Low Stock Alert'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: StockItem) => (
                <div key={getVariantKey(item)} className="text-sm text-orange-800">
                  <strong>{item.productName}</strong>
                  {item.color && <span> • {item.color}</span>}
                  {item.size && <span> • {item.size}</span>}
                  : {item.quantity}
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <div className="text-sm text-orange-800 italic">
                  +{lowStockItems.length - 5} {locale === 'ru' ? 'еще' : locale === 'uz' ? 'boshqa' : 'more'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {locale === 'ru' ? 'Фильтры' : locale === 'uz' ? 'Filtrlar' : 'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {locale === 'ru' ? 'Поиск' : locale === 'uz' ? 'Qidirish' : 'Search'}
            </label>
            <Input
              placeholder={locale === 'ru' ? 'По названию...' : locale === 'uz' ? 'Nomi bo\'yicha...' : 'By name...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              {locale === 'ru' ? 'Категория' : locale === 'uz' ? 'Kategoriya' : 'Category'}
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              {categoryList.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all'
                    ? locale === 'ru' ? 'Все' : locale === 'uz' ? 'Barchasi' : 'All'
                    : cat}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'ru' ? 'Предметы' : locale === 'uz' ? 'Mahsulotlar' : 'Items'}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredItems.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === 'ru' ? 'Название' : locale === 'uz' ? 'Nomi' : 'Name'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Категория' : locale === 'uz' ? 'Kategoriya' : 'Category'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Вариант' : locale === 'uz' ? 'Variant' : 'Variant'}</TableHead>
                  <TableHead className="text-right">
                    {locale === 'ru' ? 'Количество' : locale === 'uz' ? 'Miqdori' : 'Qty'}
                  </TableHead>
                  <TableHead>{locale === 'ru' ? 'Статус' : locale === 'uz' ? 'Status' : 'Status'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Действия' : locale === 'uz' ? 'Amallar' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      {locale === 'ru' ? 'Предметы не найдены' : locale === 'uz' ? 'Mahsulotlar topilmadi' : 'No items found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: CatalogItem) => {
                    const variants = getProductVariants(item.id);
                    const hasStock = variants.length > 0;

                    if (!hasStock) {
                      // Show product row with "Add Stock" button
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{getItemName(item)}</TableCell>
                          <TableCell className="text-sm">{item.category}</TableCell>
                          <TableCell colSpan={4}></TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => openCreateDialog(item)}
                              className="gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              {locale === 'ru' ? 'Добавить' : locale === 'uz' ? 'Qo\'shish' : 'Add'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Show product + all variants
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getItemName(item)}</TableCell>
                        <TableCell className="text-sm">{item.category}</TableCell>
                        <TableCell colSpan={3}>
                          <div className="space-y-2">
                            {variants.map((variant, idx) => {
                              const isLowStock = variant.quantity < variant.minStockLevel;
                              return (
                                <div key={getVariantKey(variant)} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                  <span>
                                    {variant.color && <span>{variant.color}</span>}
                                    {variant.color && variant.size && <span> • </span>}
                                    {variant.size && <span>{variant.size}</span>}
                                    {!variant.color && !variant.size && <span>Base</span>}
                                  </span>
                                  <div className="flex gap-4 items-center">
                                    <span className={isLowStock ? 'text-orange-600 font-semibold' : ''}>
                                      {variant.quantity}
                                    </span>
                                    <Badge variant={isLowStock ? 'destructive' : 'outline'} className="w-12 text-center">
                                      {isLowStock ? (locale === 'ru' ? 'Низко' : locale === 'uz' ? 'Kam' : 'Low') : 'OK'}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openCreateDialog(item)}
                              className="gap-1"
                              variant="outline"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            {variants.map(variant => (
                              <Button
                                key={getVariantKey(variant)}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteStock(variant._id, variant.productId, variant.color || null, variant.size || null)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Stock Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'ru' ? 'Добавить запас' : locale === 'uz' ? 'Zaxira qo\'shish' : 'Add Stock'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProductForStock && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {locale === 'ru' ? 'Продукт' : locale === 'uz' ? 'Mahsulot' : 'Product'}
                </label>
                <Input value={formData.productName} disabled className="mt-1" />
              </div>

              {selectedProductForStock.colors && selectedProductForStock.colors.length > 0 && (
                <div>
                  <label className="text-sm font-medium">
                    {locale === 'ru' ? 'Цвет' : locale === 'uz' ? 'Rang' : 'Color'}
                  </label>
                  <select
                    value={formData.color || ''}
                    onChange={e => setFormData({ ...formData, color: e.target.value || null })}
                    className="mt-1 w-full border rounded px-3 py-2"
                  >
                    <option value="">
                      {locale === 'ru' ? 'Выберите цвет...' : locale === 'uz' ? 'Rang tanlang...' : 'Select color...'}
                    </option>
                    {selectedProductForStock.colors.map(color => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProductForStock.sizes && selectedProductForStock.sizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium">
                    {locale === 'ru' ? 'Размер' : locale === 'uz' ? 'O\'lchami' : 'Size'}
                  </label>
                  <select
                    value={formData.size || ''}
                    onChange={e => setFormData({ ...formData, size: e.target.value || null })}
                    className="mt-1 w-full border rounded px-3 py-2"
                  >
                    <option value="">
                      {locale === 'ru' ? 'Выберите размер...' : locale === 'uz' ? 'O\'lchamni tanlang...' : 'Select size...'}
                    </option>
                    {selectedProductForStock.sizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">
                  {locale === 'ru' ? 'Количество' : locale === 'uz' ? 'Miqdori' : 'Quantity'}
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder={locale === 'ru' ? 'Введите количество' : locale === 'uz' ? 'Miqdorni kiriting' : 'Enter quantity'}
                  value={formData.quantity || ''}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {locale === 'ru' ? 'Отмена' : locale === 'uz' ? 'Bekor qilish' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateStock}>
              {locale === 'ru' ? 'Добавить' : locale === 'uz' ? 'Qo\'shish' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
