import { SummaryStrip } from "@/components/ui/summary-strip";
import { Tabs } from "@/components/ui/tabs";
import { MetricBar } from "@/components/ui/metric-bar";
import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
import { HrCompanyReportsGrid } from "@/components/hr/hr-company-reports-grid";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

type SearchParams = {
  collegeId?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function formatDate(value: Date | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(value);
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
      <div className="min-w-0 max-w-full space-y-6">
        <PageHeader
          title="Company Reports"
          description="Read-only, college-scoped employer hiring metrics."
        />

        <ErrorState
          title="Invalid report filters"
          description="Check the selected college, drive status and page values. No report data was loaded."
          action={
            <Link
              href="/hr/company/reports"
              className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const report = await getRecruiterCompanyReports(
    context,
    parsed.data,
  );

  if (report.status !== "READY") {
    return (
      <div className="min-w-0 max-w-full space-y-6">
        <PageHeader
          title="Company Reports"
          description="Choose one college to view your employer's authorized hiring reports. Reports from different college relationships are never combined."
        />

        {report.status === "NO_ACCESS" ? (
          <EmptyState
            title="No active college access"
            description="Your recruiter account has no active college relationship available for reporting."
          />
        ) : (
          <section className="border-b border-border pb-5">
            <h2 className="text-lg font-semibold text-foreground">
              Choose a college
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {report.choices.map((grant) => (
                <Link
                  key={grant.id}
                  href={recruiterCompanyReportsHref({
                    collegeId: grant.collegeId,
                  })}
                  className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                >
                  <span className="font-semibold text-link">
                    {grant.collegeName}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    View this college&apos;s report →
                  </span>
                </Link>
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
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Company Reports"
        description={`${report.company.name} · ${report.grant.collegeName}. Read-only hiring activity for this exact authorized company-college relationship.`}
        actions={<div className="flex flex-wrap gap-2">
          <Link href={"/api/placements/recruiter/reports/export?collegeId="+encodeURIComponent(collegeId)+"&status="+query.status}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            Export report CSV
          </Link>
          <Link href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            Drives →
          </Link>
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

      <section aria-label="All your drives at this college" className="border-b border-border pb-4 md:pb-5">
        <h2 className="font-semibold text-foreground">All your drives at this college</h2>
        <p className="mt-1 text-sm text-body">Hiring progress of applicants already shared by the placement cell, across all your authorized drives. Private applications are not counted.</p>
        <div className="mt-4 space-y-3">
          {buildRecruiterReportFunnel(report.funnel).map(stage=><div key={stage.label}
            className={funnelStyles.row}>
            <span className={funnelStyles.label}>{stage.label}</span>
            <MetricBar label={stage.label+" hiring funnel"}
              value={stage.appliedPercent} maximum={100} unit="percent" />
            <span className={funnelStyles.num}>{stage.total} · {stage.previousPercentLabel} of previous</span>
          </div>)}
        </div>
      </section>

      <section className="border-b border-border pb-4 md:pb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Drive report filters
        </h2>

        <form
          method="get"
          action="/hr/company/reports"
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <Input
            type="hidden"
            name="collegeId"
            value={collegeId}
          />

          <label className="grid w-full min-w-0 gap-1 text-sm font-semibold text-body md:w-auto md:min-w-44">
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
          </label>

          <label className="grid w-full min-w-0 gap-1 text-sm font-semibold text-body md:w-auto md:min-w-32">
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
          </label>

          <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply filters</Button>

          <Link
            href={recruiterCompanyReportsHref({
              collegeId,
            })}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:w-auto"
          >
            Clear filters
          </Link>
        </form>
      </section>

      <section className="border-b border-border pb-4 md:pb-5">
        <h2 className="font-semibold text-foreground">Current page hiring totals</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Totals cover only the visible authorized drive rows on this page, not every company drive.
          Outstanding means currently issued offers; these counts may represent multiple offer versions.
        </p>
        <SummaryStrip label="Current page hiring totals" className="mt-3"
          steps={Object.entries(hrCompanyReportPageSignals(jobs)).map(([label,value])=>({
            label,value,
          }))}/>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Hiring activity by drive
          </h2>

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
            title="No matching drives"
            description="Reports appear once you have a drive with applicants. If you expected a report, review the selected college and filters."
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

        <nav
          aria-label="Company reports pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-body">
            Page {page} of {Math.max(1, totalPages)}
          </p>

          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={recruiterCompanyReportsHref({
                  collegeId,
                  status: query.status,
                  pageSize,
                  page: page - 1,
                })}
                className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
              >
                Previous
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={recruiterCompanyReportsHref({
                  collegeId,
                  status: query.status,
                  pageSize,
                  page: page + 1,
                })}
                className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
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
