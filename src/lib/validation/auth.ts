import { z } from "zod";

// Site categories a tenant can choose at sign-up (spec §1, §12).
export const SITE_TYPES = [
  "ecommerce",
  "blog",
  "portfolio",
  "agency",
  "landing",
] as const;

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
  shopName: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(60),
  siteType: z.enum(SITE_TYPES).default("ecommerce"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
