// components/checkout/CheckoutDialog.tsx
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/App";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { startPayment, PaymentProvider } from "@/api";
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
  n.toLocaleString("uz-UZ", { style: "currency", currency: "UZS" }); // or make dynamic

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPay?: (provider: PaymentProvider) => Promise<void>; // optional callback
  isPaying?: boolean; // optional prop
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

  // Refetch user data when dialog opens to get latest address
  React.useEffect(() => {
    if (open && user) {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      fetch("http://localhost:8090/api/me", {
        method: "GET",
        headers,
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch user");
        })
        .then((data) => {
          console.log("[CheckoutDialog] Refetched user data:", data.user);
          setFreshUser(data.user);
        })
        .catch((err) => {
          console.error("[CheckoutDialog] Error refetching user:", err);
          setFreshUser(user);
        });
    } else {
      setFreshUser(null);
    }
  }, [open, user]);

  const handleCheckout = async (provider: PaymentProvider) => {
    if (!items.length || !totalPrice) return;

    // Use freshUser if available (refetched from server), otherwise use user from context
    const currentUser = freshUser || user;

    console.log("[CheckoutDialog] handleCheckout called");
    console.log("[CheckoutDialog] currentUser:", currentUser);

    // Require user to be logged in
    if (!currentUser) {
      console.log("[CheckoutDialog] User not logged in, redirecting to login");
      toast({
        title: t.basket?.error || "Authentication required",
        description:
          t.basket?.login_required ||
          "You must be logged in to complete the order.",
        variant: "warning",
      });
      // close dialog then navigate to login preserving return path
      onOpenChange(false);
      const returnTo = location.pathname + location.search;
      navigate(`/${locale}/login`, { state: { from: returnTo } });
      return;
    }

    // Require address on user profile
    const address = (currentUser as any).address;
    console.log("[CheckoutDialog] address:", address);

    // Check if address has at least one non-empty field
    const hasAddress =
      address &&
      Object.values(address).some(
        (val) => typeof val === "string" && val.trim().length > 0
      );

    console.log("[CheckoutDialog] hasAddress:", hasAddress);

    if (!hasAddress) {
      console.log("[CheckoutDialog] Address missing, redirecting to account");
      toast({
        title: t.basket?.error || "Address required",
        description:
          t.basket?.address ||
          "Please add your shipping address in your account before placing an order.",
        variant: "warning",
      });
      onOpenChange(false);
      navigate(`/${locale}/account`);
      return;
    }

    console.log("[CheckoutDialog] All checks passed, proceeding to payment");

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
      console.error(err);
      toast({
        title: t.basket?.payment_error_title || "Payment Failed",
        description:
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          t.basket?.payment_error ||
          "Ошибка при создании заказа.",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t.basket?.checkout_title || "Confirm Order"}
          </DialogTitle>
          <DialogDescription>
            {t.basket?.checkout_desc ||
              "Review your order and choose payment method."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between text-sm"
              >
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
              <span>{t.basket?.total || "Total"}</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto btn-primary"
            disabled={isPaying || externalIsPaying}
            onClick={() => handleCheckout("payme")}
          >
            {isPaying || externalIsPaying ? "Processing..." : "Pay with Payme"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isPaying || externalIsPaying}
            onClick={() => handleCheckout("click")}
          >
            {isPaying || externalIsPaying ? "Processing..." : "Pay with Click"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isPaying || externalIsPaying}
            onClick={() => handleCheckout("uzum")}
          >
            {isPaying || externalIsPaying ? "Processing..." : "Pay with Uzum"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
