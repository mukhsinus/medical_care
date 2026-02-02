// components/checkout/CheckoutDialog.tsx
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/App";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { startPayment, PaymentProvider } from "@/api";
import api from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const formatCurrency = (n: number) =>
  n.toLocaleString("uz-UZ", { style: "currency", currency: "UZS" });

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPay?: (provider: PaymentProvider) => Promise<void>;
  isPaying?: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  open,
  onOpenChange,
  onPay,
  isPaying: externalIsPaying = false,
}) => {
  const { items, totalPrice } = useCart();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isPaying, setIsPaying] = React.useState(false);
  const [freshUser, setFreshUser] = React.useState<any>(null);

  /* ================= Refetch user on open ================= */

  React.useEffect(() => {
    if (!open || !user) {
      setFreshUser(null);
      return;
    }

    api
      .get("/api/me")
      .then((res) => setFreshUser(res.data.user))
      .catch(() => setFreshUser(user));
  }, [open, user]);

  /* ================= Checkout ================= */

  const handleCheckout = async (provider: PaymentProvider) => {
    const MIN_CHECKOUT_AMOUNT = 500_000;

    if (!items.length || !totalPrice) return;

    if (totalPrice < MIN_CHECKOUT_AMOUNT) {
      toast({
        title: t.basket?.error || "Order too small",
        description:
          t.basket?.minimum_amount || "Minimum order amount is 500,000 UZS",
      });
      return;
    }

    const currentUser = freshUser || user;

    if (!currentUser) {
      toast({
        title: t.basket?.error || "Authentication required",
        description:
          t.basket?.login_required ||
          "You must be logged in to complete the order.",
      });

      onOpenChange(false);
      navigate(`/${locale}/login`, {
        state: { from: location.pathname },
      });
      return;
    }

    const address = currentUser.address;
    const hasAddress =
      address &&
      Object.values(address).some(
        (v: any) => typeof v === "string" && v.trim(),
      );

    if (!hasAddress) {
      toast({
        title: t.basket?.error || "Address required",
        description:
          t.basket?.address ||
          "Please add your shipping address in your account.",
      });
      onOpenChange(false);
      navigate(`/${locale}/account`);
      return;
    }

    try {
      setIsPaying(true);

      const payload = items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        description: item.product.description,
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
      toast({
        title: t.basket?.payment_error_title || "Payment failed",
        description:
          err?.response?.data?.message ||
          t.basket?.payment_error ||
          "Error while creating payment.",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-full
          min-w-[720px]
          max-w-lg
          max-h-[90vh]
          sm:rounded-lg
          rounded-none
          p-0
          flex
          flex-col
        "
      >
        {/* HEADER */}
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>
            {t.basket?.checkout_title || "Confirm Order"}
          </DialogTitle>
          <DialogDescription>
            {t.basket?.checkout_desc ||
              "Review your order and choose payment method."}
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between text-sm"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.product.price)}
                    </div>
                  </div>
                  <div className="font-semibold whitespace-nowrap">
                    {formatCurrency(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>{t.basket?.total || "Total"}</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-4 pb-4 sm:px-6 sm:pb-6 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full btn-primary"
            disabled={isPaying || externalIsPaying}
            onClick={() => handleCheckout("payme")}
          >
            {isPaying || externalIsPaying
              ? t.basket?.processing || "Processing..."
              : t.basket?.checkout_payme || "Pay with Payme"}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={isPaying || externalIsPaying}
            onClick={() => handleCheckout("click")}
          >
            {isPaying || externalIsPaying
              ? t.basket?.processing || "Processing..."
              : t.basket?.checkout_click || "Pay with Click"}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={isPaying || externalIsPaying}
            onClick={() => handleCheckout("uzum")}
          >
            {isPaying || externalIsPaying
              ? t.basket?.processing || "Processing..."
              : t.basket?.checkout_uzum || "Pay with Uzum"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
