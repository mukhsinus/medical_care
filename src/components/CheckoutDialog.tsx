// components/checkout/CheckoutDialog.tsx
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { startPayment, PaymentProvider } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const formatCurrency = (n: number) =>
  n.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }); // or make dynamic

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({ open, onOpenChange }) => {
  const { items, totalPrice } = useCart();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isPaying, setIsPaying] = React.useState(false);

  const handleCheckout = async (provider: PaymentProvider) => {
    if (!items.length || !totalPrice) return;

    try {
      setIsPaying(true);

      const payload = items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const result = await startPayment({
        items: payload,
        amount: totalPrice,
        provider,
      });

      onOpenChange(false);
      window.location.href = result.paymentInitData.redirectUrl;
    } catch (err: any) {
      console.error(err);
      toast({
        title: t.basket?.payment_error_title || 'Payment Failed',
        description:
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          t.basket?.payment_error ||
          'Ошибка при создании заказа.',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.basket?.checkout_title || 'Confirm Order'}</DialogTitle>
          <DialogDescription>
            {t.basket?.checkout_desc || 'Review your order and choose payment method.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.product.price)}
                  </div>
                </div>
                <div className="font-semibold">
                  {formatCurrency(item.product.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>{t.basket?.total || 'Total'}</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto btn-primary"
            disabled={isPaying}
            onClick={() => handleCheckout('payme')}
          >
            {isPaying ? 'Processing...' : 'Pay with Payme'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isPaying}
            onClick={() => handleCheckout('click')}
          >
            {isPaying ? 'Processing...' : 'Pay with Click'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};