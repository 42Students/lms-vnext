import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import {Disclosure} from "@/components/ui/disclosure";
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
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/ctc"/>;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const ctc = workspace.details.ctc;
  // The report model currently aggregates 0–3/3–6 LPA; those counts cannot
  // be accurately split into legacy <4 and 4–6 without individual INR offers.
  const legacyBoundaryStarts=[0,400_000,600_000,1_000_000,2_000_000];
  const legacyBandParity=ctc.bands.length===legacyBoundaryStarts.length &&
    ctc.bands.every((band,index)=>band.minimumInr===legacyBoundaryStarts[index] &&
      band.maximumExclusiveInr===(legacyBoundaryStarts[index+1]??null));

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
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        title="Packages"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/ctc"].description}
        actions={<ReportCsvLink workspace={workspace} kind="ctc" />}
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/ctc" />

      <section
        aria-label="Compensation metrics"
        className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {metrics.slice(0,4).map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 border-b border-border py-4"
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

      <Disclosure title="Additional compensation metrics" className="border-b border-border pb-3">
        <div className="grid min-w-0 grid-cols-2 gap-3 pt-3 lg:grid-cols-3">
          {metrics.slice(4).map(([label,value])=><div key={label} className="min-w-0 border-b border-border py-3">
            <p className="text-xs font-semibold uppercase text-body">{label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{value}</p>
          </div>)}
        </div>
      </Disclosure>
      <ReportScopeNote note={workspace.detailScopeNote} />
      {!legacyBandParity?<p role="status" className="text-sm text-warning-text">
        These package totals use the current persisted reporting bands. The historical below 4,
        4–6, 6–10, 10–20 and 20+ LPA bands require regrouping the original annual INR
        offers; the existing aggregated 3–6 LPA count cannot be split reliably.
      </p>:null}
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
