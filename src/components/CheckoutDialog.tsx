// components/checkout/CheckoutDialog.tsx
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/App";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { startPayment } from "@/api";
import { PaymentProvider } from "@/types/api";
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
      .get("/api/user/me")
      .then((res) => setFreshUser(res.data.user))
      .catch(() => setFreshUser(user));
  }, [open, user]);

  /* ================= Checkout ================= */

  const handleCheckout = async (provider: PaymentProvider) => {
    // 🔒 HARD LOCK - prevent multiple rapid calls on mobile
    if (isPaying || externalIsPaying) return;
    setIsPaying(true);

    const MIN_CHECKOUT_AMOUNT = 500_000;

    if (!items.length || !totalPrice) {
      setIsPaying(false);
      return;
    }

    if (totalPrice < MIN_CHECKOUT_AMOUNT) {
      setIsPaying(false);
      toast({
        title: t.basket?.error || "Order too small",
        description:
          t.basket?.minimum_amount || "Minimum order amount is 500,000 UZS",
      });
      return;
    }

    const currentUser = freshUser || user;

    if (!currentUser) {
      setIsPaying(false);
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
      setIsPaying(false);
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
      const payload = items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        description: item.product.description,
        quantity: item.quantity,
        price: item.product.price,
      }));

      if (provider === "payme") {
        startPayment({
          items: payload,
          amount: totalPrice,
          provider,
        });

        onOpenChange(false);
        return;
      }

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
          max-w-lg
          h-[90vh]
          sm:h-auto
          sm:max-h-[90vh]
          sm:min-w-[640px]
          sm:rounded-lg
          rounded-none
          px-3
          py-4
          sm:px-6
          sm:py-6
          sm:p-6
          flex
          flex-col
          overflow-hidden
        "
      >
        {/* HEADER */}
        <DialogHeader className="px-0 pt-0 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            {t.basket?.checkout_title || "Confirm Order"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t.basket?.checkout_desc ||
              "Review your order and choose payment method."}
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-0 py-2 sm:py-3 -mx-3 sm:-mx-6 px-3 sm:px-6 min-h-0">
          <div className="mt-2 sm:mt-3 space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between text-xs sm:text-sm gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.product.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.quantity} × {formatCurrency(item.product.price)}
                    </div>
                  </div>
                  <div className="font-semibold whitespace-nowrap flex-shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 sm:pt-3">
              <div className="flex justify-between font-semibold text-sm sm:text-base">
                <span>{t.basket?.total || "Total"}</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-0 pt-2 sm:pt-4 pb-0 flex flex-col gap-2 sm:gap-3">
          <Button
            type="button"
            size="sm"
            className="w-full btn-primary text-xs sm:text-sm h-9 sm:h-10"
            disabled={isPaying || externalIsPaying}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCheckout("payme");
            }}
          >
            {isPaying || externalIsPaying
              ? t.basket?.processing || "Processing..."
              : t.basket?.checkout_payme || "Pay with Payme"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full text-xs sm:text-sm h-9 sm:h-10"
            disabled={isPaying || externalIsPaying}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCheckout("click");
            }}
          >
            {isPaying || externalIsPaying
              ? t.basket?.processing || "Processing..."
              : t.basket?.checkout_click || "Pay with Click"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full text-xs sm:text-sm h-9 sm:h-10"
            disabled={isPaying || externalIsPaying}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCheckout("uzum");
            }}
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
