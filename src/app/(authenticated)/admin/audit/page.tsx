import Link from "next/link";
import { redirect } from "next/navigation";
import ActivityPage from "@/app/(authenticated)/activity/page";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { isSuperAdmin } from "@/modules/identity/context";
import { validateSuperAdminAuditRouteQuery } from "@/modules/activity/super-admin-audit-route-query-model";

export default async function SuperAdminAuditPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSuperAdmin(await getCurrentRequestContext())) redirect("/dashboard");
  const parsed = validateSuperAdminAuditRouteQuery(await searchParams);
  if (!parsed) return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin" title="Activity Log"
      actions={<Link href="/tracker/audit-findings"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:w-auto">Audit Findings</Link>} />
    <ErrorState title="Invalid audit filters" description="Check date range, UUIDs and event filters. No events were queried."
      action={<Link href="/admin/audit" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:w-auto">Clear filters</Link>} />
  </div>;
  return <ActivityPage searchParams={Promise.resolve(parsed)} />;
}
