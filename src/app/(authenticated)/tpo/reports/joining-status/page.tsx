import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoReportRecordLinks } from "@/components/placements/tpo-report-record-links";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Disclosure } from "@/components/ui/disclosure";
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
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
import { first } from "@/lib/shared";
type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

export default async function TpoJoiningStatusReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/joining-status"/>;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const { totals, byDrive, byCompany } = workspace.details.joining;

  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Joining outcomes"
        description="Recorded joining results for currently accepted offers. Company figures count each learner once; drive figures count accepted offers."
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <TextLink href="/tpo/reports/joining-followups" className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">Review joining follow-ups →</TextLink>
          <ReportCsvLink workspace={workspace} kind="joining-status" />
        </div>}
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/joining-status"
      />

      <section
        aria-label="Joining outcome totals"
        className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5"
      >
        {[
          ["Accepted offers", totals.accepted],
          ["Joined", totals.joined],
          ["Deferred", totals.deferred],
          ["Did not join", totals.didNotJoin],
          ["Pending / unrecorded", totals.pending],
        ].map(([label, value]) => (
          <StatTile key={label} label={String(label)} value={reportNumber(Number(value))} className="min-h-[104px]" />
        ))}
      </section>

      <ReportScopeNote note={workspace.detailScopeNote} />
      <ReportBarChart title="Joined by company" units="distinct joined learners"
       rows={byCompany.map(row=>({label:row.label,value:row.joined}))}/>

      <ReportTable
        title="Joining outcomes by company"
        headings={["Company","Accepted offers","Joined","Deferred","Did not join","Pending / unrecorded"]}
        rows={byCompany.map(row=>[
          row.label,row.accepted,row.joined,row.deferred,row.didNotJoin,row.pending
        ])}
        emptyDescription="No company joining outcomes match these filters."
      />
      <Disclosure title="Drive detail and source records" className="border-b border-border pb-3">
        <div className="min-w-0 space-y-4 pt-3">
          <ReportTable title="Joining outcomes by drive"
            headings={["Drive","Company","Accepted offers","Joined","Deferred","Did not join","Pending / unrecorded"]}
            rows={byDrive.map(row=>[
              row.label,row.companyName,row.accepted,row.joined,row.deferred,row.didNotJoin,row.pending
            ])}
            emptyDescription="No currently accepted offers have joining outcomes in this reporting scope."
          />
          <TpoReportRecordLinks kind="JOINING" drives={byDrive} companies={byCompany} />
        </div>
      </Disclosure>

    </div>
  );
}
