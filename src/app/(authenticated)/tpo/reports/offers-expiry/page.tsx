import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoOfferExpiryWatchlist } from "@/modules/placements/tpo-offer-expiry-service";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { featureReady } from "@/config/features";
import { ROLE } from "@/modules/identity/roles";
type Query = { days?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function TpoOffersExpiryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) redirect("/dashboard");
  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/offers-expiry"/>;
  const data = await getTpoOfferExpiryWatchlist(context,
    first(query.days) === undefined ? {} : { days: first(query.days) });
  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader eyebrow="TPO · Offers" title="Offer expiry watchlist"
        description="Currently issued offers expiring in an IST calendar-day window. No speculative expiry dates."
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><TextLink href="/tpo/reports" className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">← Reports</TextLink>{featureReady("tpoApi") ? <ButtonLink variant="primary" href={"/api/placements/tpo/offers/expiry?days=" + data.days}
          className="w-full sm:w-auto">
          Export CSV
        </ButtonLink> : null}</div>}
      />
      {!featureReady("tpoApi") ? (
        <Alert tone="warning">CSV export is unavailable until the DB09 verification gate is enabled.</Alert>
      ) : null}
      <form action="/tpo/reports/offers-expiry" method="get"
        className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Label className="block min-w-0">Expiring in the next N calendar days
          <Select name="days" defaultValue={String(data.days)}
            className="mt-2 block min-h-11 w-full md:min-h-9">
            {[1, 3, 7, 14, 30, 60, 90].map((value) =>
              <option key={value} value={value}>{value} days</option>)}
          </Select>
        </Label>
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">
          Apply window
        </Button>
      </form>
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/offers-expiry" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <p className="border-b border-[var(--lms-canvas-border)] bg-transparent py-4 text-sm text-body leading-[22px]">
        {data.scopeNote} Window: {data.asOfIst} through {data.throughIst} (IST, inclusive).
      </p>
      {data.truncated ? (
        <Alert tone="warning">More than 200 offers match this date window; only the earliest 200 are shown and exported.</Alert>
      ) : null}
      {data.rows.length === 0 ? (
        <EmptyState title="No issued offers approaching expiry"
          description="There are no currently issued offers with recorded expiry dates in this selected IST window." />
      ) : (
        <section aria-label="Expiring offer records" className="grid gap-3">
          {data.rows.map((row) => (
            <article key={row.offerId} className="min-w-0 border-b border-border py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <Heading level={2} size="lg" className="break-words leading-[1.4] text-[var(--lms-heading)]">
                    {row.companyName} · {row.roleTitle}
                  </Heading>
                  <p className="mt-1 text-sm text-body leading-[22px]">
                    {row.jobTitle} · {row.candidateName ?? "Student name not recorded"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-link leading-[22px]">
                    Expires on {row.expiryDayIst} IST
                  </p>
                </div>
                <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + row.jobId}>
                  Open drive
                </ButtonLink>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
