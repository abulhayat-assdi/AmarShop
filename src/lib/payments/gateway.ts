/**
 * Generic payment gateway abstraction (spec §6.2). The platform-default gateway
 * and any per-tenant approved gateway both implement this same interface, so the
 * rest of the app never depends on a specific provider (bKash/SSLCommerz/manual).
 */
export type CheckoutParams = {
  amount: number; // smallest currency unit
  currency: string;
  reference: string;
  description?: string;
  returnUrl: string;
};

export type CheckoutResult = {
  redirectUrl: string;
  providerRef?: string;
};

export type VerifyResult = {
  paid: boolean;
  amount?: number;
  providerRef?: string;
};

export interface PaymentGateway {
  readonly name: string;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyPayment(providerRef: string): Promise<VerifyResult>;
}
