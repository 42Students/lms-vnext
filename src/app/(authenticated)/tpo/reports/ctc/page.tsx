import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
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
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoCtcReportPage({
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

  const ctc = workspace.details.ctc;

  const metrics = [
    ["Students with a package", reportNumber(workspace.report.metrics.studentsWithPackage??0)],
    ["Highest (best student offer)", reportCurrency(workspace.report.metrics.highestPackageInr)],
    ["Median (best student offer)", reportCurrency(workspace.report.metrics.medianPackageInr)],
    ["Average (best student offer)", reportCurrency(workspace.report.metrics.averagePackageInr)],
    ["Accepted full-time offers", reportNumber(ctc.acceptedFullTimeOffers)],
    ["Offers with known CTC", reportNumber(ctc.knownCtcOffers)],
    ["Average annual CTC", reportCurrency(ctc.averageInr)],
    ["Median annual CTC", reportCurrency(ctc.medianInr)],
    ["Highest annual CTC", reportCurrency(ctc.highestInr)],
    ["Offers without CTC", reportNumber(ctc.unknownCtcOffers)],
  ];

  return (
    <div data-tpo-presentation-report className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Packages"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/ctc"].description}
        actions={<ReportCsvLink workspace={workspace} kind="ctc" />}
      />

      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/ctc" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/ctc" />

      <section
        aria-label="Compensation metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs font-semibold uppercase text-body">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      <ReportScopeNote note={workspace.detailScopeNote} />
      <ReportBarChart title="Accepted full-time offers by annual package band" units="offers"
       rows={ctc.bands.map(band=>({label:band.label,value:band.offers}))}/>

      <p className="text-sm leading-6 text-body">
        This histogram counts accepted full-time <strong>offer records</strong>.
        A learner with two accepted full-time offers contributes twice.
        The Placement Summary&apos;s package metrics instead use the best
        accepted full-time offer per learner. These are distinct measures.
      </p>

      <ReportTable
        title="Annual CTC distribution"
        headings={["Annual CTC range", "Accepted full-time offers"]}
        rows={ctc.bands.map((band) => [
          band.label,
          band.offers,
        ])}
        emptyDescription="No compensation distribution is available."
      />
    </div>
  );
}
