import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

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
          eyebrow="Employer Recruiter"
          title="Company Reports"
          description="Read-only, college-scoped employer hiring metrics."
        />

        <ErrorState
          title="Invalid report filters"
          description="Check the selected college, drive status and page values. No report data was loaded."
          action={
            <Link
              href="/hr/company/reports"
              className="inline-flex min-h-9 items-center rounded-[9px] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
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
          eyebrow="Employer Recruiter"
          title="Company Reports"
          description="Choose one college to view your employer's authorized hiring reports. Reports from different college relationships are never combined."
        />

        {report.status === "NO_ACCESS" ? (
          <EmptyState
            title="No active college access"
            description="Your recruiter account has no active college relationship available for reporting."
          />
        ) : (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Choose a college
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {report.choices.map((grant) => (
                <Link
                  key={grant.id}
                  href={recruiterCompanyReportsHref({
                    collegeId: grant.collegeId,
                  })}
                  className="rounded-lg border border-border bg-surface p-4 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
                >
                  <span className="font-semibold text-primary-text">
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
        eyebrow="Employer Recruiter"
        title="Company Reports"
        description={`${report.company.name} · ${report.grant.collegeName}. Read-only hiring activity for this exact authorized company-college relationship.`}
        actions={<div className="flex flex-wrap gap-2">
          <Link href={"/api/placements/recruiter/reports/export?collegeId="+encodeURIComponent(collegeId)+"&status="+query.status}
            className="inline-flex min-h-9 items-center rounded-[9px] border border-border px-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]">
            Export report CSV
          </Link>
          <Link href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)} className="inline-flex min-h-9 items-center rounded-[9px] border border-border px-4 text-sm text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]">
            Drives →
          </Link>
        </div>}
      />

      {report.choices.length > 1 ? (
        <nav
          aria-label="Choose report college"
          className="flex flex-wrap gap-2"
        >
          {report.choices.map((grant) => (
            <Link
              key={grant.id}
              href={recruiterCompanyReportsHref({
                collegeId: grant.collegeId,
              })}
              aria-current={
                grant.collegeId === collegeId
                  ? "page"
                  : undefined
              }
              className={
                grant.collegeId === collegeId
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                  : "rounded-full border border-border bg-surface px-4 py-2 text-sm text-body hover:border-primary"
              }
            >
              {grant.collegeName}
            </Link>
          ))}
        </nav>
      ) : null}

      <nav
        aria-label="Company sections"
        className="flex gap-2 border-b border-border"
      >
        <Link
          href={`${companyBase}&tab=company`}
          className="px-3 py-3 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
        >
          Company
        </Link>

        <Link
          href={`${companyBase}&tab=team`}
          className="px-3 py-3 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
        >
          Team
        </Link>

        <Link
          href={recruiterCompanyReportsHref({
            collegeId,
          })}
          aria-current="page"
          className="border-b-2 border-primary px-3 py-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
        >
          Reports
        </Link>
      </nav>

      <section
        aria-label="Hiring portfolio summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        {[
          {
            label: "Visible hiring drives",
            value: summary.total,
          },
          {
            label: "Published drives",
            value: summary.published,
          },
          {
            label: "Closed drives",
            value: summary.closed,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {metric.label}
            </p>

            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section aria-label="All your drives at this college" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">All your drives at this college</h2>
        <p className="mt-1 text-sm text-body">Hiring progress of applicants already shared by the placement cell, across all your authorized drives. Private applications are not counted.</p>
        <div className="mt-4 space-y-3">
          {buildRecruiterReportFunnel(report.funnel).map(stage=><div key={stage.label}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-foreground">{stage.label}</span>
              <span className="tabular-nums text-body">{stage.total} · {stage.previousPercentLabel} of previous</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-primary" style={{width:stage.appliedPercent+"%"}}/>
            </div>
          </div>)}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Drive report filters
        </h2>

        <form
          method="get"
          action="/hr/company/reports"
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input
            type="hidden"
            name="collegeId"
            value={collegeId}
          />

          <label className="grid min-w-44 gap-1 text-sm font-semibold text-body">
            Drive status
            <select
              name="status"
              defaultValue={query.status}
              className="min-h-9 rounded-[9px] border border-border bg-surface px-3 text-base sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
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
            </select>
          </label>

          <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">
            Rows per page
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="min-h-9 rounded-[9px] border border-border bg-surface px-3 text-base sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex min-h-9 items-center rounded-[9px] bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
          >
            Apply filters
          </button>

          <Link
            href={recruiterCompanyReportsHref({
              collegeId,
            })}
            className="inline-flex min-h-9 items-center rounded-[9px] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
          >
            Clear filters
          </Link>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">Current page hiring totals</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Totals cover only the visible authorized drive rows on this page, not every company drive.
          Outstanding means currently issued offers; these counts may represent multiple offer versions.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {Object.entries(hrCompanyReportPageSignals(jobs)).map(([label,value])=>(
            <div key={label} className="rounded-[9px] border border-border p-3">
              <dt className="capitalize text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
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
          <DataTable
            caption="Company Reports table"
            rows={jobs}
            getRowKey={job=>job.id}
            empty={<EmptyState title="No matching drives"
              description="Reports appear once you have a drive with applicants. If you expected a report, review the selected college and filters."/>}
            columns={[
              {key:"drive",header:"Drive",mobilePriority:"primary",
                cell:(job)=><div>
                  <Link href={"/hr/placements/jobs/"+encodeURIComponent(job.id)}
                    className="inline-flex min-h-9 items-center break-words font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]">{job.title}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{job.employmentType.replaceAll("_"," ")}</p>
                </div>},
              {key:"status",header:"Status",mobilePriority:"secondary",
                cell:(job)=><StatusBadge tone={job.status==="PUBLISHED"?"success":"neutral"}>{job.status}</StatusBadge>},
              {key:"published",header:"Published",mobilePriority:"secondary",
                cell:(job)=>formatDate(job.publishedAt)},
              {key:"applied",header:"Applications",mobilePriority:"secondary",
                cell:(job)=>job.applications},
              {key:"submitted",header:"Submitted",mobilePriority:"secondary",
                cell:(job)=>job.submittedApplications},
              {key:"withdrawn",header:"Withdrawn",mobilePriority:"secondary",
                cell:(job)=>job.withdrawnApplications},
              {key:"offered",header:"Offered",mobilePriority:"secondary",
                cell:(job)=>job.outstandingOffers+job.acceptedOffers+job.declinedOffers},
              {key:"accepted",header:"Accepted offers",mobilePriority:"secondary",
                cell:(job)=>job.acceptedOffers},
              {key:"declined",header:"Declined",mobilePriority:"secondary",
                cell:(job)=>job.declinedOffers},
              {key:"joined",header:"Joined",mobilePriority:"secondary",
                cell:(job)=>job.joinedOffers},
            ]}
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
                className="inline-flex min-h-9 items-center rounded-[9px] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
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
                className="inline-flex min-h-9 items-center rounded-[9px] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]"
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
