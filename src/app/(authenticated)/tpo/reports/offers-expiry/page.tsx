import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoOfferExpiryWatchlist } from "@/modules/placements/tpo-offer-expiry-service";
type Query = { days?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function TpoOffersExpiryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/offers-expiry"/>;
  const data = await getTpoOfferExpiryWatchlist(context,
    first(query.days) === undefined ? {} : { days: first(query.days) });
  return (
    <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/offers-expiry" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <PageHeader eyebrow="TPO · Offers" title="Offer expiry watchlist"
        description="Currently issued offers expiring in an IST calendar-day window. No speculative expiry dates."
        actions={process.env.DB09_TPO_API_READY === "DB09_VERIFIED" ? <a href={"/api/placements/tpo/offers/expiry?days=" + data.days}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary">
          Export CSV
        </a> : null}
      />
      {process.env.DB09_TPO_API_READY !== "DB09_VERIFIED" ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body">
          CSV export is unavailable until the DB09 verification gate is enabled.
        </p>
      ) : null}
      <Link href="/tpo/reports" className="text-sm font-semibold text-link hover:underline">
        ← Reports
      </Link>
      <form action="/tpo/reports/offers-expiry" method="get"
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="text-sm font-semibold text-body">Expiring in the next N calendar days
          <Select name="days" defaultValue={String(data.days)}
            className="mt-2 block min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            {[1, 3, 7, 14, 30, 60, 90].map((value) =>
              <option key={value} value={value}>{value} days</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 font-[650] text-on-primary">
          Apply window
        </Button>
      </form>
      <p className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
        {data.scopeNote} Window: {data.asOfIst} through {data.throughIst} (IST, inclusive).
      </p>
      {data.truncated ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm font-semibold text-body">
          More than 200 offers match this date window; only the earliest 200 are shown and exported.
        </p>
      ) : null}
      {data.rows.length === 0 ? (
        <EmptyState title="No issued offers approaching expiry"
          description="There are no currently issued offers with recorded expiry dates in this selected IST window." />
      ) : (
        <section aria-label="Expiring offer records" className="grid gap-3">
          {data.rows.map((row) => (
            <article key={row.offerId} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">
                    {row.companyName} · {row.roleTitle}
                  </h2>
                  <p className="mt-1 text-sm text-body">
                    {row.jobTitle} · {row.candidateName ?? "Student name not recorded"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-link">
                    Expires on {row.expiryDayIst} IST
                  </p>
                </div>
                <Link href={"/tpo/placements/jobs/" + row.jobId}
                  className="inline-flex min-h-11 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:underline">
                  Open drive
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
