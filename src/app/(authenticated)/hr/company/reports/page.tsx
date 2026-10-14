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
import {hrCompanyReportPageSignals} from "@/modules/placements/hr-report-page-signals-model";

type SearchParams = {
  collegeId?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

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

  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  const raw = await searchParams;

  const parsed =
    recruiterCompanyReportsQuerySchema.safeParse({
      collegeId: first(raw.collegeId) || undefined,
      status: first(raw.status) || undefined,
      page: first(raw.page) || undefined,
      pageSize: first(raw.pageSize) || undefined,
    });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
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
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
      <div className="space-y-6">
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
                  className="rounded-lg border border-border bg-surface p-4 hover:border-primary hover:bg-primary-subtle"
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title="Company Reports"
        description={`${report.company.name} · ${report.grant.collegeName}. Read-only hiring activity for this exact authorized company-college relationship.`}
        actions={<div className="flex flex-wrap gap-2">
          <Link href={"/api/placements/recruiter/reports/export?collegeId="+encodeURIComponent(collegeId)+"&status="+query.status}
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-primary-text">
            Export report CSV
          </Link>
          <Link href="/hr/placements" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-body">
            Hiring Workspace →
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
          className="px-3 py-3 text-sm font-semibold text-body hover:text-primary-text"
        >
          Company
        </Link>

        <Link
          href={`${companyBase}&tab=team`}
          className="px-3 py-3 text-sm font-semibold text-body hover:text-primary-text"
        >
          Team
        </Link>

        <Link
          href={recruiterCompanyReportsHref({
            collegeId,
          })}
          aria-current="page"
          className="border-b-2 border-primary px-3 py-3 text-sm font-semibold text-foreground"
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
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
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
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Apply filters
          </button>

          <Link
            href={recruiterCompanyReportsHref({
              collegeId,
            })}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
            <div key={label} className="rounded-md border border-border p-3">
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
            description="There are no recruiter-visible published or closed hiring drives matching these filters for this company and college."
          />
        ) : (
          <>
          <div className="grid gap-3 md:hidden">
            {jobs.map(job=><article key={job.id} className="min-w-0 rounded-lg border border-border bg-surface p-4">
              <Link href={"/hr/placements/jobs/"+job.id} className="break-words font-semibold text-primary-text">{job.title}</Link>
              <p className="mt-1 text-xs text-muted-foreground">{job.status}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Applied",job.applications],["Offered (issued)",job.outstandingOffers],
                  ["Accepted",job.acceptedOffers],["Declined",job.declinedOffers],
                  ["Joined",job.joinedOffers],["Withdrawn",job.withdrawnApplications],
                ].map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{value}</dd></div>)}
              </dl>
            </article>)}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Drive
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Published
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Applications
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Submitted
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Withdrawn
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Outstanding offers
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Accepted offers
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">Declined</th>
                  <th scope="col" className="px-4 py-3 text-right">Joined</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/hr/placements/jobs/${encodeURIComponent(
                          job.id,
                        )}`}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {job.title}
                      </Link>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {job.employmentType.replaceAll(
                          "_",
                          " ",
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={
                          job.status === "PUBLISHED"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {job.status}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4 text-body">
                      {formatDate(job.publishedAt)}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-body">
                      {job.applications}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-body">
                      {job.submittedApplications}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-body">
                      {job.withdrawnApplications}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-body">
                      {job.outstandingOffers}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-body">
                      {job.acceptedOffers}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-body">{job.declinedOffers}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-body">{job.joinedOffers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
