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
    <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/branch-season" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <Link href="/tpo/reports/by-branch" className="text-sm font-semibold text-link hover:underline">
        ← By Branch report
      </Link>
      <PageHeader
        eyebrow="TPO · Reports"
        title="Branch by placement season"
        description="Current college branch attribution and persisted applicant/offer numerators; unknown registration denominators are never treated as zero."
        actions={dashboard.season ? (
          <a
            href={"/api/placements/tpo/reports/branch-season/export?seasonId=" +
              encodeURIComponent(dashboard.season.id)}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-white"
          >
            Export season CSV
          </a>
        ) : undefined}
      />
      {dashboard.seasons.length ? (
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-foreground">
            Placement season
            <Select
              name="seasonId"
              defaultValue={dashboard.season?.id ?? ""}
              className="mt-2 block min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm font-normal"
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
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground"
          >
            View season
          </Button>
        </form>
      ) : null}
      {!dashboard.season ? (
        <p role="status" className="border-t border-border py-6 text-sm text-body">
          No placement seasons are recorded for this college. No branch rate can be calculated.
        </p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="border-b border-border px-1 py-5">
              <p className="text-sm text-body">Distinct applicants (all application states)</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.totalApplicants}</p>
            </div>
            <div className="border-b border-border px-1 py-5">
              <p className="text-sm text-body">Distinct learners with currently accepted offers</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.totalAcceptedLearners}</p>
            </div>
          </section>
          {!dashboard.registrationAvailable ? (
            <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body">
              No migrated placement-pool registration table is available.
              Registered denominator and placement rate are unknown, not zero.
              The accepted-applicants / applicant ratio below is an explicitly different metric.
            </p>
          ) : null}
          {dashboard.rows.length === 0 ? (
            <p role="status" className="border-t border-border py-6 text-sm text-body">
              This season has no persisted applicant, accepted-offer or registered-pool
              branch evidence. Rates cannot be inferred.
            </p>
          ) : (
            <DataTable
              caption="Branch by placement season"
              rows={dashboard.rows}
              getRowKey={row=>row.departmentId??"unknown"}
              empty={<p role="status">This season has no persisted applicant, accepted-offer or registered-pool branch evidence. Rates cannot be inferred.</p>}
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
