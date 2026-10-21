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
  const rawQuery = await searchParams;
  const parsed = validateSuperAdminAuditRouteQuery(rawQuery);
  // The legacy audit URL used category; this is not a vNext event module.
  const unsupportedCategory =
    typeof rawQuery.category === "string" ? rawQuery.category.trim().slice(0, 80) : null;
  if (!parsed) return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin" title="Activity Log"
      actions={<Link href="/tracker/audit-findings"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Audit Findings</Link>} />
    <ErrorState title="Invalid audit filters"
      description={unsupportedCategory
        ? "Unknown activity category: " + unsupportedCategory + "."
        : "Check date range, UUIDs and event filters. No events were queried."}
      action={<Link href="/admin/audit" className="inline-flex min-h-11 w-full items-center justify-center font-[650] text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  return <div className="min-w-0 space-y-6">
    <ActivityPage searchParams={Promise.resolve(parsed)} />
    <section aria-labelledby="sms-delivery-attempts" className="border-t border-[var(--lms-canvas-border)] pt-5">
      <h2 id="sms-delivery-attempts" className="font-semibold text-[var(--lms-heading)]">
        SMS delivery attempts
      </h2>
      <p role="status" className="mt-2 text-sm leading-6 text-body">
        Provider delivery attempts are a restricted operational record and
        are not yet available in the Activity Log. No SMS attempt counts are inferred from activity events.
      </p>
    </section>
  </div>;
}
