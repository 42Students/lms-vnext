import { SummaryStrip } from "@/components/ui/summary-strip";
import { Tabs } from "@/components/ui/tabs";
import { MetricBar } from "@/components/ui/metric-bar";
import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
import { HrCompanyReportsGrid } from "@/components/hr/hr-company-reports-grid";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

import {
  hasActiveRecruiter,
} from "@/modules/identity/context";
import {
  recruiterCompanyReportsHref,
  recruiterCompanyReportsQuerySchema,
} from "@/modules/placements/recruiter-company-reports-model";
import {
  getRecruiterCompanyReports,
} from "@/modules/placements/recruiter-company-reports-service";
import {buildRecruiterReportFunnel} from "@/modules/placements/recruiter-company-funnel-model";
import {hrCompanyReportPageSignals} from "@/modules/placements/hr-report-page-signals-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { istDateFormatter } from "@/lib/format-date";

type SearchParams = {
  collegeId?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function formatDate(value: Date | null) {
  if (!value) return "Not recorded";

  return istDateFormatter.format(value);
}

export default async function RecruiterCompanyReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id) {
    redirect("/dashboard");
  }

  const raw = await searchParams;

  const parsed =
    recruiterCompanyReportsQuerySchema.safeParse({
      collegeId: raw.collegeId || undefined,
      status: raw.status || undefined,
      page: raw.page || undefined,
      pageSize: raw.pageSize || undefined,
    });

  if (!parsed.success) {
    return (
      <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
        <PageHeader
          title="Company & Team"
          description="Read-only, college-scoped employer hiring metrics."
        />

        <ErrorState
          title="Invalid report filters"
          description="Check the selected college, drive status and page values. No report data was loaded."
          action={
            <ButtonLink variant="secondary"
              href="/hr/company/reports"
            >
              Clear filters
            </ButtonLink>
          }
        />
      </div>
    );
  }

  let report:Awaited<ReturnType<typeof getRecruiterCompanyReports>>;
  try{
    report=await getRecruiterCompanyReports(context,parsed.data);
  }catch{
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="Company & Team" description="Reports"/>
      <ErrorState title="Could not load reports"
        description="The report data could not be loaded for this recruiter account and college. No incomplete totals are shown."
        action={<ButtonLink variant="secondary" href="/hr/company/reports">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M20 11a8 8 0 1 0-2 5.5M20 4v7h-7"/>
          </svg>
          Retry reports
        </ButtonLink>}/>
    </div>;
  }

  if (report.status !== "READY") {
    return (
      <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
        <PageHeader
          title="Company & Team"
          description="Choose one college to view your employer's authorized hiring reports. Reports from different college relationships are never combined."
        />

        {report.status === "NO_ACCESS" ? (
          <EmptyState
            title="No active college access"
            description="Your recruiter account has no active college relationship available for reporting."
          />
        ) : (
          <section className="border-b border-border pb-6">
            <Heading level={2} className="text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">
              Choose a college
            </Heading>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {report.choices.map((grant) => (
                <TextLink variant="bare"
                  key={grant.id}
                  href={recruiterCompanyReportsHref({
                    collegeId: grant.collegeId,
                  })}
                  className="block min-h-11 border-b border-border py-3 hover:bg-[var(--lms-table-hover)] focus-ring"
                >
                  <span className="font-semibold text-link">
                    {grant.collegeName}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    View this college&apos;s report →
                  </span>
                </TextLink>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const collegeId = report.grant.collegeId;
  const companyBase =
    "/hr/company?collegeId=" +
    encodeURIComponent(collegeId);

  const {
    query,
    summary,
    matchedTotal,
    jobs,
    page,
    pageSize,
    totalPages,
  } = report;

  const firstItem =
    matchedTotal === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastItem = Math.min(
    matchedTotal,
    page * pageSize,
  );

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Company & Team"
        description={`${report.company.name} · ${report.grant.collegeName}. Read-only hiring activity for this exact authorized company-college relationship.`}
        actions={<div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-4 max-md:flex-col max-md:items-stretch">
          <TextLink href={"/api/placements/recruiter/reports/export?collegeId="+encodeURIComponent(collegeId)+"&status="+query.status}
            className="inline-flex min-h-11 items-center text-sm md:min-h-9">
            Export report CSV
          </TextLink>
          <TextLink href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)} className="inline-flex min-h-11 items-center text-sm text-body md:min-h-9">
            Drives →
          </TextLink>
        </div>}
      />

      {report.choices.length > 1 ? <NeedsDoingChips label="College:"
        selectedKey={collegeId}
        items={report.choices.map(grant=>({
          key:grant.collegeId,label:grant.collegeName,
          href:recruiterCompanyReportsHref({collegeId:grant.collegeId}),
        }))}/> : null}

      <Tabs renderPanel={false} ariaLabel="Company sections" value="reports"
        items={[{value:"company",label:"Company",href:`${companyBase}&tab=company`},
          {value:"team",label:"Team",href:`${companyBase}&tab=team`},
          {value:"reports",label:"Reports",href:recruiterCompanyReportsHref({collegeId})}]}/>

      <SummaryStrip label="Hiring portfolio summary" steps={[
        {label:"Visible hiring drives",value:summary.total},
        {label:"Published drives",value:summary.published},
        {label:"Closed drives",value:summary.closed},
      ]} />

      <section aria-label="All your drives at this college" className="border-b border-border pb-4 md:pb-6">
        <Heading level={2} className="text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">All your drives at this college</Heading>
        <p className="mt-1 text-sm text-body">Hiring progress of applicants already shared by the placement cell, across all your authorized drives. Private applications are not counted.</p>
        <div className="mt-4 space-y-3">
          {buildRecruiterReportFunnel(report.funnel)
            .filter(stage=>!(stage.label.toLowerCase().includes("assessment")&&stage.total===0))
            .map(stage=><div key={stage.label}
            className={funnelStyles["row"]}>
            <span className={funnelStyles["label"]}>{stage.label}</span>
            <MetricBar label={stage.label+" hiring funnel"}
              value={stage.appliedPercent} maximum={100} unit="percent" />
            <span className={funnelStyles["num"]}>{stage.total} · {stage.previousPercentLabel} of previous</span>
          </div>)}
        </div>
      </section>

      <Disclosure title="Drive report filters" defaultOpen={query.status !== "ALL" || pageSize !== 25} className="min-w-0">

        <form
          method="get"
          action="/hr/company/reports"
          className="mt-4 flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end"
        >
          <Input
            type="hidden"
            name="collegeId"
            value={collegeId}
          />

          <Label stack className="w-full min-w-0 md:w-auto md:min-w-44">
            Drive status
            <Select
              name="status"
              defaultValue={query.status}
              className="w-full"
            >
              <option value="ALL">
                All visible drives
              </option>
              <option value="PUBLISHED">
                Published
              </option>
              <option value="CLOSED">
                Closed
              </option>
            </Select>
          </Label>

          <Label stack className="w-full min-w-0 md:w-auto md:min-w-32">
            Rows per page
            <Select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="w-full"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
          </Label>

          <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply filters</Button>

          <TextLink
            href={recruiterCompanyReportsHref({
              collegeId,
            })}
            className="inline-flex min-h-11 w-full items-center justify-center text-sm text-body md:min-h-9 md:w-auto"
          >
            Clear filters
          </TextLink>
        </form>
      </Disclosure>

      <Disclosure title="Current page hiring totals" className="min-w-0">
        <p className="mt-1 text-xs text-muted-foreground">
          Totals cover only the visible authorized drive rows on this page, not every company drive.
          Outstanding means currently issued offers; these counts may represent multiple offer versions.
        </p>
        <SummaryStrip label="Current page hiring totals" className="mt-3"
          steps={Object.entries(hrCompanyReportPageSignals(jobs)).map(([label,value])=>({
            label,value,
          }))}/>
      </Disclosure>

      <section className="min-w-0 space-y-3">
        <div>
          <Heading level={2} className="text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">
            Hiring activity by drive
          </Heading>

          <p className="mt-1 text-sm text-body">
            {matchedTotal === 0
              ? "No matching hiring drives"
              : firstItem > matchedTotal
                ? `Page ${page} is beyond the available drives`
                : `Showing ${firstItem}–${lastItem} of ${matchedTotal} drives`}
          </p>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            title={query.status==="ALL"&&summary.total===0?"Reports":"No matching drives"}
            description={query.status==="ALL"&&summary.total===0
              ?"Reports appear once you have a drive with applicants."
              :"No matching drives for these filters. Review the college or clear the selected drive status."}
            action={query.status !== "ALL" ? <TextLink href={recruiterCompanyReportsHref({collegeId})}
              className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink> : undefined}
          />
        ) : (
          <HrCompanyReportsGrid
            scopeKey={[context.user.id,collegeId].join(":")}
            rows={jobs.map(job=>({
              id:job.id,title:job.title,employmentType:job.employmentType,
              status:job.status,published:formatDate(job.publishedAt),
              applications:job.applications,submittedApplications:job.submittedApplications,
              withdrawnApplications:job.withdrawnApplications,
              outstandingOffers:job.outstandingOffers,acceptedOffers:job.acceptedOffers,
              declinedOffers:job.declinedOffers,joinedOffers:job.joinedOffers,
            }))}
          />
        )}

        {totalPages>1 ? <nav
          aria-label="Company reports pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-body">
            Page {page} of {Math.max(1, totalPages)}
          </p>

          <div className="flex flex-wrap gap-2">
            {page > 1 ? (
              <ButtonLink variant="secondary"
                href={recruiterCompanyReportsHref({
                  collegeId,
                  status: query.status,
                  pageSize,
                  page: page - 1,
                })}
              >
                Previous
              </ButtonLink>
            ) : null}

            {page < totalPages ? (
              <ButtonLink variant="secondary"
                href={recruiterCompanyReportsHref({
                  collegeId,
                  status: query.status,
                  pageSize,
                  page: page + 1,
                })}
              >
                Next
              </ButtonLink>
            ) : null}
          </div>
        </nav> : null}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        This report counts persisted application records, not
        distinct candidates. Submitted and withdrawn are current
        application statuses. Outstanding and accepted offers
        count offer records with current ISSUED and ACCEPTED
        statuses, respectively; joined counts only explicit JOINED evidence on ACCEPTED offers. These counts do not represent lifetime offer history. Only PUBLISHED and
        CLOSED drives authorized for this exact employer-college
        relationship are included. No candidate contact details,
        report exports, external offers or confidential TPO data
        are retrieved.
      </p>
    </div>
  );
}
