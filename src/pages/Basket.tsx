import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Layout } from '@/components/Layout';
import { startPayment, PaymentProvider } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

const Basket: React.FC = () => {
  const { locale, t } = useLanguage();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } =
    useCart();
  const location = useLocation();

  const [isPaying, setIsPaying] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleIncrease = (item: {
    product: { id: string; name: string; price: number; image?: string };
    quantity: number;
  }) => {
    updateQuantity(item.product.id, item.quantity + 1);
  };

  const handleDecrease = (item: {
    product: { id: string; name: string; price: number; image?: string };
    quantity: number;
  }) => {
    if (item.quantity <= 1) {
      removeItem(item.product.id);
      return;
    }
    updateQuantity(item.product.id, item.quantity - 1);
  };

  const handleRemove = (id: string) => removeItem(id);
  const handleClear = () => clearCart();

  const handleCheckout = async (provider: PaymentProvider) => {
    try {
      if (!items.length) return;
      setIsPaying(true);

      const payloadItems = items.map((item) => ({
        productId: Number(item.product.id) || 0,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price, // backend expects UZS or whatever you use
      }));

      const result = await startPayment({
        items: payloadItems,
        amount: totalPrice,
        provider,
      });

      // close popup (optional — page will redirect anyway)
      setIsCheckoutOpen(false);

      window.location.href = result.paymentInitData.redirectUrl;
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        t.basket?.payment_error ||
        'Ошибка при создании заказа. Попробуйте ещё раз.';
      alert(msg);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={t.basket?.title || 'Your Basket'}
        description={
          t.basket?.description ||
          'View and manage items in your shopping basket.'
        }
        path={location.pathname}
      />

      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <header className="flex justify-between items-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold rounded-2xl px-4 py-2">
              {t.basket?.title || 'Your Basket'}
            </h1>
            <div className="text-muted-foreground">
              {items.length}{' '}
              {items.length === 1
                ? t.basket?.item
                : t.basket?.items || 'items'}
            </div>
          </header>

          {items.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-xl text-muted-foreground mb-6">
                {t.basket?.empty || 'Your basket is empty.'}
              </p>
              <Button
                asChild
                size="lg"
                className="btn-primary shadow-lg hover:shadow-xl"
              >
                <Link to={`/${locale}/catalog`}>
                  {t.basket?.shop || 'Go to shop'}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-[1fr_320px] gap-6 lg:gap-7">
                <section>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li
                        key={item.product.id}
                        className="glass-card rounded-2xl p-4 flex gap-4 items-center"
                      >
                        <div className="w-20 h-20 bg-[hsl(200_80%_94%)] rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-muted-foreground">
                              No image
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">
                            {item.product.name}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {formatCurrency(item.product.price)}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDecrease(item)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleIncrease(item)}
                              aria-label={`Increase quantity of ${item.product.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(item.product.id)}
                              className="text-red-500 hover:text-red-600"
                              aria-label={`Remove ${item.product.name} from basket`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(item.product.price * item.quantity)}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      className="btn-outline"
                    >
                      {t.basket?.clear || 'Clear basket'}
                    </Button>
                    <Button asChild variant="outline" className="btn-outline">
                      <Link to={`/${locale}/catalog`}>
                        {t.basket?.continue || 'Continue shopping'}
                      </Link>
                    </Button>
                  </div>
                </section>

                <aside className="glass-card rounded-2xl p-6">
                  <div className="text-sm text-muted-foreground">
                    {t.basket?.summary || 'Order summary'}
                  </div>
                  <div className="flex justify-between mt-4">
                    <span>{t.basket?.subtotal || 'Subtotal'}</span>
                    <span className="font-bold">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-muted-foreground">
                    <span>{t.basket?.shipping || 'Shipping'}</span>
                    <span>
                      {t.basket?.shipping_calc || 'Calculated at checkout'}
                    </span>
                  </div>

                  {/* Open checkout dialog */}
                  <Button
                    size="lg"
                    className="btn-primary w-full mt-6 shadow-lg hover:shadow-xl"
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    {t.basket?.checkout || 'Proceed to checkout'}
                  </Button>
                </aside>
              </div>

              {/* Checkout Popup */}
              <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-lg sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>
                      {t.basket?.checkout_title || 'Confirm your order'}
                    </DialogTitle>
                    <DialogDescription>
                      {t.basket?.checkout_desc ||
                        'Please review your order details and choose a payment method.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.product.name}
                            </div>
                            <div className="text-muted-foreground">
                              {item.quantity} ×{' '}
                              {formatCurrency(item.product.price)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatCurrency(
                              item.product.price * item.quantity
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{t.basket?.subtotal || 'Subtotal'}</span>
                        <span className="font-semibold">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t.basket?.shipping || 'Shipping'}</span>
                        <span>
                          {t.basket?.shipping_calc || 'Calculated at checkout'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto btn-primary"
                      disabled={isPaying}
                      onClick={() => handleCheckout('payme')}
                    >
                      {isPaying
                        ? t.basket?.processing || 'Processing...'
                        : t.basket?.checkout_payme || 'Pay with Payme'}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={isPaying}
                      onClick={() => handleCheckout('click')}
                    >
                      {t.basket?.checkout_click || 'Pay with Click'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Basket;
