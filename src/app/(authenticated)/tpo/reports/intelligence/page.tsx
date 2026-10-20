import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import {
  ReportFilters,
  ReportScopeNote,
  ReportNavigation,
  ReportTable,
  reportCurrency,
  reportHref,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPerformanceIntelligence } from "@/modules/placements/tpo-intelligence-service";
import { tpoIntelligenceFiltersSchema } from "@/modules/placements/tpo-intelligence-model";

type SearchParams = { seasonId?: string | string[]; jobId?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function valueOrUnknown(value: number | null) {
  return value === null ? "—" : String(value);
}

export default async function TpoPerformanceIntelligencePage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const params = await searchParams;
  if(tpoReportHasAmbiguousFilters(params))return <TpoReportInvalidFilters path="/tpo/reports/intelligence"/>;
  const parsed = tpoIntelligenceFiltersSchema.safeParse({
    ...(first(params.seasonId) ? { seasonId: first(params.seasonId) } : {}),
    ...(first(params.jobId) ? { jobId: first(params.jobId) } : {}),
  });
  if (!parsed.success) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="TPO · Reports" title="Company funnel and compensation"
          description="The selected reporting filters were invalid." />
        <Alert tone="error">
          No reports were loaded. <Link href="/tpo/reports/intelligence"
            className="font-semibold text-link hover:underline">Clear filters</Link>
        </Alert>
      </div>
    );
  }
  const data = await getTpoPerformanceIntelligence(context, parsed.data);
  const { workspace, companies, compensation } = data;
  const paramsCsv = new URLSearchParams();
  if (workspace.selectedSeasonId) paramsCsv.set("seasonId", workspace.selectedSeasonId);
  if (workspace.selectedJobId) paramsCsv.set("jobId", workspace.selectedJobId);
  const csvHref = "/api/placements/tpo/reports/intelligence/export" +
    (paramsCsv.size ? "?" + paramsCsv.toString() : "");

  return (
    <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/intelligence" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <PageHeader
        eyebrow="TPO · Reports"
        title="Company funnel and compensation"
        description="Observed applications and offer decisions by employer, plus explicitly defined annual CTC measures."
        actions={
          <a href={csvHref}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary">
            Export intelligence CSV
          </a>
        }
      />
      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/intelligence" />
      <ReportScopeNote note={workspace.registrationScopeNote} />
      {workspace.noSeason ? (
        <EmptyState title="No placement season exists." description="No company funnel or package performance is inferred."/>
      ) : null}
      <section aria-label="Company funnel">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Company funnel</h2>
        <p className="mb-4 text-sm leading-6 text-body">
          Applicant denominator = distinct learners with SUBMITTED applications to
          this company in the selected season and drive scope. Numerator = distinct
          learners holding an ACCEPTED offer for this company. Rate is unknown when
          there are zero such applicants. Released and accepted columns count offer
          versions, not learners. This is not a time-frozen conversion cohort.
        </p>
        <ReportTable
          title="Persisted company performance"
          headings={[
            "Company", "Drives", "Distinct submitted applicants",
            "Submitted applications", "Offer versions", "Accepted versions",
            "Distinct accepted learners", "Accepted learners / applicants",
          ]}
          rows={companies.map((item) => [
            item.companyName, item.drives, item.applicants,
            item.submittedApplications, item.releasedOfferVersions,
            item.acceptedOfferVersions, item.uniqueAcceptedLearners,
            item.applicantToAcceptedPercent === null
              ? "— (no applicants)"
              : String(item.applicantToAcceptedPercent) + "%",
          ])}
          emptyDescription="No company placement records exist in this reporting scope."
        />
      </section>
      <section aria-label="Compensation intelligence" className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Compensation intelligence</h2>
        <p className="text-sm leading-6 text-body">
          Only current ACCEPTED, FULL_TIME offers qualify. Offer-based measures
          count offer versions; best-per-learner measures retain each learner&apos;s
          highest accepted full-time CTC. Unknown packages are excluded from
          averages, not treated as zero.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["Accepted full-time offer versions", compensation.acceptedFullTimeOfferVersions],
            ["Versions with known CTC", compensation.knownPackageOfferVersions],
            ["Versions without recorded CTC", compensation.missingPackageOfferVersions],
            ["Known CTC coverage (%)", valueOrUnknown(compensation.knownPackageCoveragePercent)],
            ["Offer average annual CTC", reportCurrency(compensation.offerAverageInr)],
            ["Offer median annual CTC", reportCurrency(compensation.offerMedianInr)],
            ["Best-per-learner average annual CTC", reportCurrency(compensation.uniqueLearnerBestAverageInr)],
            ["Best-per-learner median annual CTC", reportCurrency(compensation.uniqueLearnerBestMedianInr)],
            ["Best-per-learner highest annual CTC", reportCurrency(compensation.uniqueLearnerBestHighestInr)],
          ] as const).map(([name, value]) => (
            <StatTile key={name} label={name} value={value} className="min-h-[104px]" />
          ))}
        </div>
        <ReportTable
          title="Accepted full-time offer CTC distribution"
          headings={["Annual CTC band", "Offer versions"]}
          rows={compensation.bands.map((band) => [band.label, band.offers])}
          emptyDescription="No accepted full-time offer with a known package is available."
        />
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
        Current branch attribution and accepted-offer status may change over time.
        This page does not claim placement-time historical cohorts, external offers
        or a regulatory accreditation placement rate.
      </p>
    </div>
  );
}
