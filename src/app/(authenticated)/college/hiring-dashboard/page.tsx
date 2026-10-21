import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
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
import {CollegeHiringDateFilters} from "@/components/placements/college-hiring-date-filters";

/** Dedicated legacy Analytics surface: tenant-owned observed placement metrics. */
export default async function CollegeHiringDashboardPage({
  searchParams,
}: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Analytics"/>
      <ErrorState title="Admin not assigned to a college"
        description="Contact your administrator for a College Admin membership before viewing hiring reports."
        action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
    </div>;
  }
  const query = collegeHiringAnalyticsQuery(await searchParams);
  if (!query.success) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Analytics"
      actions={<Link href="/college/placements/readiness-by-department"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link transition-colors md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Placement Evidence by Department
      </Link>} />
      <ErrorState title="Invalid report search" description="No placement metrics were loaded."
        action={<Link href="/college/hiring-dashboard" className="inline-flex min-h-11 items-center font-semibold text-link lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto md:min-h-9">Clear filters</Link>} />
    </div>;
  }
  const workspaceRequest=getPlacementReportWorkspace(context,{
    collegeId:context.membership.collegeId,
    seasonId:query.data.seasonId,jobId:query.data.jobId,
  });
  // Use independent reads when season is explicit; otherwise preserve the
  // workspace's selected season instead of changing report scope.
  const funnelRequest=query.data.seasonId
    ?getCollegeHiringFunnel(context,query.data)
    :workspaceRequest.then(workspace=>getCollegeHiringFunnel(context,{
      ...query.data,seasonId:workspace.selectedSeasonId??undefined,
    }));
  const [workspaceResult,funnelResult]=await Promise.allSettled([workspaceRequest,funnelRequest]);
  if(workspaceResult.status==="rejected"&&workspaceResult.reason instanceof AuthorizationError)
    throw workspaceResult.reason;
  if(funnelResult.status==="rejected"&&funnelResult.reason instanceof AuthorizationError)
    throw funnelResult.reason;
  const workspace=workspaceResult.status==="fulfilled"?workspaceResult.value:null;
  const funnel=funnelResult.status==="fulfilled"?funnelResult.value:null;
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Analytics"
      actions={<Link href="/college/placements/readiness-by-department"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link transition-colors md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Placement Evidence by Department
      </Link>} />
    <CollegeReportNavigation/>
    <CollegeHiringDateFilters filters={query.data}/>
    {workspace?<ReportFilters workspace={workspace} userId={context.user.id} path="/college/hiring-dashboard" />:null}
    {!workspace?<Alert tone="warning">
      Could not load hiring metrics. The college report is unavailable.
      <Link href="/college/hiring-dashboard" className="ml-2 font-semibold text-link underline">Retry</Link>
    </Alert>:null}
    {workspace?<ReportMetrics metrics={workspace.report.metrics}/>:null}
    {!funnel?<Alert tone="warning">
      Could not load hiring funnel. Other report sections remain available.
      <Link href="/college/hiring-dashboard" className="ml-2 font-semibold text-link underline">Retry</Link>
    </Alert>:null}
    {funnel?<CollegeHiringFunnel data={funnel}
      selectedSeasonId={workspace?.selectedSeasonId??query.data.seasonId??null}
      selectedJobId={workspace?.selectedJobId??query.data.jobId??null}/>:null}
    <details className="min-w-0 border-t border-border pt-2">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Reporting methodology</summary>
      {workspace?<ReportScopeNote note={workspace.registrationScopeNote}/>:
        <p className="text-sm text-muted-foreground">Methodology will appear after the report reloads.</p>}
    </details>
  </div>;
}
