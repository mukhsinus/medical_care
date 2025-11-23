"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  LogOut,
  Package,
  Edit,
  ShoppingBasket,
  Shield,
  ChevronRight,
  Mail,
  Phone,
  Lock,
  Trash2,
  Plus,
  Minus,
  MapPin,
} from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    house?: string;
    street?: string;
    city?: string;
    zip?: string;
  };
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import api, { startPayment } from "@/api";

const fetchUserProfile = async (): Promise<{ user: UserProfile }> => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch("http://localhost:8090/api/me", {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch user profile");
  return response.json();
};

const fetchUserOrders = async () => {
  const token = localStorage.getItem("authToken");
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch("http://localhost:8090/api/user/orders", {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
};

const updateUserProfile = async (data: {
  name: string;
  phone?: string;
  address?: {
    house?: string;
    city?: string;
    street?: string;
    zip?: string;
  };
}) => {
  const token = localStorage.getItem("authToken");
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch("http://localhost:8090/api/user/profile", {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to update profile");
  }
  return response.json();
};

const changePassword = async (data: { current: string; new: string }) => {
  const token = localStorage.getItem("authToken");
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch("http://localhost:8090/api/user/password", {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to change password");
  return response.json();
};

const logoutUser = async () => {
  await fetch("http://localhost:8090/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  localStorage.removeItem("authToken");
};

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "UZS" });

type Tab = "info" | "basket" | "orders";
type PaymentProvider = "payme" | "click";

const Account: React.FC = () => {
  const { locale, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } =
    useCart();

  const [activeTab, setActiveTab] = useState<Tab>("info");

  // Add this helper function inside the component (same as in Basket page)
  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find((i) => i.product.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) removeItem(id);
    else updateQuantity(id, newQty);
  };

  // And finally render the dialog at the bottom (after password modal) */}
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [house, setHouse] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isPaying, setIsPaying] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { toast } = useToast();

  // Fetch user profile
  const {
    data,
    isLoading: userLoading,
    error: userError,
  } = useQuery<{ user: UserProfile }>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    retry: 1,
  });
  const user = data?.user;

  // Fetch orders
  const { data: ordersData = { orders: [] }, isLoading: ordersLoading } =
    useQuery<{ orders: Order[] }>({
      queryKey: ["userOrders"],
      queryFn: fetchUserOrders,
      enabled: !!user,
    });

  const orders = ordersData.orders;

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswords({ current: "", new: "", confirm: "" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => navigate(`/${locale}/login`),
  });

  // Sync form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setHouse(user.address?.house || "");
      setStreet(user.address?.street || "");
      setCity(user.address?.city || "");
      setZip(user.address?.zip || "");
    }
  }, [user]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        name,
        phone,
        address: { house, street, city, zip },
      });
      toast({
        title: "Profile Updated",
        description: "Your information has been successfully updated.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description:
          "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match");
      return;
    }
    changePasswordMutation.mutate({
      current: passwords.current,
      new: passwords.new,
    });
  };

  const handleCheckout = async (provider: PaymentProvider) => {
    try {
      if (!items.length) return;
      setIsPaying(true);

      const payloadItems = items.map((ci) => ({
        productId: Number(ci.product.id) || 0,
        name: ci.product.name,
        quantity: ci.quantity,
        price: ci.product.price,
      }));

      const result = await startPayment({
        items: payloadItems,
        amount: totalPrice ?? 0,
        provider,
      });

      setIsCheckoutOpen(false);
      window.location.href = result.paymentInitData.redirectUrl;
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        t.basket?.payment_error ||
        "Ошибка при создании заказа. Попробуйте ещё раз.";

      toast({
        title: t.basket?.payment_error_title || "Payment Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (userLoading) {
    return (
      <Layout>
        <section className="min-h-[calc(100svh-4rem)] py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (userError) {
    return (
      <Layout>
        <section className="min-h-[calc(100svh-4rem)] py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-red-500">Please log in to view your account.</p>
            <Button asChild size="lg" className="mt-4">
              <Link to={`/${locale}/login`}>{t.login?.button || "Log In"}</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const navItems = [
    {
      id: "info",
      label: t.account?.personalInfo || "Personal Info",
      icon: User,
    },
    {
      id: "basket",
      label: t.account?.basket || "Basket",
      icon: ShoppingBasket,
    },
    { id: "orders", label: t.account?.orders || "Orders", icon: Package },
  ];

  return (
    <Layout>
      <SEO
        title={t.account?.title || "Your Account"}
        description={
          t.account?.description || "Manage your account and orders."
        }
        path={location.pathname}
      />

      <section className="min-h-[calc(100svh-4rem)] py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            {t.account?.title || "Your Account"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* LEFT SIDEBAR */}
            <nav className="md:col-span-1">
              <Card className="glass-card rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <ul className="space-y-1 p-3">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveTab(item.id as Tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                              ${
                                activeTab === item.id
                                  ? "bg-sky-500 text-white shadow-md"
                                  : "hover:bg-accent/50 text-muted-foreground"
                              }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                            {activeTab === item.id && (
                              <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                    <li className="pt-4 mt-4 border-t border-white/20">
                      <button
                        onClick={() => logoutMutation.mutate()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                        disabled={logoutMutation.isPending}
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">
                          {t.account?.logout || "Log Out"}
                        </span>
                      </button>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </nav>

            {/* RIGHT CONTENT */}
            <div className="md:col-span-3">
              {/* PERSONAL INFO */}
              {activeTab === "info" && (
                <Card className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-6 w-6 text-sky-500" />
                      {t.account?.personalInfo || "Personal Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditing ? (
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">
                            {t.account?.name || "Name"}
                          </Label>
                          <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-phone">
                            {t.account?.phone || "Phone"}
                          </Label>
                          <Input
                            id="edit-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+998 99 123 45 67"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t.account?.address || "Address"}</Label>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder={t.account?.house || "House"}
                              value={house}
                              onChange={(e) => setHouse(e.target.value)}
                            />
                            <Input
                              placeholder={t.account?.street || "Street"}
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                            />
                            <Input
                              placeholder={t.account?.city || "City"}
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                            <Input
                              placeholder={t.account?.zip || "ZIP"}
                              value={zip}
                              onChange={(e) => setZip(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={updateProfileMutation.isPending}
                          >
                            {t.account?.save || "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsEditing(false)}
                          >
                            {t.account?.cancel || "Cancel"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-lg">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span>{user?.name || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-lg">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <span>{user?.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-lg">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span>
                              {user?.phone ||
                                t.account?.notProvided ||
                                "Not provided"}
                            </span>
                          </div>
                          <div className="flex items-start gap-3 text-lg">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              {user?.address?.street ? (
                                <>
                                  <div>{user.address.street}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.address.city}
                                    {user.address.zip
                                      ? `, ${user.address.zip}`
                                      : ""}
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted-foreground">
                                  {t.account?.notProvided || "Not provided"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t.account?.edit_profile || "Edit Profile"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowPasswordModal(true)}
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            {t.account?.changePassword || "Change Password"}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* BASKET TAB */}
              {activeTab === "basket" && (
                <Card className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBasket className="h-6 w-6 text-sky-500" />
                      {t.basket?.title || "Your Basket"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-xl text-muted-foreground mb-6">
                          {t.basket?.empty || "Your basket is empty."}
                        </p>
                        <Button asChild size="lg" className="btn-primary">
                          <Link to={`/${locale}/catalog`}>
                            {t.basket?.shop || "Go to shop"}
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-[1fr_320px] gap-6">
                        {/* Same item list as Basket page – you can even extract this too if you want */}
                        <section>
                          <ul className="space-y-4">
                            {items.map((ci) => {
                              const p = ci.product;
                              return (
                                <li
                                  key={p.id}
                                  className="glass-card rounded-2xl p-4 flex gap-4"
                                >
                                  {/* IMAGE */}
                                  <div className="w-20 h-20 bg-[hsl(200_80%_94%)] rounded-lg overflow-hidden shrink-0">
                                    {p.image ? (
                                      <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      "No image"
                                    )}
                                  </div>

                                  {/* RIGHT BLOCK */}
                                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                                    {/* PRODUCT NAME */}
                                    <div className="font-semibold text-lg break-words">
                                      {p.name}
                                    </div>

                                    {/* UNIT PRICE */}
                                    <div className="text-muted-foreground">
                                      {formatCurrency(p.price)}
                                    </div>

                                    {/* QUANTITY + TOTAL PRICE left aligned */}
                                    <div className="flex items-center gap-3 flex-wrap mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleQuantityChange(p.id, -1)
                                        }
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>

                                      <span className="w-10 text-center">
                                        {ci.quantity}
                                      </span>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleQuantityChange(p.id, +1)
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => removeItem(p.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>

                                      {/* TOTAL PRICE */}
                                      <div className="font-semibold text-lg">
                                        {formatCurrency(p.price * ci.quantity)}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="flex justify-between mt-6">
                            <Button variant="outline" onClick={clearCart}>
                              {t.basket?.clear || "Clear"}
                            </Button>
                            <Button asChild variant="outline">
                              <Link to={`/${locale}/catalog`}>
                                {t.basket?.continue || "Continue shopping"}
                              </Link>
                            </Button>
                          </div>
                        </section>

                        <aside className="glass-card rounded-2xl p-6">
                          <div className="text-lg font-bold flex justify-between">
                            <span>{t.basket?.subtotal || "Subtotal"}</span>
                            <span>{formatCurrency(totalPrice ?? 0)}</span>
                          </div>
                          <div className="flex justify-between mt-2 text-muted-foreground">
                            <span className="flex-1 text-left">
                              {t.basket?.shipping || "Shipping"}
                            </span>
                            <span className="flex-1 text-right">
                              {t.basket?.shipping_calc ||
                                "Calculated at checkout"}
                            </span>
                          </div>
                          <Button
                            size="lg"
                            className="w-full btn-primary shadow-lg hover:shadow-xl mt-6"
                            onClick={() => setIsCheckoutOpen(true)}
                          >
                            {t.basket?.checkout || "Proceed to checkout"}
                          </Button>
                        </aside>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ORDERS */}
              {activeTab === "orders" && (
                <Card className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-6 w-6 text-sky-500" />
                      {t.account?.orders || "Recent Orders"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <p className="text-center text-muted-foreground">
                        Loading orders...
                      </p>
                    ) : orders.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t.account?.no_orders || "No recent orders."}
                      </p>
                    ) : (
                      <>
                        <ul className="space-y-4">
                          {orders.map((order: any) => (
                            <li
                              key={order.id}
                              className="flex justify-between items-center p-4 bg-accent/20 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-sky-500" />
                                <div>
                                  <p className="font-medium">
                                    Order #{order.id}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.date}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {formatCurrency(order.total)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.status}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full mt-6"
                        >
                          <Link to={`/${locale}/orders`}>
                            {t.account?.view_all_orders || "View All Orders"}
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CHANGE PASSWORD MODAL */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.account?.changePassword || "Change Password"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CheckoutDialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} />
    </Layout>
  );
};

export default Account;
