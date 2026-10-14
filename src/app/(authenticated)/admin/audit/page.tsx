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
    <PageHeader eyebrow="Super Admin" title="Activity Log" />
    <ErrorState title="Invalid audit filters" description="Check date range, UUIDs and event filters. No events were queried."
      action={<Link href="/admin/audit" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  return <ActivityPage searchParams={Promise.resolve(parsed)} />;
}
