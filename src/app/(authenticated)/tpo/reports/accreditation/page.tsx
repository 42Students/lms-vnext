import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getPlacementAccreditationReport,
} from "@/modules/placements/report-accreditation-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoAccreditationReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const params = await searchParams;
  const report = await getPlacementAccreditationReport(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(params.seasonId) || undefined,
    jobId: first(params.jobId) || undefined,
  });

  const query = new URLSearchParams({ kind: "accreditation" });
  if (report.selectedSeasonId) {
    query.set("seasonId", report.selectedSeasonId);
  }
  if (report.selectedJobId) {
    query.set("jobId", report.selectedJobId);
  }
  const overview = report.rows.filter(
    (row) => row[0] === "Overall" || row[0] === "Branch" || row[0] === "Company",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Accreditation evidence export"
        description="Download a college-scoped working CSV of recorded placement outcomes. This is not a NAAC/NIRF-approved submission template."
        actions={
          <a
            href={"/api/placements/reports?" + query.toString()}
            className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:border-primary-hover"
          >
            Export evidence CSV
          </a>
        }
      />
      <Link
        href="/tpo/reports"
        className="text-sm font-semibold text-primary-text hover:underline"
      >
        ← All reports
      </Link>
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Reporting scope
        </h2>
        <p className="mt-2 text-sm text-body">
          {report.seasonName
            ? "Placement season: " + report.seasonName
            : "No placement season recorded. The CSV includes warnings but no invented outcome totals."}
          {report.selectedJobId
            ? " · Filtered to one authorized drive."
            : " · All non-archived drives in the selected season."}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Counts reflect currently persisted in-app applications and
          offers. Registered placement-pool and graduating-student
          denominators are not derived from unregistered tables.
        </p>
      </section>

      <section
        aria-label="Accreditation data completeness"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-lg font-semibold text-foreground">
          Completeness preflight
        </h2>
        <p className="mt-2 text-sm text-body">
          The following warnings are included in the exported CSV.
          Blank denominator/rate cells mean unavailable, not zero.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-6 text-body">
          {report.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Evidence preview
        </h2>
        {overview.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
            No reportable placement season was found. Download the
            CSV for the explicit completeness warnings.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-surface-subtle">
                <tr>
                  {[
                    "Section",
                    "Dimension",
                    "Applicants",
                    "Applications",
                    "Accepted offers",
                    "Placed learners",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="border-b border-border px-4 py-3 font-semibold text-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.slice(0, 50).map((row, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    {[row[0], row[4], row[6], row[7], row[9], row[10]].map(
                      (cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 text-body">
                          {cell ?? "—"}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {overview.length > 50 ? (
          <p className="text-xs text-muted-foreground">
            Preview limited to 50 rows. The download contains all rows.
          </p>
        ) : null}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Before using these figures for accreditation, reconcile
        graduation-year populations, external placements,
        programme attribution, reporting definitions and the
        official prescribed NAAC/NIRF column set. No statutory
        placement rate or certified completeness is asserted.
      </p>
    </div>
  );
}
