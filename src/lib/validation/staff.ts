import { z } from "zod";

export const staffFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["admin", "editor"]),
});

export type StaffFormInput = z.infer<typeof staffFormSchema>;

// Return shape for the add-staff form's useActionState (kept out of the
// "use server" actions module).
export type StaffFormState = { error?: string };
