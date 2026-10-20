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
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Analytics"
      actions={<Link href="/college/placements/readiness-by-department"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link transition-colors md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Placement Evidence by Department
      </Link>} />
      <ErrorState title="Invalid report search" description="No placement metrics were loaded."
        action={<Link href="/college/hiring-dashboard" className="inline-flex min-h-11 items-center font-semibold text-link lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>} />
    </div>;
  }
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId:query.data.seasonId,jobId:query.data.jobId,
  });
  const funnel=await getCollegeHiringFunnel(context,{
    ...query.data,seasonId:query.data.seasonId??workspace.selectedSeasonId??undefined,
  });
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Analytics"
      actions={<Link href="/college/placements/readiness-by-department"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link transition-colors md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Placement Evidence by Department
      </Link>} />
    <CollegeReportNavigation/>
    <ReportFilters workspace={workspace} userId={context.user.id} path="/college/hiring-dashboard" />
    <ReportMetrics metrics={workspace.report.metrics} />
    <CollegeHiringFunnel data={funnel} selectedSeasonId={workspace.selectedSeasonId}
      selectedJobId={workspace.selectedJobId}/>
    <details className="min-w-0 border-t border-border pt-2">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Reporting methodology</summary>
      <ReportScopeNote note={workspace.registrationScopeNote} />
    </details>
  </div>;
}
