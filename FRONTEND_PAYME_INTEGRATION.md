# Frontend интеграция Payme

## Где вызывать Payme в вашем коде?

Обычно в компоненте для оплаты, например `CheckoutDialog.tsx` или `PaymentForm.tsx`.

## Пример интеграции в компонент

```typescript
// components/CheckoutDialog.tsx

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
}

export function CheckoutDialog({ isOpen, onClose, items, totalAmount }: CheckoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  const handlePayment = async (provider: 'payme' | 'click' | 'uzum') => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Отправляем заказ на backend
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          amount: totalAmount,
          provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();

      // 2. Перенаправляем на платежный шлюз
      window.location.href = data.paymentInitData.redirectUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Выберите способ оплаты</DialogTitle>
        </DialogHeader>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="space-y-2">
          <Button
            onClick={() => handlePayment('payme')}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? 'Загрузка...' : '💳 Payme (Узбекистан)'}
          </Button>

          <Button
            onClick={() => handlePayment('click')}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            💳 Click
          </Button>

          <Button
            onClick={() => handlePayment('uzum')}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            💳 Uzum Bank
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          Сумма к оплате: <strong>{totalAmount.toLocaleString('uz-UZ')} UZS</strong>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Как использовать компонент

```typescript
import { useState } from 'react';
import { CheckoutDialog } from '@/components/CheckoutDialog';

function ShoppingCart() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const cartItems = [...]; // ваши товары
  const totalAmount = 50000; // УЗС

  return (
    <>
      <button onClick={() => setIsCheckoutOpen(true)}>
        Оформить заказ
      </button>

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        totalAmount={totalAmount}
      />
    </>
  );
}
```

## API Request/Response

### Request (Frontend → Backend)

```bash
POST /api/payments/create
Headers:
  Content-Type: application/json
  Authorization: Bearer {JWT_TOKEN}

Body:
{
  "items": [
    { "id": 1, "name": "Лекарство", "price": 50000, "quantity": 1 }
  ],
  "amount": 50000,
  "provider": "payme"
}
```

### Response (Backend → Frontend)

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "provider": "payme",
  "paymentInitData": {
    "redirectUrl": "https://checkout.paycom.uz/507144111111111?orderId=507f1f77bcf86cd799439011&amount=5000000"
  }
}
```

## Поток платежа на Frontend

```
1. Пользователь нажимает кнопку "Паyme"
        ↓
2. Frontend отправляет POST /api/payments/create
        ↓
3. Backend создает заказ и возвращает redirectUrl
        ↓
4. Frontend: window.location.href = redirectUrl
        ↓
5. Пользователь видит форму Payme
        ↓
6. Пользователь вводит данные карты
        ↓
7. Payme отправляет callback на backend (НЕ на frontend!)
        ↓
8. Backend обновляет заказ
        ↓
9. (Опционально) Пользователь возвращается на ваш сайт
        ↓
10. Вы проверяете статус заказа и показываете результат
```

## Проверка статуса после платежа

После возврата с Payme (или через какое-то время) проверьте статус:

```typescript
// pages/OrderConfirmation.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function OrderConfirmation() {
  const { orderId } = useParams();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!orderId) return;

    // Проверяем статус заказа
    fetch(`/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setOrderStatus(data.paymentStatus); // paid, pending, failed, cancelled
      });
  }, [orderId, token]);

  return (
    <div>
      {orderStatus === 'paid' && (
        <div className="success">
          ✅ Платеж успешен! Заказ принят.
        </div>
      )}

      {orderStatus === 'pending' && (
        <div className="loading">
          ⏳ Платеж обрабатывается...
        </div>
      )}

      {orderStatus === 'failed' && (
        <div className="error">
          ❌ Платеж не удался. Попробуйте еще раз.
        </div>
      )}
    </div>
  );
}
```

## Типы для TypeScript

```typescript
interface PaymentProvider {
  id: 'payme' | 'click' | 'uzum';
  name: string;
  logo: string;
  description: string;
}

interface CartItem {
  id: number;
  name: string;
  nameKey: string;
  price: number;
  quantity: number;
  description?: string;
  image?: string;
}

interface CreatePaymentRequest {
  items: CartItem[];
  amount: number;
  provider: PaymentProvider['id'];
}

interface CreatePaymentResponse {
  orderId: string;
  provider: PaymentProvider['id'];
  paymentInitData: {
    redirectUrl: string;
  };
}

interface Order {
  _id: string;
  userId: string;
  items: CartItem[];
  amount: number;
  paymentProvider: PaymentProvider['id'];
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  createdAt: string;
}
```

## Ошибки и обработка

```typescript
const handlePaymentError = async (error: Error) => {
  if (error.message.includes('401')) {
    // Пользователь не авторизован
    redirectToLogin();
  } else if (error.message.includes('400')) {
    // Неверные данные
    showError('Please check your cart items');
  } else if (error.message.includes('500')) {
    // Ошибка сервера
    showError('Server error. Please contact support.');
  } else {
    // Неизвестная ошибка
    showError('Payment failed. Please try again.');
  }
};
```

## Environment переменные (Frontend)

Обычно не нужны (backend ручеет ИКПУ), но для отладки:

```env
VITE_API_URL=http://localhost:8090/api
VITE_PAYME_TEST_MODE=true
```

## Готово!

Ваш Frontend полностью интегрирован с Payme. 

**Нужна помощь?** Смотрите примеры в [PaymentIntegrationExample.tsx](./PaymentIntegrationExample.tsx)
