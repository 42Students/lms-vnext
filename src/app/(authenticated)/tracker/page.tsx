import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { TrackerReportForm } from "@/components/tracker/tracker-report-form";
import { PageHeader } from "@/components/ui/page-header";
import { isSuperAdmin } from "@/modules/identity/context";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

/** SA-placements-projects-100: authenticated reporter intake until OD-27 is resolved. */
export const metadata={title:"Report Issue · 42 Tracker"};
export default async function TrackerReportPage() {
  const context = await getCurrentRequestContext();
  if (context.user.platformStatus !== "ACTIVE") redirect("/dashboard");
  const ready = trackerAdminRuntimeEnabled();
  return <div className="space-y-6">
    <PageHeader eyebrow="Report an LMS issue" title="What went wrong?"
      description="Pick the context, describe the problem, and submit." />
    {isSuperAdmin(context)?<TrackerAdminNav />:
      <Link href="/tracker/mine" className="font-semibold text-primary-text underline">
        My reports
      </Link>}
    {!ready ? <div role="status" className="rounded-xl border border-border bg-surface p-5">
      <p className="font-semibold">Tracker database is not enabled.</p>
      <p className="mt-2 text-sm text-body">
        Migration 0076 must be verified and DB10_TRACKER_READY=DB10_VERIFIED set before reports can be saved.
      </p>
    </div> : <TrackerReportForm canSearchSimilar={isSuperAdmin(context)} />}
  </div>;
}
