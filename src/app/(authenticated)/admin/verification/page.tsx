import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/permissions/policy";

/**
 * Safe Super Admin entry point for the college-scoped verification workspace.
 * Do not implicitly select the first college in a global organization.
 */
export default async function AdminVerificationEntry() {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");

  const collegeId = context.adminScope?.collegeId;
  if (collegeId) {
    redirect(`/admin/colleges/${encodeURIComponent(collegeId)}/verification`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Profile Verification"
        description="Review learner verification for one explicitly selected college."
      />
      <section role="status" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Choose a college first</h2>
        <p className="mt-2 text-sm text-body">
          Verification decisions belong to a college. Select a college in the
          administrator scope switcher to continue; an organization or global
          scope is not sufficient.
        </p>
        <Link href="/admin/colleges" className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Browse colleges
        </Link>
      </section>
    </div>
  );
}
