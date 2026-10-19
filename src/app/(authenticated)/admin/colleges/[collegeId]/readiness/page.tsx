import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import Link from "next/link";
import {parseSuperAdminReadinessParams,visibleReadinessChecks} from "@/modules/colleges/admin-readiness-filter";
import {ErrorState} from "@/components/ui/error-state";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import { PageHeader } from "@/components/ui/page-header";
import {readinessRemediationLink} from "@/modules/colleges/readiness-remediation-links";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  collegeIdSchema,
} from "@/modules/colleges/validation";
import {
  getSuperAdminCollegeReadiness,
} from "@/modules/colleges/readiness-service";

import type {
  CollegeReadinessStatus,
} from "@/modules/colleges/readiness-model";

function checkTone(
  status: CollegeReadinessStatus,
) {
  switch (status) {
    case "PASS":
      return "success" as const;
    case "FAIL":
      return "error" as const;
    case "UNKNOWN":
      return "warning" as const;
  }
}

function overallTone(
  overall: "READY" | "NOT_READY" | "INCOMPLETE",
) {
  switch (overall) {
    case "READY":
      return "success" as const;
    case "NOT_READY":
      return "error" as const;
    case "INCOMPLETE":
      return "warning" as const;
  }
}

function overallLabel(
  overall: "READY" | "NOT_READY" | "INCOMPLETE",
) {
  switch (overall) {
    case "READY":
      return "Ready on this checklist";
    case "NOT_READY":
      return "Not ready";
    case "INCOMPLETE":
      return "Incomplete evidence";
  }
}

export const dynamic = "force-dynamic";

export default async function CollegeReadinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ collegeId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const { collegeId } = await params;

  if (
    !collegeIdSchema.safeParse(collegeId).success
  ) {
    notFound();
  }

  const raw=await searchParams;
  const parsed=parseSuperAdminReadinessParams(raw);
  // A malformed filter is a recoverable URL error. Avoid expensive scoped
  // readiness queries until both the tenant ID and filters are valid.
  if(!parsed)return <ErrorState title="Invalid readiness filter"
    description="Choose a supported check status."
    action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/readiness"}>Clear</Link>}/>;


  const result =
    await getSuperAdminCollegeReadiness(
      context,
      collegeId,
    );

  if (!result) {
    notFound();
  }

  const {
    college,
    evaluation,
    supplemental,
  } = result;
  const shownChecks=visibleReadinessChecks(evaluation.checks,parsed.status,parsed.area);
  // SA-tenants-modules-23: distinguish measured blockers from optional
  // configuration suggestions without implying runtime acceptance.
  const mustFix=evaluation.checks.filter(check=>check.status!=="PASS");
  const recommended=[
    supplemental.activeLectureHalls===null
      ?"Verify lecture-hall source availability before scheduling."
      :supplemental.activeLectureHalls===0
        ?"Consider registering lecture halls if on-campus sessions are planned."
        :null,
    supplemental.attendancePolicyRecord===null
      ?"Verify the attendance-policy data source."
      :!supplemental.attendancePolicyRecord
        ?"Review the attendance policy defaults before operating."
        :null,
  ].filter((item):item is string=>item!==null);


  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/admin/colleges"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Colleges
      </Link>

      <PageHeader
        eyebrow="Super Admin · Tenant Setup"
        title={`${college.name} · Readiness Gate`}
        description={`Read-only go-live checklist for ${college.code}. Checks use persisted, college-scoped data. No settings are modified.`}
        actions={
          <StatusBadge
            tone={overallTone(
              evaluation.overall,
            )}
          >
            {overallLabel(
              evaluation.overall,
            )}
          </StatusBadge>
        }
      />

      <Link href={"/api/admin/colleges/"+encodeURIComponent(college.id)+"/readiness/export"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Export all persisted readiness checks (CSV) →</Link>
      <p className="text-xs text-muted-foreground">Export includes all ten persisted checks even when the page filter hides some; runtime verification is not certified.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
        >
          Recheck persisted readiness →
        </Link>
        <p className="text-xs text-muted-foreground">
          Reopening the page recalculates the current database checklist. It cannot verify live DNS propagation, login delivery, or end-to-end teaching and placement workflows.
        </p>
      </div>

      <section
        aria-label="Readiness summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "Passed",
            count: evaluation.counts.passed,
          },
          {
            label: "Failed",
            count: evaluation.counts.failed,
          },
          {
            label: "Unknown",
            count: evaluation.counts.unknown,
          },
          {
            label: "Total checks",
            count: evaluation.counts.total,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4"
          >
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {metric.count}
            </p>
          </article>
        ))}
      </section>

      <section aria-label="Must fix before launch" className="min-w-0 space-y-3 border-t border-border pt-5">
        <h2 className="m-0 text-lg font-semibold text-foreground">Must fix before launch</h2>
        {mustFix.length===0
          ?<p role="status" className="text-sm text-body">All persisted readiness checks pass. Runtime DNS, login, teaching and placement verification are still required before launch.</p>
          :<ul className="list-disc space-y-2 pl-5 text-sm text-body">
            {mustFix.map(check=><li key={check.id}>
              <span className="font-semibold">{check.label} — {check.status==="FAIL"?"Not ready":"Unverified"}</span>
              <p className="mt-1">{check.remediation}</p>
              <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline"
               href={readinessRemediationLink(check.id,college.id)}>Fix or verify this requirement →</Link>
            </li>)}
          </ul>}
      </section>
      <section aria-label="Recommended setup" className="border-t border-border pt-5">
        <h2 className="m-0 text-lg font-semibold text-foreground">Recommended setup</h2>
        {recommended.length?<ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-body">
          {recommended.map(item=><li key={item}>{item}</li>)}
        </ul>:<p role="status" className="mt-2 text-sm text-body">No additional configuration suggestions were detected from the two optional persisted sources.</p>}
        <p className="mt-2 text-xs text-muted-foreground">These suggestions are not extra checklist pass criteria. A runtime launch decision still requires separate operational verification.</p>
      </section>
      <section className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Go-live checks
          </h2>
          <StatusBadge
            tone={overallTone(
              evaluation.overall,
            )}
          >
            {evaluation.counts.passed}/
            {evaluation.counts.total} passed
          </StatusBadge>
        </div>

        <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-semibold text-body">Show checks
            <Select name="status" defaultValue={parsed.status} className="min-h-11 sm:min-h-9">
              <option value="ALL">All ten checks</option><option value="NEEDS_ATTENTION">Needs attention</option><option value="FAIL">Failed</option><option value="UNKNOWN">Unknown source</option><option value="PASS">Passed</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Setup area
            <Select name="area" defaultValue={parsed.area} className="min-h-11 sm:min-h-9">
              <option value="ALL">Every area</option><option value="LIFECYCLE">Tenant lifecycle</option><option value="ACADEMICS">Academic structure</option><option value="PEOPLE">College people</option><option value="PLACEMENTS">Placement readiness</option><option value="DOMAINS">Login domains</option>
            </Select>
          </label><Button type="submit" className="min-h-11 sm:min-h-9">Filter</Button>
          <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text" href={"/admin/colleges/"+encodeURIComponent(college.id)+"/readiness"}>Clear</Link>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Showing {shownChecks.length} of {evaluation.checks.length} required checks; the overall verdict always uses all ten.</p>
        <p className="mt-2 text-sm leading-6 text-body">
          PASS means that the required record or state
          was found. FAIL means a known requirement was
          not satisfied. UNKNOWN means the underlying
          data could not be verified. An unknown check
          never counts as passed.
        </p>

        {shownChecks.length===0 ? (
          <p role="status" className="mt-4 rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4 text-sm text-body">
            No readiness checks match the selected status and area. The overall tenant readiness verdict above still uses all ten checks.
          </p>
        ) : null}
        <ol className="mt-5 space-y-3">
          {shownChecks.map(
            (check, index) => (
              <li
                key={check.id}
                className="rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="m-0 text-sm font-semibold text-foreground">
                      {index + 1}.{" "}
                      {check.label}
                    </h3>

                    <p className="mt-2 text-sm text-body">
                      {check.evidence}
                    </p>
                  </div>

                  <StatusBadge
                    tone={checkTone(
                      check.status,
                    )}
                  >
                    {check.status}
                  </StatusBadge>
                </div>

                {check.status !== "PASS" ? (
                  <p className="mb-0 mt-3 text-xs leading-5 text-muted-foreground">
                    Next step: {check.remediation}
                    <Link href={readinessRemediationLink(check.id,college.id)} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open related setup →</Link>
                  </p>
                ) : null}
              </li>
            ),
          )}
        </ol>
      </section>

      <section className="border-t border-border pt-5">
        <h2 className="m-0 text-lg font-semibold text-foreground">
          Additional setup evidence
        </h2>

        <p className="mt-2 text-sm leading-6 text-body">
          The following sources are inspected but do
          not independently block the ten-check
          readiness summary. Their presence does not
          prove teaching schedules, attendance workflows
          or runtime access are functional.
        </p>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Active lecture halls
            </dt>
            <dd className="mt-1 text-sm text-body">
              {supplemental.activeLectureHalls ===
              null
                ? "Unknown — source unavailable"
                : supplemental.activeLectureHalls}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Persisted attendance policy
            </dt>
            <dd className="mt-1 text-sm text-body">
              {supplemental.attendancePolicyRecord ===
              null
                ? "Unknown — source unavailable"
                : supplemental.attendancePolicyRecord
                  ? "Present"
                  : "No stored override; attendance service may use source defaults"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-border pt-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Readiness interpretation
        </h2>

        <p className="mt-2 text-sm leading-6 text-body">
          {evaluation.overall === "READY"
            ? "All ten persisted-data checks currently pass. This is checklist readiness, not authorization to launch the college."
            : evaluation.overall === "NOT_READY"
              ? "At least one required check has a confirmed failure. Resolve the failed items and reload this page to re-evaluate them."
              : "No check has a confirmed failure, but at least one required source is unknown. Readiness cannot be established until those sources are verified."}
        </p>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          This is not a live DNS, login, SMS/email,
          teaching, placement workflow, tenant-isolation
          or production deployment test. Actual go-live
          still requires independent operational and
          security verification. The verified-primary-
          domain check uses stored verification flags,
          not a fresh DNS lookup.
        </p>
      </section>
    </div>
  );
}
