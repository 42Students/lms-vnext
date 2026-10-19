import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { LearnerPlacementJobs, type LearnerPlacementJobItem } from "./learner-placement-jobs";
import {LearnerSaveDriveButton} from "./learner-save-drive-button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  learnerJobDetailSummary,
  safeLearnerPlacementUrl,
} from "@/modules/placements/learner-job-detail-model";
import {learnerJobAvailabilityBanner} from "@/modules/placements/learner-job-availability-banner-model";
import {learnerDriveEvidenceRequirements} from "@/modules/placements/learner-drive-evidence-requirements-model";
import {learnerJobDeadlineLabel} from "@/modules/placements/learner-job-deadline-label-model";
import {learnerDrivePayFacts} from "@/modules/placements/learner-drive-pay-model";

function humanize(value: string) {
  return value.toLowerCase().split("_").map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function detailValue(value: string | number | null) {
  return value === null || value === "" ? "Not provided" : String(value);
}
function statusTone(status: "PASS" | "FAIL" | "MISSING") {
  if (status === "PASS") return "success" as const;
  if (status === "FAIL") return "error" as const;
  return "warning" as const;
}

export function LearnerPlacementJobDetail({
  items,returnHref="/learn/my-placements/jobs",initialSaved=false,
}: {
  items: readonly LearnerPlacementJobItem[];
  returnHref?:string;
  initialSaved?:boolean;
}) {
  const summary = learnerJobDetailSummary(items);
  if (!summary) return null; // route has already returned notFound()
  const item = items[0]!;
  const website = safeLearnerPlacementUrl(item.company.websiteUrl);
  const availability=learnerJobAvailabilityBanner(items);
  const failed = items.filter((row) => row.eligibility.status === "INELIGIBLE");
  const requirements=learnerDriveEvidenceRequirements(items);

  return (
    <div className="min-w-0 space-y-6" aria-label="Published placement drive">
      <Breadcrumbs items={[
        { label: "My Placements", href: "/learn/my-placements" },
        { label: "Drives", href: returnHref },
        { label: summary.title },
      ]} />

      <section className="min-w-0" aria-labelledby="drive-title">
        <PageHeader
          id="drive-title"
          title={summary.title}
          description={summary.companyName}
          actions={
            <>
              {summary.appliedCount ? (
            <StatusBadge tone="success">{summary.appliedCount} role{summary.appliedCount === 1 ? "" : "s"} applied</StatusBadge>
          ) : summary.deadlinePassed ? (
            <StatusBadge tone="neutral">Applications closed</StatusBadge>
          ) : summary.canApplyCount > 0 ? (
            <StatusBadge tone="success">Eligible to apply</StatusBadge>
          ) : (
            <StatusBadge tone="warning">Review eligibility</StatusBadge>
          )}
            </>
          }
        />

        <dl className="mt-5 grid min-w-0 gap-4 border-t border-border pt-5 md:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Where</dt>
            <dd className="mt-1 font-semibold text-foreground">{item.job.locations.length?item.job.locations.join(", "):"Not specified"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Job type</dt>
            <dd className="mt-1 font-semibold text-foreground">{humanize(item.job.employmentType)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Compensation</dt>
            <dd className="mt-1 font-semibold text-foreground">{item.job.minimumAnnualCtcInr!==null
              ? "₹"+(item.job.minimumAnnualCtcInr/100000).toLocaleString("en-IN")+" LPA" : "Not disclosed"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Pay</dt>
            <dd className="mt-1 font-semibold text-foreground">{item.job.stipendPerMonthInr!==null&&item.job.stipendPerMonthInr!==undefined
              ? "₹"+item.job.stipendPerMonthInr.toLocaleString("en-IN")+" / month" : "See role breakdown"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Posted</dt>
            <dd className="mt-1 font-semibold text-foreground">{item.job.publishedAt&&Number.isFinite(Date.parse(item.job.publishedAt))
              ? new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(item.job.publishedAt)) : "Not specified"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Applications close</dt>
            <dd className="mt-1 font-semibold text-foreground">{learnerJobDeadlineLabel(item.job.applicationDeadline)}</dd></div>
        </dl>
        <div className="mt-5 flex min-w-0 flex-wrap gap-3">
          <LearnerSaveDriveButton jobId={item.job.id} jobTitle={item.job.title} initialSaved={initialSaved}/>
          <a href="#job-role-options" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-5 text-sm font-[650] text-[var(--lms-on-primary)] transition-colors duration-150 hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none md:min-h-9">
            {summary.appliedCount ? "View my application" : "See roles & application"} ↓
          </a>
          {website ? (
            <a href={website} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-5 text-sm font-semibold text-primary-text transition-colors duration-150 hover:border-[var(--lms-primary)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none md:min-h-9">
              Company website ↗
            </a>
          ) : null}
        </div>
      </section>
      {availability ? (
        <aside role="status" aria-label="Application availability"
          className="min-w-0 border-b border-border bg-surface-subtle px-4 py-4 md:px-6 md:py-5">
          <h2 className="text-base font-semibold text-foreground">{availability.title}</h2>
          <p className="mt-2 text-sm leading-6 text-body">{availability.detail}</p>
          {availability.kind!=="OPEN" && availability.kind!=="APPLIED" ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-body" aria-label="Application blockers">
              {[...new Set(items.flatMap(row=>row.applicationBlockers??[]))].map(reason=>
                <li key={reason}>{reason}</li>)}
            </ul>
          ) : null}
          {availability.kind!=="OPEN" ? (
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/learn/my-placements/applications"
                className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text">
                Check my applications →
              </Link>
              <Link href="/learn/profile"
                className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text">
                Review my profile →
              </Link>
              {(availability.kind==="NOT_OPEN" || availability.kind==="EVIDENCE") ? (
                <Link href="/learn/my-placements#registration"
                  className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text">
                  Register for placements →
                </Link>
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}

      <section className="min-w-0 border-b border-border pb-5 pt-4 md:pb-6 md:pt-5"
        aria-label="Registration and evidence requirements">
        <h2 className="text-base font-semibold text-foreground">Requirements &amp; preferences</h2>
        <p className="mt-2 text-sm leading-6 text-body">
          These are role-specific eligibility checks from your college placement data.
          Separate placement registration or consent status is not established by this checklist.
        </p>
        <ul className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {requirements.map(role=>(
            <li key={role.id} className="min-w-0 rounded-lg border border-border bg-surface-subtle p-3">
              <p className="break-words text-sm font-semibold text-foreground">{role.title}</p>
              <p className="mt-2 text-xs text-body">
                {role.checked===0?"No detailed requirement checks available":
                 `${role.passed} met · ${role.missing} missing evidence · ${role.failed} not met`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {role.actionable?"Application action currently available":
                 "Review the role status and any missing evidence below"}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/learn/my-placements/rules"
            className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">
            Review placement rules →
          </Link>
          <Link href="/learn/profile"
            className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">
            Review profile evidence →
          </Link>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="min-w-0 border-b border-border pb-5 pt-4 md:pb-6 md:pt-5" aria-labelledby="about-drive">
          <h2 id="about-drive" className="m-0 text-lg font-semibold text-foreground">About this opportunity</h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-body">
            {item.job.description || "No additional description was published for this drive."}
          </p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Key dates</h3>
          <p className="mt-2 text-sm text-body">Applications close: {learnerJobDeadlineLabel(item.job.applicationDeadline)}</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Company & role details</h3>
          <dl className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Locations</dt>
              <dd className="mt-1 text-sm text-foreground">
                {item.job.locations.length ? item.job.locations.join(", ") : "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Employment type</dt>
              <dd className="mt-1 text-sm text-foreground">{humanize(item.job.employmentType)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Application channel</dt>
              <dd className="mt-1 text-sm text-foreground">{humanize(item.job.applicationMode)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Company</dt>
              <dd className="mt-1 text-sm text-foreground">{summary.companyName}</dd>
            </div>
          </dl>
        </section>

        <section className="min-w-0 border-b border-border pb-5 pt-4 md:pb-6 md:pt-5" aria-labelledby="eligibility-title">
          <h2 id="eligibility-title" className="m-0 text-lg font-semibold text-foreground">
            Eligibility breakdown
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            Your college&apos;s published eligibility rules are checked separately for each role.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone="success">{summary.eligibleCount} eligible role{summary.eligibleCount === 1 ? "" : "s"}</StatusBadge>
            {summary.ineligibleCount ? (
              <StatusBadge tone="error">{summary.ineligibleCount} not eligible</StatusBadge>
            ) : null}
            {summary.missingCount ? (
              <StatusBadge tone="warning">{summary.missingCount} missing evidence</StatusBadge>
            ) : null}
          </div>
          {items.every((row) => row.eligibility.checks.length === 0) ? (
            <p className="mt-4 rounded-lg bg-surface-subtle p-4 text-sm leading-6 text-body">
              {summary.appliedCount
                ? "Your existing application is recorded. The individual eligibility evidence is not repeated after submission."
                : "No individual eligibility checks were returned for these role options."}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {items.map((row) => (
                <div key={row.roleOption.id} className="rounded-lg border border-border p-4">
                  <h3 className="m-0 text-sm font-semibold text-foreground">{row.roleOption.title}</h3>
                  {row.eligibility.checks.length ? (
                    <ul className="mt-3 space-y-3">
                      {row.eligibility.checks.map((check) => (
                        <li key={check.criterion} className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">{humanize(check.criterion)}</span>
                            <StatusBadge tone={statusTone(check.status)}>
                              {check.status === "PASS" ? "Meets rule" :
                                check.status === "FAIL" ? "Does not meet rule" : "Evidence needed"}
                            </StatusBadge>
                          </div>
                          <p className="m-0 text-xs leading-5 text-body">{check.detail}</p>
                          <p className="m-0 text-xs text-muted-foreground">
                            Yours: {detailValue(check.actual)} · Required: {detailValue(check.required)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-body">Detailed evidence unavailable for this role.</p>
                  )}
                  {row.eligibility.override ? (
                    <p className="mt-3 text-xs text-body">
                      College decision: {humanize(row.eligibility.override.decision)} · {row.eligibility.override.reason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {failed.length || summary.missingCount ? (
            <p className="mt-4 text-sm leading-6 text-body">
              If your academic evidence is missing or incorrect, review your Learner profile
              or contact your placement team before the deadline.
            </p>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="drive-pay-title" className="min-w-0 border-b border-border pb-5 pt-4 md:pb-6 md:pt-5">
        <h2 id="drive-pay-title" className="text-lg font-semibold text-foreground">Pay</h2>
        <p className="mt-1 text-sm text-body">Published compensation for each role. Missing amounts are not estimated.</p>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">{items.map(row=>{
          const pay=learnerDrivePayFacts({...row.roleOption,stipendPerMonthInr:row.job.stipendPerMonthInr??null});
          return <li key={row.roleOption.id} className="rounded-md border border-border p-4">
            <h3 className="font-semibold text-foreground">{row.roleOption.title}</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-muted-foreground">CTC</dt><dd>{pay.ctc}</dd></div>
              <div><dt className="text-muted-foreground">Fixed</dt><dd>{pay.fixed}</dd></div>
              <div><dt className="text-muted-foreground">Variable</dt><dd>{pay.variable}</dd></div>
              <div><dt className="text-muted-foreground">Joining bonus</dt><dd>{pay.joiningBonus}</dd></div>
              <div><dt className="text-muted-foreground">Stipend per month</dt><dd>{pay.stipend}</dd></div>
            </dl>
          </li>;
        })}</ul>
      </section>

      <section id="job-role-options" className="scroll-mt-24 space-y-4" aria-labelledby="role-options-title">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="role-options-title" className="m-0 text-lg font-semibold text-foreground">
              Roles and application status
            </h2>
            <p className="mt-1 text-sm text-body">
              Your current application is authoritative. A withdrawn, closed or ineligible role cannot be submitted here.
            </p>
          </div>
          <Link href="/learn/my-placements/applications"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline md:min-h-9">
            My applications →
          </Link>
        </div>
        <LearnerPlacementJobs items={items} savedJobIds={initialSaved?[item.job.id]:[]} />
      </section>
    </div>
  );
}
