import type { PaymentGateway } from "./gateway";

/**
 * Manual gateway (spec §6.4): no online checkout — a super-admin activates the
 * subscription after an off-platform payment (e.g. bKash send-money).
 */
export const manualGateway: PaymentGateway = {
  name: "manual",
  async createCheckout() {
    throw new Error(
      "Manual payments are activated by a super-admin, not via online checkout.",
    );
  },
  async verifyPayment() {
    return { paid: false };
  },
};

// bKash / SSLCommerz: the abstraction is wired up; the live hosted-checkout API
// calls are added once merchant credentials + DCO registration are available
// (spec §13). Decrypted credentials are passed in.
function notConfigured(name: string): never {
  throw new Error(
    `${name} gateway is not configured yet (pending merchant credentials).`,
  );
}

export function createBkashGateway(
  _credentials: Record<string, string>,
): PaymentGateway {
  return {
    name: "bkash",
    async createCheckout() {
      return notConfigured("bKash");
    },
    async verifyPayment() {
      return notConfigured("bKash");
    },
  };
}

export function createSslcommerzGateway(
  _credentials: Record<string, string>,
): PaymentGateway {
  return {
    name: "sslcommerz",
    async createCheckout() {
      return notConfigured("SSLCommerz");
    },
    async verifyPayment() {
      return notConfigured("SSLCommerz");
    },
  };
}
