import { AddStaffForm } from "@/components/admin/AddStaffForm";
import { PermissionGrid } from "@/components/admin/PermissionGrid";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { ResourcePermissions } from "@/lib/admin/permissions";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import { listStaff } from "@/lib/admin/staff";
import { deleteStaffAction, updateStaffAction } from "./actions";

const buttonClass =
  "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

export default async function AccessPage() {
  await requireSuperAdmin();
  const staff = await listStaff();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Access management
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add Admin/Editor staff and grant granular, per-resource permissions.
        </p>
      </div>

      <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-4 text-lg font-medium">Add staff member</h2>
        <AddStaffForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Staff</h2>
        {staff.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            No staff members yet.
          </p>
        ) : (
          staff.map((member) => {
            const current: Record<string, ResourcePermissions> = {};
            for (const p of member.permissions) {
              current[p.resource] = {
                view: p.canView,
                edit: p.canEdit,
                delete: p.canDelete,
              };
            }
            return (
              <div
                key={member.id}
                className="flex flex-col gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.user.email}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {member.user.role}
                    </p>
                  </div>
                  <form action={deleteStaffAction}>
                    <input type="hidden" name="staffId" value={member.id} />
                    <ConfirmButton
                      message={`Remove ${member.user.email}? Their account will be deleted.`}
                      className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-500/10 dark:text-red-400"
                    >
                      Remove
                    </ConfirmButton>
                  </form>
                </div>
                <form action={updateStaffAction} className="flex flex-col gap-3">
                  <input type="hidden" name="staffId" value={member.id} />
                  <PermissionGrid current={current} />
                  <button type="submit" className={`${buttonClass} self-start`}>
                    Save permissions
                  </button>
                </form>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
