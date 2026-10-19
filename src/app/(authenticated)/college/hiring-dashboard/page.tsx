import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { ReportFilters, ReportMetrics, ReportScopeNote } from "@/components/placements/placement-report-ui";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";
import { collegeHiringAnalyticsQuery } from "@/modules/placements/college-hiring-analytics-model";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import {CollegeHiringFunnel} from "@/components/placements/college-hiring-funnel";
import {CollegeReportNavigation} from "@/components/placements/college-report-navigation";

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
    return <div className="min-w-0 overflow-x-clip space-y-4">
      <PageHeader eyebrow="Placements" title="Analytics"
      actions={<Link href="/college/placements/readiness-by-department"
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
        Placement Evidence by Department
      </Link>} />
      <ErrorState title="Invalid report search" description="No placement metrics were loaded."
        action={<Link href="/college/hiring-dashboard" className="font-semibold text-link">Clear filters</Link>} />
    </div>;
  }
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId:query.data.seasonId,jobId:query.data.jobId,
  });
  const funnel=await getCollegeHiringFunnel(context,{
    ...query.data,seasonId:query.data.seasonId??workspace.selectedSeasonId??undefined,
  });
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Placements" title="Analytics"
      actions={<Link href="/college/placements/readiness-by-department"
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
        Placement Evidence by Department
      </Link>} />
    <CollegeReportNavigation/>
    <ReportFilters workspace={workspace} userId={context.user.id} path="/college/hiring-dashboard" />
    <ReportMetrics metrics={workspace.report.metrics} />
    <CollegeHiringFunnel data={funnel} selectedSeasonId={workspace.selectedSeasonId}
      selectedJobId={workspace.selectedJobId}/>
    <ReportScopeNote note={workspace.registrationScopeNote} />
  </div>;
}
