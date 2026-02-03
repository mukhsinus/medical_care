/**
 * Payment provider types
 */
export type PaymentProvider = "payme" | "click" | "uzum";

/**
 * Payment item structure
 */
export interface PaymentItem {
  productId: number | string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  ikpuCode?: string;
  variantIkpuCodes?: Record<string, string>;
}

/**
 * Payment initiation request
 */
export interface PaymentRequest {
  items: PaymentItem[];
  amount: number;
  provider: PaymentProvider;
}

/**
 * Payment initiation response
 */
export interface PaymentResponse {
  paymentInitData: {
    redirectUrl: string;
    orderId?: string;
    transactionId?: string;
  };
}
