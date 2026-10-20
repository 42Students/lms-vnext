import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";

/**
 * Safe Super Admin entry point for the college-scoped verification workspace.
 * Do not implicitly select the first college in a global organization.
 */
export default async function AdminVerificationEntry() {
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
    return <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Profile verification"/>
      <ErrorState title="Verification access denied"
        description="Your account cannot access Super Admin verification."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
    </div>;

  const collegeId = context.adminScope?.collegeId;
  if (collegeId) {
    redirect(`/admin/colleges/${encodeURIComponent(collegeId)}/verification`);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Profile verification"
        description="Students' education and identity, checked against their documents."
        actions={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Browse colleges</Link>}
      />
      <EmptyState title="Choose a college first"
        description="Choose a college at the top to see its students waiting for verification. A global or organization-only scope cannot authorize a college review." />
    </div>
  );
}
