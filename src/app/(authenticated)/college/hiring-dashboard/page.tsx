import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { ReportFilters, ReportMetrics, ReportScopeNote } from "@/components/placements/placement-report-ui";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";
import { collegeHiringAnalyticsQuery } from "@/modules/placements/college-hiring-analytics-model";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";

/** Dedicated legacy Analytics surface: tenant-owned observed placement metrics. */
export default async function CollegeHiringDashboardPage({
  searchParams,
}: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) {
    redirect("/dashboard");
  }
  const query = collegeHiringAnalyticsQuery(await searchParams);
  if (!query.success) {
    return <div className="space-y-4">
      <PageHeader eyebrow="Placements" title="Analytics" />
      <ErrorState title="Invalid report search" description="No placement metrics were loaded."
        action={<Link href="/college/hiring-dashboard" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    ...query.data,
  });
  return <div className="space-y-6">
    <PageHeader eyebrow="Placements" title="Analytics" />
    <ReportFilters workspace={workspace} path="/college/hiring-dashboard" />
    <ReportMetrics metrics={workspace.report.metrics} />
    <ReportScopeNote note={workspace.registrationScopeNote} />
  </div>;
}
