"use client";

import { useActionState } from "react";
import { addStaffAction } from "@/app/admin/access/actions";
import { PermissionGrid } from "@/components/admin/PermissionGrid";
import type { StaffFormState } from "@/lib/validation/staff";

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState<StaffFormState, FormData>(
    addStaffAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input name="email" type="email" required className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Role</span>
          <select name="role" defaultValue="editor" className={fieldClass}>
            <option value="admin" className="text-black">
              admin
            </option>
            <option value="editor" className="text-black">
              editor
            </option>
          </select>
        </label>
      </div>

      <PermissionGrid />

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background self-start rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add staff member"}
      </button>
    </form>
  );
}
