import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportNavigation,
  ReportTable,
  reportNumber,
  reportPercent,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementLeadsReport } from "@/modules/placements/report-extra-service";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoLeadsReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const collegeId = context.membership.collegeId;

  // The workspace supplies the existing report navigation
  // and authenticates the selected college.
  const [workspace, result] = await Promise.all([
    getPlacementReportWorkspace(context, {
      collegeId,
      seasonId: first(query.seasonId) || undefined,
      jobId: first(query.jobId) || undefined,
    }),
    getPlacementLeadsReport(context, collegeId),
  ]);

  const { leads, health } = result;

  const metrics = [
    ["Recruiter leads", leads.totals.leads],
    ["Invites sent", leads.totals.invited],
    ["Invite clicks", leads.totals.inviteClicked],
    [
      "Linked recruiter accounts",
      leads.totals.recruiterAccountsLinked,
    ],
    [
      "Linked company relationships",
      leads.totals.companyRelationshipsLinked,
    ],
  ] as const;

  const reportRows = (
    rows: typeof leads.byStage,
  ) =>
    rows.map((row) => [
      row.label,
      row.leads,
      row.invited,
      row.inviteClicked,
      row.recruiterAccountsLinked,
      row.companyRelationshipsLinked,
      reportPercent(row.recruiterLinkRatePercent),
    ]);

  return (
    <div data-tpo-presentation-report className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Recruiter leads"
        description="College-wide CRM lead stages, recorded acquisition sources and observable invitation/account-linkage conversion signals."
        actions={
          <ReportCsvLink
            workspace={workspace}
            kind="leads"
          />
        }
      />

      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/leads" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <nav aria-label="Recruiter engagement cross-check" className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
       <p className="min-w-0 flex-1 text-sm text-body">This report uses recorded Engage recruiter leads and their invitation/account-linkage history. Compare the same lead records in Engage; an unrecorded contact is not counted as engagement.</p>
       <Link href="/tpo/recruiters" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Open Engage →</Link>
       <Link href="/tpo/companies" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Company memory →</Link>
      </nav>


      <section aria-label="Recruiter engagement by company" className="space-y-3">
       <h2 className="text-lg font-semibold">Recruiter engagement by company</h2>
       <p className="text-sm text-body">Contacts, invitations and joined recruiter accounts use college-wide Engage records. Recorded drives and students placed use the selected placement season or drive. A company without matching recorded drives shows zero for that selected scope; a recorded drive is not proof it ran.</p>
       <a href={"/api/placements/tpo/reports/engagement?"+new URLSearchParams({
        ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
        ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{}),
       }).toString()} className="inline-flex min-h-10 items-center rounded border border-border px-4 text-sm font-semibold text-primary-text">Export company engagement CSV</a>
       <ReportTable title="Engage and placement outcomes by company"
        headings={["Company","Contacts","Invited","Joined","Drives that ran","Students placed"]}
        rows={result.companyEngagement.map(row=>{
         const placement=row.companyId?workspace.report.byCompany.find(company=>company.companyId===row.companyId):null;
         return [row.companyName,row.contacts,row.invited,row.joined,placement?.drives??0,placement?.placed??0];
        })}
        emptyDescription="No college-linked recruiter leads are recorded. Contact, invitation and placement counts are not inferred."/>
      </section>

      <section
        aria-label="Lead reporting scope"
        className="rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-body"
      >
        <p className="font-semibold text-foreground">
          Reporting methodology
        </p>
        <p className="mt-1">{result.leadScopeNote}</p>
      </section>

      <section
        aria-label="Lead conversion metrics"
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
              {reportNumber(value)}
            </p>
          </div>
        ))}

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-body">
            Recruiter account linkage rate
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
            {reportPercent(
              leads.totals.recruiterLinkRatePercent,
            )}
          </p>
        </div>
      </section>

      <section aria-label="Outreach health" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Outreach health · last 14 days</h2>
        <p className="text-sm text-body">
          Only recorded calls, email, WhatsApp and meetings count as contact.
          Paused, unsubscribed and linked recruiter accounts are excluded.
          Missing contact evidence is not classified as quiet.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["Actionable leads", health.actionableLeads],
            ["Contacted in 14 days", health.contactedLast14Days],
            ["Gone quiet", health.goneQuiet14Days],
            ["No contact evidence", health.noContactEvidence],
            ["Due follow-ups", health.dueFollowups],
            ["No next step", health.noNextStep],
            ["Unassigned", health.unassigned],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase text-body">{label}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{reportNumber(value)}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-body">
          Recent contact rate: {reportPercent(health.recentContactRatePercent)} ·
          Latest observed contact: {health.lastContactAt
            ? new Date(health.lastContactAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : "Not recorded"}
        </p>
      </section>

      <ReportBarChart title="Recruiter leads by manual stage" units="leads"
       rows={leads.byStage.map(row=>({label:row.label,value:row.leads}))}/>
      <ReportTable
        title="Leads by manual stage"
        headings={[
          "Stage",
          "Leads",
          "Invited",
          "Invite clicked",
          "Recruiter accounts linked",
          "Company relationships linked",
          "Account linkage rate",
        ]}
        rows={reportRows(leads.byStage)}
        emptyDescription="No persisted recruiter leads are available for this college."
      />

      <ReportTable
        title="Leads by acquisition source"
        headings={[
          "Source",
          "Leads",
          "Invited",
          "Invite clicked",
          "Recruiter accounts linked",
          "Company relationships linked",
          "Account linkage rate",
        ]}
        rows={reportRows(leads.bySource)}
        emptyDescription="No recorded lead sources are available for this college."
      />
    </div>
  );
}
