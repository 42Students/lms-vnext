import type {ReactNode} from "react";
import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { LearnerPlacementJobs, type LearnerPlacementJobItem } from "./learner-placement-jobs";
import {LearnerSaveDriveButton} from "./learner-save-drive-button";
import {LearnerApplicationResumeLink} from "./learner-application-resume-link";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  learnerJobDetailSummary,
  safeLearnerPlacementUrl,
} from "@/modules/placements/learner-job-detail-model";
import {learnerJobAvailabilityBanner} from "@/modules/placements/learner-job-availability-banner-model";
import {learnerDriveEvidenceRequirements} from "@/modules/placements/learner-drive-evidence-requirements-model";
import {learnerJobDeadlineLabel} from "@/modules/placements/learner-job-deadline-label-model";
import {learnerDrivePayFacts} from "@/modules/placements/learner-drive-pay-model";

function relativePostedDate(value:string|null|undefined){
 if(!value||!Number.isFinite(Date.parse(value)))return "Not specified";
 const days=Math.max(0,Math.floor((Date.now()-Date.parse(value))/86_400_000));
 if(days===0)return "Today";
 if(days===1)return "Yesterday";
 if(days<7)return days+" days ago";
 if(days<30)return Math.floor(days/7)+" week"+(days>=14?"s":"")+" ago";
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(value));
}
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
  items,returnHref="/learn/my-placements/jobs",initialSaved=false,journey=null,
}: {
  items: readonly LearnerPlacementJobItem[];
  returnHref?:string;
  initialSaved?:boolean;
  journey?:ReactNode;
}) {
  const summary = learnerJobDetailSummary(items);
  if (!summary) return <section role="alert" aria-live="assertive"
    aria-labelledby="drive-unavailable" className="space-y-4 p-5">
    <h1 id="drive-unavailable" tabIndex={-1} className="text-lg font-semibold">
      This drive is unavailable
    </h1>
    <p className="text-sm text-body">
      This drive may be hidden or the eligibility preview could not be loaded.
      No application was submitted or changed.
    </p>
    <div className="flex flex-wrap gap-4">
      <Link href={returnHref} className="min-h-11 inline-flex items-center font-semibold text-primary-text underline">
        Browse current drives
      </Link>
      <Link href="/learn/my-placements/applications" className="min-h-11 inline-flex items-center font-semibold text-primary-text underline">
        View my applications
      </Link>
    </div>
  </section>;
  const item = items[0]!;
  const website = safeLearnerPlacementUrl(item.company.websiteUrl);
  const urgency=learnerDriveDeadlineUrgency(item.job.applicationDeadline,item.deadlinePassed,new Date().toISOString());
  const deadlineDate=item.job.applicationDeadline?new Date(item.job.applicationDeadline):null;
  const urgencyCopy=urgency.kind==="today"?"Closes today":
    urgency.kind==="soon"&&deadlineDate?Math.max(1,Math.ceil((deadlineDate.getTime()-Date.now())/86_400_000))+
      " day"+(Math.ceil((deadlineDate.getTime()-Date.now())/86_400_000)===1?"":"s")+" left":urgency.label;
  const availability=learnerJobAvailabilityBanner(items);
  const applied=items.filter(row=>row.application?.status==="SUBMITTED"&&row.application.id);
  const evidencePreviewUnavailable=items.length>0&&items.every(row=>
    row.eligibility.checks.length===0&&!row.application);
  const failed = items.filter((row) => row.eligibility.status === "INELIGIBLE");
  const requirements=learnerDriveEvidenceRequirements(items);
  // A positive eligibility score is not an application authorization.
  // Display the persisted apply denial before generic availability guidance.
  const blockers=[...new Set(items.flatMap(role=>role.applicationBlockers??[]))];
  const gate=items.find(role=>!role.canApply)?.applicationGate;
  const primaryDenial=gate?.reason??blockers[0]??null;
  const denialAction=gate?.action??(blockers.some(reason=>/register for placements|registration does not include/i.test(reason))
    ? "REGISTER" as const
    : blockers.some(reason=>/eligib|rule/i.test(reason))
      ? "RULES" as const : null);

  return (
    <div className="min-w-0 space-y-5" aria-label="Published placement drive">
      <Breadcrumbs items={[
        { label: "My Placements", href: "/learn/my-placements" },
        { label: "Drives", href: returnHref },
        { label: summary.title },
      ]} />

      <section className="min-w-0 rounded-[12px] border border-border bg-surface p-4 sm:p-5" aria-labelledby="drive-title">
        <div className="flex min-w-0 items-start gap-4">
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--lms-primary-subtle)] text-xl font-bold text-primary-text">
          {summary.companyName.trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase()||"C"}
        </span>
        <div className="min-w-0 flex-1">
        <PageHeader
          id="drive-title"
          title={summary.title}
          description={summary.companyName}
          actions={
            <>
              <LearnerSaveDriveButton jobId={item.job.id} jobTitle={item.job.title} initialSaved={initialSaved}/>
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

        {item.job.recruiterDriveMode==="OFF_CAMPUS"||item.job.recruiterDriveMode==="CAMPUS_POOL" ? (
          <aside role="status" aria-label="Drive location and travel"
            className="mt-4 rounded-md border border-[var(--lms-info-border)] bg-[var(--lms-primary-subtle)] p-4">
            <h2 className="font-semibold">
              {item.job.recruiterDriveMode==="OFF_CAMPUS"?"Off-campus drive":"Campus pool drive"}
            </h2>
            {item.job.campusPool ? (
              <dl className="mt-2 space-y-2 text-sm">
                <div><dt className="inline font-semibold">Reporting college: </dt>
                  <dd className="inline">{item.job.campusPool.hostCollege}</dd></div>
                <div><dt className="inline font-semibold">Reporting time: </dt>
                  <dd className="inline">{item.job.campusPool.reportingTime??"To be announced"}</dd></div>
                {item.job.campusPool.travelNote?<div>
                  <dt className="inline font-semibold">Travel note: </dt>
                  <dd className="inline whitespace-pre-wrap">{item.job.campusPool.travelNote}</dd>
                </div>:null}
              </dl>
            ):<p className="mt-2 text-sm">Check the drive schedule for reporting and travel instructions.</p>}
          </aside>
        ):null}
        <dl className="mt-4 grid min-w-0 gap-x-4 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Where</dt>
            <dd className="mt-1 font-semibold text-foreground">{item.job.locations.length?item.job.locations.join(", "):"Not specified"}</dd></div>
          <div><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Job type</dt>
            <dd className="mt-1 font-semibold text-foreground">{humanize(item.job.employmentType)}</dd></div>
          <div><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Compensation</dt>
            <dd className="mt-1 font-semibold text-foreground">{item.job.minimumAnnualCtcInr!==null
              ? "₹"+(item.job.minimumAnnualCtcInr/100000).toLocaleString("en-IN")+" LPA" : "Not disclosed"}</dd></div>
          {item.job.minimumAnnualCtcInr===null&&item.job.stipendPerMonthInr!==null&&item.job.stipendPerMonthInr!==undefined?
            <div><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stipend</dt>
              <dd className="mt-1 font-semibold text-foreground">₹{item.job.stipendPerMonthInr.toLocaleString("en-IN")} / month</dd>
            </div>:null}
          <div><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Posted</dt>
            <dd className="mt-1 font-semibold text-foreground">{relativePostedDate(item.job.publishedAt)}</dd></div>
          <div><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applications close</dt>
            <dd className="mt-1 font-semibold text-foreground">{learnerJobDeadlineLabel(item.job.applicationDeadline)}
              <StatusBadge tone={urgency.tone} className="ml-2">{urgencyCopy}</StatusBadge></dd></div>
        </dl>
        <div className="mt-4 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
      {applied.length>0 ? (
        <section role="status" aria-label="Application receipt" id="application-receipt"
          className="rounded-lg border-2 border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] p-4">
          <h2 className="font-semibold text-foreground">Applied successfully</h2>
          <p className="mt-2 text-sm text-body">
            {applied.length} role{applied.length===1?"":"s"} already recorded in your applications.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {applied.map(row=><li key={row.application!.id} className="break-words">
              <span className="font-semibold">{row.roleOption.title}</span>
              <span className="block text-xs">Receipt: {row.application!.id}</span>
              <LearnerApplicationResumeLink applicationId={row.application!.id} />
              <span className="block text-xs">Recorded: {new Intl.DateTimeFormat("en-IN",{
                timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
              }).format(new Date(row.application!.submittedAt))}</span>
            </li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/learn/my-placements/applications"
              className="inline-flex min-h-11 items-center rounded-md bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-white">
              View applications
            </Link>
            <Link href={returnHref} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Browse drives
            </Link>
            <Link href="/learn/my-placements/offers" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
              Check official offers
            </Link>
          </div>
        </section>
      ):null}
      {evidencePreviewUnavailable?(
        <section role="alert" aria-label="Eligibility preview unavailable"
          className="rounded-md border border-[var(--lms-warning-border)] p-4">
          <h2 className="font-semibold">Eligibility preview unavailable</h2>
          <p className="mt-1 text-sm">Role-specific evidence is not available here right now.
            Review your profile and placement rules. No application has been changed.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/learn/profile" className="min-h-11 inline-flex items-center text-sm font-semibold text-primary-text underline">Review profile</Link>
            <Link href="/learn/my-placements/rules" className="min-h-11 inline-flex items-center text-sm font-semibold text-primary-text underline">Review rules</Link>
            <Link href={returnHref} className="min-h-11 inline-flex items-center text-sm font-semibold text-primary-text underline">Browse drives</Link>
          </div>
        </section>
      ):null}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
        <div className="min-w-0 space-y-5">
      {availability ? (
        <aside role="status" aria-label="Application availability"
          className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
          <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">{availability.title}</h2>
          {availability.kind!=="OPEN" && availability.kind!=="APPLIED" && primaryDenial
            ? <p role="alert" className="mt-2 text-sm text-body leading-[22px]">{primaryDenial}</p>
            : <p className="mt-2 text-sm text-body leading-[22px]">{availability.detail}</p>}
          {availability.kind!=="OPEN" && denialAction ? (
            <Link href={denialAction==="REGISTER"?"/learn/my-placements#registration":"/learn/my-placements/rules"}
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
              {denialAction==="REGISTER"?"Register for placements":"Review placement rules"} →
            </Link>
          ) : null}
          {availability.kind!=="OPEN" && availability.kind!=="APPLIED" ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-body" aria-label="Application blockers">
              {[...new Set(items.flatMap(row=>row.applicationBlockers??[]))].map(reason=>
                <li key={reason}>{reason}</li>)}
            </ul>
          ) : null}
          {availability.kind!=="OPEN" ? (
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/learn/my-placements/applications"
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text">
                Check my applications →
              </Link>
              <Link href="/learn/profile"
                className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text">
                Review my profile →
              </Link>
              {(availability.kind==="NOT_OPEN" || availability.kind==="EVIDENCE") ? (
                <Link href="/learn/my-placements#registration"
                  className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text">
                  Register for placements →
                </Link>
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}

      <section className="min-w-0 rounded-[12px] border border-border bg-surface p-4 sm:p-5"
        aria-label="Registration and evidence requirements">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Requirements &amp; preferences</h2>
        <p className="mt-2 text-sm text-body leading-[22px]">
          These are role-specific eligibility checks from your college placement data.
          Separate placement registration or consent status is not established by this checklist.
        </p>
        <ul className="mt-3 grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {requirements.map(role=>(
            <li key={role.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3">
              <p className="break-words text-sm font-semibold text-foreground leading-[22px]">{role.title}</p>
              <p className="mt-2 text-xs text-body leading-[20px]">
                {role.checked===0?"No detailed requirement checks available":
                 `${role.passed} met · ${role.missing} missing evidence · ${role.failed} not met`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                {role.actionable?"Application action currently available":
                 "Review the role status and any missing evidence below"}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/learn/my-placements/rules"
            className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text underline">
            Review placement rules →
          </Link>
          <Link href="/learn/profile"
            className="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center text-sm font-semibold text-primary-text underline">
            Review profile evidence →
          </Link>
          <Link href="/learn/my-placements#registration"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
            Registration →
          </Link>
          <Link href="/learn/my-placements/schedule?view=calendar"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
            Calendar →
          </Link>
        </div>
      </section>

      {journey?<div className="min-w-0 rounded-[12px] border border-border p-4 sm:p-5">
        {journey}
      </div>:null}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-[12px] border border-border bg-surface p-4 sm:p-5" aria-labelledby="about-drive">
          <h2 id="about-drive" className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">About this opportunity</h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
            {item.job.description || "No description has been added for this role yet. You can still apply and ask the recruiter for details."}
          </p>
          {item.job.campusPool ? (
            <div className="mt-4 rounded-lg border border-border bg-surface-subtle p-3 text-sm text-body">
              <p className="font-semibold text-foreground">Campus pool information</p>
              <p className="mt-1">Host college: {item.job.campusPool.hostCollege}</p>
              {item.job.campusPool.reportingTime?<p className="mt-1">Reporting: {item.job.campusPool.reportingTime}</p>:null}
              {item.job.campusPool.travelNote?<p className="mt-1">{item.job.campusPool.travelNote}</p>:null}
            </div>
          ) : null}
          {item.job.recruiterDriveMode==="OFF_CAMPUS" ? (
            <p className="mt-3 text-sm text-body">Off-campus drive. Follow the employer's published instructions.</p>
          ) : null}
          {item.job.candidatePreferences? (
           <div className="mt-4 space-y-2 text-sm text-body">
            <h3 className="font-semibold text-foreground">Candidate preferences</h3><div className="flex flex-wrap gap-2">
            {item.job.candidatePreferences.preferredDegree?<StatusBadge tone="info">Degree: {item.job.candidatePreferences.preferredDegree}</StatusBadge>:null}
            {item.job.candidatePreferences.specialization?<StatusBadge tone="info">Specialization: {item.job.candidatePreferences.specialization}</StatusBadge>:null}
            {item.job.candidatePreferences.graduationYear?<StatusBadge tone="info">Passing year: {item.job.candidatePreferences.graduationYear}</StatusBadge>:null}
            {item.job.candidatePreferences.minGpa!==null?<StatusBadge tone="info">Minimum GPA: {item.job.candidatePreferences.minGpa}</StatusBadge>:null}
            {item.job.candidatePreferences.city?<StatusBadge tone="info">Preferred city: {item.job.candidatePreferences.city}</StatusBadge>:null}
            </div>
           </div>
          ):null}
          <h3 className="mt-6 text-base font-semibold text-foreground">Key dates</h3>
          <p className="mt-2 text-sm text-body leading-[22px]">Applications close: {learnerJobDeadlineLabel(item.job.applicationDeadline)}</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Company & role details</h3>
          <dl className="mt-4 grid min-w-0 gap-4 min-[768px]:grid-cols-2">
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

        <section className="min-w-0 rounded-[12px] border border-border bg-surface p-4 sm:p-5" aria-labelledby="eligibility-title">
          <h2 id="eligibility-title" className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
            Eligibility breakdown
          </h2>
          <p className="mt-2 text-sm text-body leading-[22px]">
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
            <p className="mt-4 rounded-lg bg-surface-subtle p-4 text-sm text-body leading-[22px]">
              {summary.appliedCount
                ? "Your existing application is recorded. The individual eligibility evidence is not repeated after submission."
                : "No individual eligibility checks were returned for these role options."}
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {items.map((row) => (
                <div key={row.roleOption.id} className="border-t border-border pt-4">
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
                          <p className="m-0 text-xs text-body leading-[20px]">{check.detail}</p>
                          <p className="m-0 text-xs text-muted-foreground leading-[20px]">
                            Yours: {detailValue(check.actual)} · Required: {detailValue(check.required)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-body leading-[20px]">Detailed evidence unavailable for this role.</p>
                  )}
                  {row.eligibility.override ? (
                    <p className="mt-3 text-xs text-body leading-[20px]">
                      College decision: {humanize(row.eligibility.override.decision)} · {row.eligibility.override.reason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {failed.length || summary.missingCount ? (
            <p className="mt-4 text-sm text-body leading-[22px]">
              If your academic evidence is missing or incorrect, review your Learner profile
              or contact your placement team before the deadline.
            </p>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="drive-pay-title" className="min-w-0 rounded-[12px] border border-border bg-surface p-4 sm:p-5">
        <h2 id="drive-pay-title" className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Pay</h2>
        <p className="mt-1 text-sm text-body leading-[22px]">Published compensation for each role. Missing amounts are not estimated.</p>
        <ul className="mt-4 divide-y divide-border">{items.map(row=>{
          const pay=learnerDrivePayFacts({...row.roleOption,stipendPerMonthInr:row.job.stipendPerMonthInr??null});
          return <li key={row.roleOption.id} className="border-t border-border pt-4">
            <h3 className="font-semibold text-foreground">{items.length>1?row.roleOption.title:"Compensation"}</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm min-[768px]:grid-cols-2">
              <div><dt className="text-muted-foreground">CTC</dt><dd>{pay.ctc}</dd></div>
              <div><dt className="text-muted-foreground">Fixed</dt><dd>{pay.fixed}</dd></div>
              <div><dt className="text-muted-foreground">Variable</dt><dd>{pay.variable}</dd></div>
              <div><dt className="text-muted-foreground">Joining bonus</dt><dd>{pay.joiningBonus}</dd></div>
              <div><dt className="text-muted-foreground">Stipend per month</dt><dd>{pay.stipend}</dd></div>
            </dl>
          </li>;
        })}</ul>
      </section>

        </div>
        <aside className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 lg:sticky lg:top-24" aria-label="Application actions">
      <section id="job-role-options" tabIndex={-1} className="scroll-mt-24 space-y-4 focus:outline-2 focus:outline-[var(--lms-primary)]" aria-labelledby="role-options-title">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="role-options-title" className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
              Roles and application status
            </h2>
            <p className="mt-1 text-sm text-body leading-[22px]">
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
        </aside>
      </div>
    </div>
  );
}
