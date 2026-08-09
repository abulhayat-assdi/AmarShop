import { z } from "zod";

export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/**
 * Product form validation. Prices and stock arrive from form fields as strings,
 * so they are coerced to non-negative integers. Price is stored as whole Taka
 * (matching how the storefront renders `৳{price}`).
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative"),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  category: z.string().trim().max(100).optional(),
  status: z.enum(PRODUCT_STATUSES),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

// Return shape for the product form's useActionState (kept out of the
// "use server" actions module, which may only export async functions).
export type ProductFormState = { error?: string };
