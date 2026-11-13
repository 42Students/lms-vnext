import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportFilters,
  ReportScopeNote,
  ReportNavigation,
  ReportTable,
  reportCurrency,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPerformanceIntelligence } from "@/modules/placements/tpo-intelligence-service";
import { tpoIntelligenceFiltersSchema } from "@/modules/placements/tpo-intelligence-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
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
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) redirect("/dashboard");
  const params = await searchParams;
  if(tpoReportHasAmbiguousFilters(params))return <TpoReportInvalidFilters path="/tpo/reports/intelligence"/>;
  const parsed = tpoIntelligenceFiltersSchema.safeParse({
    ...(first(params.seasonId) ? { seasonId: first(params.seasonId) } : {}),
    ...(first(params.jobId) ? { jobId: first(params.jobId) } : {}),
  });
  if (!parsed.success) {
    return (
      <div className="space-y-4">
        <PageHeader title="Company funnel and compensation"
          description="The selected reporting filters were invalid." />
        <Alert tone="error">
          No reports were loaded. <TextLink href="/tpo/reports/intelligence"
            className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>
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
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Company funnel and compensation"
        description="Observed applications and offer decisions by employer, plus explicitly defined annual CTC measures."
        actions={
          <ButtonLink variant="primary" href={csvHref}
            className="w-full sm:w-auto">
            Export intelligence CSV
          </ButtonLink>
        }
      />
      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/intelligence" />
      <ReportScopeNote note={workspace.registrationScopeNote} />
      {workspace.noSeason ? (
        <EmptyState title="No placement season exists." description="No company funnel or package performance is inferred."
          action={<ButtonLink variant="secondary" href="/tpo/settings/season">Review placement seasons</ButtonLink>}/>
      ) : null}
      <section aria-label="Company funnel">
        <Heading level={2} size="lg" className="mb-2 leading-[1.4] text-[var(--lms-heading)]">Company funnel</Heading>
        <p className="mb-4 text-sm text-body leading-[1.6]">
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
        <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Compensation intelligence</Heading>
        <p className="text-sm text-body leading-[1.6]">
          Only current ACCEPTED, FULL_TIME offers qualify. Offer-based measures
          count offer versions; best-per-learner measures retain each learner&apos;s
          highest accepted full-time CTC. Unknown packages are excluded from
          averages, not treated as zero.
        </p>
        <Disclosure title="Compensation metrics" className="border-y border-border py-3">
          <div className="pt-3 grid min-w-0 grid-cols-1 md:grid-cols-2 gap-3 lg:grid-cols-3">
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
            <div key={name} className="min-w-0 border-b border-border py-3">
              <Heading level={3} size="xs" className="text-muted-foreground">{name}</Heading>
              <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>
        </Disclosure>
        <ReportTable
          title="Accepted full-time offer CTC distribution"
          headings={["Annual CTC band", "Offer versions"]}
          rows={compensation.bands.map((band) => [band.label, band.offers])}
          emptyDescription="No accepted full-time offer with a known package is available."
        />
      </section>
      <p className="text-xs text-muted-foreground leading-[1.6]">
        Current branch attribution and accepted-offer status may change over time.
        This page does not claim placement-time historical cohorts, external offers
        or a regulatory accreditation placement rate.
      </p>
    </div>
  );
}
