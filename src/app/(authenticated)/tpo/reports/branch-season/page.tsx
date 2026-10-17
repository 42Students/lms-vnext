import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
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
    <div className="space-y-6">
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/branch-season" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <Link href="/tpo/reports/by-branch" className="text-sm font-semibold text-primary-text hover:underline">
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
            className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary"
          >
            Export season CSV
          </a>
        ) : undefined}
      />
      {dashboard.seasons.length ? (
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-foreground">
            Placement season
            <select
              name="seasonId"
              defaultValue={dashboard.season?.id ?? ""}
              className="mt-2 block min-h-10 rounded-md border border-border bg-surface p-2 text-sm font-normal"
            >
              {dashboard.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} · {season.status}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-foreground"
          >
            View season
          </button>
        </form>
      ) : null}
      {!dashboard.season ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
          No placement seasons are recorded for this college. No branch rate can be calculated.
        </p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-body">Distinct applicants (all application states)</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.totalApplicants}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-body">Distinct learners with currently accepted offers</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.totalAcceptedLearners}</p>
            </div>
          </section>
          {!dashboard.registrationAvailable ? (
            <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
              No migrated placement-pool registration table is available.
              Registered denominator and placement rate are unknown, not zero.
              The accepted-applicants / applicant ratio below is an explicitly different metric.
            </p>
          ) : null}
          {dashboard.rows.length === 0 ? (
            <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
              This season has no persisted applicant, accepted-offer or registered-pool
              branch evidence. Rates cannot be inferred.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[66rem] text-left text-sm">
                <thead className="bg-surface-secondary text-xs font-semibold text-muted-foreground">
                  <tr>
                    {[
                      "Current branch", "Applicants", "Accepted learners",
                      "Accepted offer versions", "Accepted / applicants",
                      "Registered pool", "Accepted registered learners",
                      "Placed / registered",
                    ].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-3">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard.rows.map((row) => (
                    <tr key={row.departmentId ?? "unknown"}>
                      <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                        {row.departmentName}
                      </th>
                      <td className="px-4 py-3">{row.applicants}</td>
                      <td className="px-4 py-3">{row.acceptedLearners}</td>
                      <td className="px-4 py-3">{row.acceptedOfferVersions}</td>
                      <td className="px-4 py-3">
                        {row.acceptedPerApplicantPercent === null
                          ? "N/A (no applicants)"
                          : row.acceptedPerApplicantPercent.toFixed(2) + "%"}
                      </td>
                      <td className="px-4 py-3">{row.registered ?? "Unknown"}</td>
                      <td className="px-4 py-3">{row.registeredPlaced ?? "Unknown"}</td>
                      <td className="px-4 py-3">
                        {row.placedPerRegisteredPercent === null
                          ? "Unknown / N/A"
                          : row.placedPerRegisteredPercent.toFixed(2) + "%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
