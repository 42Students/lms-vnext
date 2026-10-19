import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";

/**
 * Safe Super Admin entry point for the college-scoped verification workspace.
 * Do not implicitly select the first college in a global organization.
 */
export default async function AdminVerificationEntry() {
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
    return <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="Super Admin" title="Profile verification"/>
      <ErrorState title="Verification access denied"
        description="Your account cannot access Super Admin verification."
        action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
    </div>;

  const collegeId = context.adminScope?.collegeId;
  if (collegeId) {
    redirect(`/admin/colleges/${encodeURIComponent(collegeId)}/verification`);
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Profile verification"
        description="Students' education and identity, checked against their documents."
        actions={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Browse colleges</Link>}
      />
      <section role="status" className="border-b border-border py-5">
        <h2 className="text-base font-semibold text-foreground">Choose a college first</h2>
        <p className="mt-2 text-sm text-body">
          Choose a college at the top to see its students waiting for verification.
          A global or organization-only scope cannot authorize a college review.
        </p>
      </section>
    </div>
  );
}
