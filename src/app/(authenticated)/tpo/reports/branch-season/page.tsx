import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoBranchSeasonDashboard } from "@/modules/placements/tpo-branch-season-service";

export default async function TpoBranchSeasonPage({
  searchParams,
}: {
  searchParams: Promise<{ seasonId?: string | string[] }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const search = await searchParams;
  const seasonId = Array.isArray(search.seasonId) ? search.seasonId[0] : search.seasonId;
  const dashboard = await getTpoBranchSeasonDashboard(
    context, { ...(seasonId ? { seasonId } : {}) },
  );
  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Branch by placement season"
        description="Current college branch attribution and persisted applicant/offer numerators; unknown registration denominators are never treated as zero."
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Link href="/tpo/reports/by-branch" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-link underline sm:w-auto md:min-h-9">← By Branch report</Link>
          {dashboard.season ? (
          <a
            href={"/api/placements/tpo/reports/branch-season/export?seasonId=" +
              encodeURIComponent(dashboard.season.id)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 sm:w-auto md:min-h-9 text-sm font-[650] text-[var(--lms-on-primary)] hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Export season CSV
          </a>
        ) : null}
        </div>}
      />
      {dashboard.seasons.length ? (
        <form method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Placement season
            <Select
              name="seasonId"
              defaultValue={dashboard.season?.id ?? ""}
              className="mt-2 block min-h-11 w-full md:min-h-9"
            >
              {dashboard.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} · {season.status}
                </option>
              ))}
            </Select>
          </label>
          <Button variant="secondary"
            type="submit"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
          >
            View season
          </Button>
        </form>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center"><TpoReportPresentation /></div>
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/branch-season" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      {!dashboard.season ? (
        <EmptyState title="No placement seasons are recorded for this college." description="No branch rate can be calculated."/>
      ) : (
        <>
          <section className="grid gap-3 min-[768px]:grid-cols-2" aria-label="Season branch totals"><StatTile label="Distinct applicants (all application states)" value={dashboard.totalApplicants} className="min-h-[104px]" /><StatTile label="Distinct learners with currently accepted offers" value={dashboard.totalAcceptedLearners} className="min-h-[104px]" /></section>
          {!dashboard.registrationAvailable ? (
            <Alert tone="warning">No migrated placement-pool registration table is available. Registered denominator and placement rate are unknown, not zero. The accepted-applicants / applicant ratio below is an explicitly different metric.</Alert>
          ) : null}
          {dashboard.rows.length === 0 ? (
            <EmptyState title="This season has no persisted applicant, accepted-offer or registered-pool branch evidence." description="Rates cannot be inferred."/>
          ) : (
            <DataTable
              caption="Branch by placement season"
              rows={dashboard.rows}
              getRowKey={row=>row.departmentId??"unknown"}
              empty={<EmptyState title="This season has no persisted applicant, accepted-offer or registered-pool branch evidence." description="Rates cannot be inferred."/>}
              columns={[
                {key:"department",header:"Current branch",cell:row=>row.departmentName,mobilePriority:"primary"},
                {key:"applicants",header:"Applicants",cell:row=>row.applicants,mobilePriority:"secondary"},
                {key:"accepted",header:"Accepted learners",cell:row=>row.acceptedLearners,mobilePriority:"secondary"},
                {key:"offerVersions",header:"Accepted offer versions",cell:row=>row.acceptedOfferVersions,mobilePriority:"secondary"},
                {key:"perApplicant",header:"Accepted / applicants",cell:row=>row.acceptedPerApplicantPercent===null
                  ?"N/A (no applicants)":row.acceptedPerApplicantPercent.toFixed(2)+"%",mobilePriority:"secondary"},
                {key:"registered",header:"Registered pool",cell:row=>row.registered??"Unknown",mobilePriority:"secondary"},
                {key:"registeredPlaced",header:"Accepted registered learners",cell:row=>row.registeredPlaced??"Unknown",mobilePriority:"secondary"},
                {key:"perRegistered",header:"Placed / registered",cell:row=>row.placedPerRegisteredPercent===null
                  ?"Unknown / N/A":row.placedPerRegisteredPercent.toFixed(2)+"%",mobilePriority:"secondary"},
              ]}
            />
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            Accepted offers use current persisted offer status, not historical response counts.
            Applicant denominator is distinct memberships with an in-app application in this
            season, including withdrawn applications. Learners with zero or multiple current
            departments appear in an explicit unknown/ambiguous row. Current branch is not
            proof of the branch at the original placement date.
          </p>
        </>
      )}
    </div>
  );
}
