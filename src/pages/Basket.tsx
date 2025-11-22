// src/pages/Basket.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Layout } from '@/components/Layout';
import { CheckoutDialog } from '@/components/CheckoutDialog';

const formatCurrency = (n: number) =>
  n.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' });

const Basket: React.FC = () => {
  const { locale, t } = useLanguage();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const location = useLocation();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find(i => i.product.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) removeItem(id);
    else updateQuantity(id, newQty);
  };

  return (
    <Layout>
      <SEO title={t.basket?.title || 'Your Basket'} path={location.pathname} />

      <section className="min-h-[calc(100svh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <header className="flex justify-between items-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold">{t.basket?.title || 'Your Basket'}</h1>
            <div className="text-muted-foreground">
              {items.length} {items.length === 1 ? t.basket?.item : t.basket?.items || 'items'}
            </div>
          </header>

          {items.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-xl text-muted-foreground mb-6">{t.basket?.empty || 'Your basket is empty.'}</p>
              <Button asChild size="lg" className="btn-primary shadow-lg hover:shadow-xl">
                <Link to={`/${locale}/catalog`}>{t.basket?.shop || 'Go to shop'}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_320px] gap-6 lg:gap-7">
              <section>
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.product.id} className="glass-card rounded-2xl p-4 flex gap-4 items-center">
                      <div className="w-20 h-20 bg-[hsl(200_80%_94%)] rounded-lg overflow-hidden">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center h-full">No image</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold text-lg">{item.product.name}</div>
                        <div className="text-muted-foreground">{formatCurrency(item.product.price)}</div>

                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => handleQuantityChange(item.product.id, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-medium">{item.quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => handleQuantityChange(item.product.id, +1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.product.id)} className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="font-semibold text-lg">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={clearCart}>{t.basket?.clear || 'Clear basket'}</Button>
                  <Button asChild variant="outline">
                    <Link to={`/${locale}/catalog`}>{t.basket?.continue || 'Continue shopping'}</Link>
                  </Button>
                </div>
              </section>

              <aside className="glass-card rounded-2xl p-6">
                <div className="text-sm text-muted-foreground">{t.basket?.summary || 'Order summary'}</div>
                <div className="flex justify-between mt-4 text-lg font-bold">
                  <span>{t.basket?.subtotal || 'Subtotal'}</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between mt-2 text-muted-foreground">
                  <span>{t.basket?.shipping || 'Shipping'}</span>
                  <span>{t.basket?.shipping_calc || 'Calculated at checkout'}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full btn-primary shadow-lg hover:shadow-xl mt-6"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  {t.basket?.checkout || 'Proceed to checkout'}
                </Button>
              </aside>
            </div>
          )}

          <CheckoutDialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} />
        </div>
      </section>
    </Layout>
  );
};

export default Basket;