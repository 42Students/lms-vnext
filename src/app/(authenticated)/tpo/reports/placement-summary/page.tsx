import Link from "next/link";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import { redirect } from "next/navigation";
import {getTpoReportDriveDimensions} from "@/modules/placements/tpo-report-drive-dimensions-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
  ReportMetrics,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
  reportCurrency,
  reportNumber,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportDetails } from "@/modules/placements/report-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
  companyId?:string|string[];
  workMode?:string|string[];
  payCategory?:string|string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoPlacementSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const { metrics, byDrive, byCompany } = workspace.report;
  const dimensions=await getTpoReportDriveDimensions(context,{collegeId:context.membership.collegeId,
   seasonId:workspace.selectedSeasonId,jobId:workspace.selectedJobId}).catch(()=>null);
  const companyId=first(query.companyId)??"";
  const workMode=first(query.workMode)??"";
  const payCategory=first(query.payCategory)??"";
  const validFilters=(!companyId||byCompany.some(item=>item.companyId===companyId))&&
   (!workMode||["ONSITE","HYBRID","REMOTE"].includes(workMode))&&
   (!payCategory||["CTC_RECORDED","STIPEND_RECORDED","NOT_RECORDED"].includes(payCategory));
  const shownDrives=dimensions&&validFilters?byDrive.filter(row=>{
   const dim=dimensions?.get(row.jobId);
   return dim&&(!companyId||dim.companyId===companyId)&&(!workMode||dim.workMode===workMode)&&
    (!payCategory||dim.payCategory===payCategory);
  }):[];

  return (
    <div data-tpo-presentation-report className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Placement summary"
        description="Season placement outcomes, distinct learners, offer totals and the drive/application funnel."
        actions={
          <ReportCsvLink workspace={workspace} kind="placement-summary" />
        }
      />

      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/placement-summary"
      />
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/placement-summary" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <ReportMetrics metrics={metrics} />

      <section
        aria-label="Detailed placement metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { label: "Registered", value: reportNumber(metrics.registered) },
          { label: "Unique applicants", value: reportNumber(metrics.applicants) },
          { label: "Applications", value: reportNumber(metrics.applications) },
          { label: "Accepted offers", value: reportNumber(metrics.acceptedOffers) },
          { label: "Shortlisted", value: reportNumber(metrics.shortlisted) },
          { label: "Rejected", value: reportNumber(metrics.rejected) },
          { label: "Average annual CTC", value: reportCurrency(metrics.averagePackageInr) },
          { label: "Highest annual CTC", value: reportCurrency(metrics.highestPackageInr) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs font-semibold uppercase text-body">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <ReportScopeNote note={workspace.registrationScopeNote} />
      <section aria-label="Offers by current status" className="space-y-3 rounded-xl border border-border bg-surface p-4">
       <h2 className="text-lg font-semibold">Offers by status</h2>
       <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([
         ["Released (all issued histories)",workspace.details.offers.totals.released],
         ["Waiting for student",workspace.details.offers.totals.outstanding],
         ["Accepted",workspace.details.offers.totals.accepted],
         ["Declined",workspace.details.offers.totals.declined],
         ["Withdrawn",workspace.details.offers.totals.withdrawn],
         ["Expired waiting",workspace.details.offers.totals.expiredOutstanding],
        ] as const).map(([label,value])=><div key={label} className="rounded border border-border p-3">
         <dt className="text-xs font-semibold text-body">{label}</dt>
         <dd className="mt-1 text-xl font-semibold tabular-nums">{reportNumber(value)}</dd>
        </div>)}
       </dl>
       <p className="text-xs text-muted-foreground">Expired waiting is a subset derived from open offers, not a seventh stored status. Selections under verification and reversed selections are separate lifecycle data and are not inferred from the offer rows.</p>
      </section>


      <ReportBarChart title="Placed learners by company" units="learners"
       rows={byCompany.map(row=>({label:row.companyName,value:row.placed}))}/>
      <ReportBarChart title="Offers by recorded status" units="offers"
       rows={[
        {label:"Accepted",value:workspace.details.offers.totals.accepted},
        {label:"Declined",value:workspace.details.offers.totals.declined},
        {label:"Withdrawn",value:workspace.details.offers.totals.withdrawn},
        {label:"Waiting for student",value:workspace.details.offers.totals.outstanding},
       ]}/>
      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Placement summary data requires a placement season. These empty results do not represent zero historical placements."
        />
      ) : (
        <>
          <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4" aria-label="Filter drive rows">
            {workspace.selectedSeasonId?<input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
            {workspace.selectedJobId?<input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
            <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold">Company
             <select name="companyId" defaultValue={companyId} className="min-h-11 rounded border border-border bg-surface px-2">
              <option value="">All companies</option>
              {byCompany.map(row=><option key={row.companyId} value={row.companyId}>{row.companyName}</option>)}
             </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">Work mode
             <select name="workMode" defaultValue={workMode} className="min-h-11 rounded border border-border bg-surface px-2">
              <option value="">All modes</option><option value="ONSITE">Onsite</option>
              <option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
             </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">Pay evidence
             <select name="payCategory" defaultValue={payCategory} className="min-h-11 rounded border border-border bg-surface px-2">
              <option value="">All</option><option value="CTC_RECORDED">CTC recorded</option>
              <option value="STIPEND_RECORDED">Stipend recorded</option>
              <option value="NOT_RECORDED">Not recorded</option>
             </select>
            </label>
            <button type="submit" className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
            {(companyId||workMode||payCategory)?<a href={"/tpo/reports/placement-summary?"+
             new URLSearchParams({
              ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
              ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{}),
             }).toString()} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
              Clear drive dimensions
             </a>:null}

          </form>
          {!validFilters?<p role="alert" className="rounded-md border border-border p-3 text-sm text-warning-text">
           One or more selected drive dimensions are invalid for this college. Clear the filters.
          </p>:null}
          {!dimensions?<section role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-subtle p-4 text-sm">
            <p className="text-warning-text">Batch filter unavailable. Drive dimension details could not be loaded; the season report remains available, but no drive-row totals are inferred.</p>
            <Link href={"/tpo/reports/placement-summary?"+new URLSearchParams({
              ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
              ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{}),
              ...(companyId?{companyId}:{}),...(workMode?{workMode}:{}),...(payCategory?{payCategory}:{}),
            }).toString()} className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 py-2 font-semibold text-primary-text">Retry</Link>
          </section>:null}
          {dimensions?<p role="status" className="text-xs text-muted-foreground">
           Showing {shownDrives.length} of {byDrive.length} drive rows. This filters the drive table only.
           Summary figures, charts, company table and standard report CSV keep the selected season/drive scope.
           CTC recorded means a declared annual package; stipend recorded means a declared stipend without CTC.
           Missing pay figures are not assumed to mean an unpaid role.
          </p>:null}
          {dimensions?<ReportTable
            title="Drive performance"
            headings={[
              "Drive",
              "Company",
              "Employment type",
              "Applicants",
              "Applications",
              "Shortlisted",
              "Rejected",
              "Offers",
              "Accepted offers",
              "Placed learners",
            ]}
            rows={shownDrives.map((row) => [
              row.title,
              row.companyName,
              row.employmentType,
              row.applicants,
              row.applications,
              row.shortlisted,
              row.rejected,
              row.offers,
              row.acceptedOffers,
              row.placed,
            ])}
            emptyDescription="No reportable drives match the selected season and drive filters."
          />:null}

          <ReportTable
            title="Company performance"
            headings={[
              "Company",
              "Drives",
              "Unique applicants",
              "Applications",
              "Offers",
              "Accepted offers",
              "Placed learners",
              "Average annual CTC",
              "Highest annual CTC",
            ]}
            rows={byCompany.map((row) => [
              row.companyName,
              row.drives,
              row.applicants,
              row.applications,
              row.offers,
              row.acceptedOffers,
              row.placed,
              reportCurrency(row.averagePackageInr),
              reportCurrency(row.highestPackageInr),
            ])}
            emptyDescription="No company placement results match the selected filters."
          />
        </>
      )}
    </div>
  );
}
