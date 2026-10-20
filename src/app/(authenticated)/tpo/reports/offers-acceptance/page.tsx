import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoReportRecordLinks } from "@/components/placements/tpo-report-record-links";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
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

export default async function TpoOffersAcceptanceReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/offers-acceptance"/>;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const { totals, byDrive, byCompany } = workspace.details.offers;
  const acceptanceRate=(accepted:number,declined:number)=>{
   const answered=accepted+declined;
   return answered>0?Math.round(accepted/answered*100)+"%":"—";
  };

  return (
    <div data-tpo-presentation-report className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Offers and acceptance"
        description="Persisted offers by current status, company and drive. Expired outstanding offers are identified from their stored expiry dates."
        actions={
          <ReportCsvLink workspace={workspace} kind="offers-acceptance" />
        }
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/offers-acceptance"
      />

      <section
        aria-label="Offer funnel totals"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[
          ["Released offers", totals.released],
          ["Accepted", totals.accepted],
          ["Declined", totals.declined],
          ["Withdrawn", totals.withdrawn],
          ["Outstanding", totals.outstanding],
          ["Expired outstanding", totals.expiredOutstanding],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-b border-border py-4"
          >
            <p className="text-xs font-semibold uppercase text-body">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {reportNumber(Number(value))}
            </p>
          </div>
        ))}
      </section>

      <ReportScopeNote note={workspace.detailScopeNote} />
      <ReportBarChart title="Acceptance rate by company" units="percent"
       rows={byCompany.filter(row=>row.accepted+row.declined>0)
         .map(row=>({label:row.label,value:Math.round(row.accepted/(row.accepted+row.declined)*100),
          detail:row.accepted+" accepted of "+(row.accepted+row.declined)+" answered offers"}))}/>
      <ReportBarChart title="Accepted offers by company" units="offers"
       rows={byCompany.map(row=>({label:row.label,value:row.accepted}))}/>

      <p className="text-sm leading-6 text-body">
        Outstanding and expired-outstanding are mutually exclusive subsets
        of currently ISSUED offers. Expired is derived from the recorded
        expiry timestamp, not an additional stored offer status. These
        totals count offer versions as persisted, not unique learners.
      </p>

      <ReportTable
        title="Offer funnel by drive"
        headings={[
          "Drive",
          "Company",
          "Released",
          "Accepted",
          "Declined",
          "Withdrawn",
          "Outstanding",
          "Expired outstanding",
        ]}
        rows={byDrive.map((row) => [
          row.label,
          row.companyName,
          row.released,
          row.accepted,
          row.declined,
          row.withdrawn,
          row.outstanding,
          row.expiredOutstanding,
        ])}
        emptyDescription="No persisted offers match the selected reporting scope."
      />

      <ReportTable
        title="Offer funnel by company"
        headings={[
          "Company",
          "Released",
          "Accepted",
          "Declined",
          "Withdrawn",
          "Outstanding",
          "Expired outstanding",
          "Waiting for the student",
          "Acceptance rate",
        ]}
        rows={byCompany.map((row) => [
          row.label,
          row.released,
          row.accepted,
          row.declined,
          row.withdrawn,
          row.outstanding,
          row.expiredOutstanding,
          row.outstanding,
          acceptanceRate(row.accepted,row.declined),
        ])}
        emptyDescription="No companies have recorded offers for these filters."
      />
      <p className="text-xs text-muted-foreground">Acceptance rate = accepted / (accepted + declined) among answered offers. Waiting for the student is the currently outstanding status; expired outstanding is presented separately and is not counted twice.</p>
      <TpoReportRecordLinks kind="OFFERS" drives={byDrive} companies={byCompany} />
    </div>
  );
}
