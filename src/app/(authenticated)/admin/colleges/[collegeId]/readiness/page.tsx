import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {parseSuperAdminReadinessParams,visibleReadinessChecks} from "@/modules/colleges/admin-readiness-filter";
import {ErrorState} from "@/components/ui/error-state";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatTile } from "@/components/ui/stat-tile";
import collegeStyles from "@/components/admin/legacy-college-stat.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import {readinessRemediationLink} from "@/modules/colleges/readiness-remediation-links";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
import { legacyDomainLoginVerdict } from "@/modules/colleges/legacy-domain-login-readiness";
import {
  collegeIdSchema,
} from "@/modules/colleges/validation";
import {
  getSuperAdminCollegeReadiness,
} from "@/modules/colleges/readiness-service";

import type {
  CollegeReadinessStatus,
} from "@/modules/colleges/readiness-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

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
  if(!parsed)return <div className="min-w-0 space-y-6">
    <PageHeader title="Readiness Gate"
      actions={<PageBackLink href="/admin/colleges" label="Colleges"/>}/>
    <ErrorState title="Invalid readiness filter"
      description="Choose a supported check status."
      action={<TextLink href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/readiness"} className="w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4 min-h-11 md:min-h-9">Clear</TextLink>}/>
  </div>;


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
    legacyDomainReadiness,
    readinessGates,
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
      <PageHeader
        title={`${college.name} · Readiness Gate`}
        description={`Read-only go-live checklist for ${college.code}. Checks use persisted, college-scoped data. No settings are modified.`}
        actions={<div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-4">
          <PageBackLink href="/admin/colleges" label="Colleges"/>
          <StatusBadge tone={overallTone(evaluation.overall)}>{overallLabel(evaluation.overall)}</StatusBadge>
        </div>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink variant="secondary"
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
        >
          Recheck persisted readiness →
        </ButtonLink>
        <p className="text-xs text-muted-foreground">
          Reopening the page recalculates the current database checklist. It cannot verify live DNS propagation, login delivery, or end-to-end teaching and placement workflows.
        </p>
      </div>

      <section aria-label="Domain and tenant readiness verdicts"
        className="grid gap-3 border-y border-border py-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Heading level={2} size="sm">Domain login configuration</Heading>
          <StatusBadge tone={readinessGates.domainLoginReady===null?"warning":
            readinessGates.domainLoginReady?"success":"error"}>
            {readinessGates.domainLoginReady===null?"Unknown":
              readinessGates.domainLoginReady?"Configured":"Domain blockers"}
          </StatusBadge>
          <p className="text-xs text-body">
            Checks the verified primary domain and active college only; a
            missing TPO, programme or placement season does not block domain login.
            Live DNS and sign-in require separate verification.
          </p>
        </div>
        <div className="min-w-0 space-y-2">
          <Heading level={2} size="sm">Tenant setup completion</Heading>
          <StatusBadge tone={readinessGates.tenantSetupComplete===null?"warning":
            readinessGates.tenantSetupComplete?"success":"error"}>
            {readinessGates.tenantSetupComplete===null?"Incomplete evidence":
              readinessGates.tenantSetupComplete?"Persisted checks pass":"Setup requirements remaining"}
          </StatusBadge>
          <p className="text-xs text-body">
            All ten operational setup requirements are evaluated independently
            of domain login readiness.
          </p>
        </div>
      </section>
      <section
        aria-label="Readiness summary"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
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
        ].map(metric => <StatTile {...(collegeStyles["tile"] === undefined ? {} : {className:collegeStyles["tile"]})} key={metric.label} label={metric.label} value={metric.count}/>)}
      </section>

      <section aria-label="Must fix before launch" className="min-w-0 space-y-3 border-t border-border pt-6">
        <Heading level={2} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">Must fix before launch</Heading>
        {mustFix.length===0
          ?<p role="status" className="text-sm text-body">All persisted readiness checks pass. Runtime DNS, login, teaching and placement verification are still required before launch.</p>
          :<ul className="list-disc space-y-2 pl-6 text-sm text-body">
            {mustFix.map(check=><li key={check.id}>
              <span className="font-semibold">{check.label} — {check.status==="FAIL"?"Not ready":"Unverified"}</span>
              <p className="mt-1">{check.remediation}</p>
              <TextLink className="inline-flex min-h-11 md:min-h-9 items-center"
               href={readinessRemediationLink(check.id,college.id)}>Fix or verify this requirement →</TextLink>
            </li>)}
          </ul>}
      </section>
      <Disclosure title={<Heading level={2} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">Recommended setup</Heading>} className="min-w-0" contentClassName="space-y-[var(--lms-space-3)] pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
        
        {recommended.length?<ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-body">
          {recommended.map(item=><li key={item}>{item}</li>)}
        </ul>:<p role="status" className="mt-2 text-sm text-body">No additional configuration suggestions were detected from the two optional persisted sources.</p>}
        <p className="mt-2 text-xs text-muted-foreground">These suggestions are not extra checklist pass criteria. A runtime launch decision still requires separate operational verification.</p>
      </Disclosure>
      <section className="border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <Heading level={2} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">
            Go-live checks
          </Heading>
          <StatusBadge
            tone={overallTone(
              evaluation.overall,
            )}
          >
            {evaluation.counts.passed}/
            {evaluation.counts.total} passed
          </StatusBadge>
        </div>

        <form method="get" role="search" aria-label="Readiness check filters" className="mt-[var(--lms-space-4)] grid min-w-0 items-end gap-[8px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <Label stack className="w-full min-w-0 md:w-auto md:min-w-40">Show checks
            <Select name="status" defaultValue={parsed.status} className="min-h-11 md:min-h-9">
              <option value="ALL">All ten checks</option><option value="NEEDS_ATTENTION">Needs attention</option><option value="FAIL">Failed</option><option value="UNKNOWN">Unknown source</option><option value="PASS">Passed</option>
            </Select>
          </Label>
          <Label stack className="w-full min-w-0 md:w-auto md:min-w-40">Setup area
            <Select name="area" defaultValue={parsed.area} className="min-h-11 md:min-h-9">
              <option value="ALL">Every area</option><option value="LIFECYCLE">Tenant lifecycle</option><option value="ACADEMICS">Academic structure</option><option value="PEOPLE">College people</option><option value="PLACEMENTS">Placement readiness</option><option value="DOMAINS">Login domains</option>
            </Select>
          </Label><Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          <TextLink className="inline-flex min-h-11 md:min-h-9 items-center" href={"/admin/colleges/"+encodeURIComponent(college.id)+"/readiness"}>Clear</TextLink>
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
          <EmptyState title="No readiness checks match" description="No readiness checks match the selected status and area. The overall tenant readiness verdict above still uses all ten checks."/>
        ) : null}
        <ol className="mt-6 space-y-3">
          {shownChecks.map(
            (check, index) => (
              <li
                key={check.id}
                className="min-w-0 border-b border-border py-4 last:border-b-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Heading level={3} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] md:text-[var(--lms-font-lg)] md:leading-[26px]">
                      {index + 1}.{" "}
                      {check.label}
                    </Heading>

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
                    <TextLink href={readinessRemediationLink(check.id,college.id)} className="mt-2 inline-flex min-h-11 md:min-h-9 items-center">Open related setup →</TextLink>
                  </p>
                ) : null}
              </li>
            ),
          )}
        </ol>
      </section>

      <Disclosure title={<Heading level={2} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px]">Domain login readiness (legacy checks)</Heading>}
        className="min-w-0" contentClassName="space-y-3 pt-3 pb-4">
        <p className="text-sm text-body">Read-only persisted domain evidence, separate from the stricter operational go-live checklist. DNS and actual login must still be tested.</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["College",legacyDomainReadiness.meta.collegeName],
            ["College unique ID",legacyDomainReadiness.meta.uniqueId],
            ["Organization ID",legacyDomainReadiness.meta.organizationId],
            ["Domains",legacyDomainReadiness.meta.domainTotal],
            ["Verified domains",legacyDomainReadiness.meta.domainVerified],
            ["Primary domains",legacyDomainReadiness.meta.domainPrimary],
            ["Verification required",legacyDomainReadiness.meta.requireVerifiedDomains?"Yes":"No"],
          ].map(([label,value])=><div key={String(label)}>
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="break-words">{value===null?"Unknown — source unavailable":value}</dd>
          </div>)}
        </dl>
        <p role="status" className="text-sm font-semibold">
          {legacyDomainReadiness.readyForDomainLogin===null?"Unknown — domain source unavailable":
           legacyDomainReadiness.readyForDomainLogin?"No stored domain blockers":"Domain login configuration has blockers"}
        </p>
        <p className="text-sm">Domain-login verdict (legacy gate): <strong>{legacyDomainLoginVerdict(legacyDomainReadiness)}</strong>.
          UNKNOWN means the domain evidence could not be read; it is not the same as READY_WITH_WARNINGS.</p>
        {legacyDomainReadiness.blockers.length?<p className="text-sm text-error">Blockers: {legacyDomainReadiness.blockers.join(", ")}</p>:null}
        {legacyDomainReadiness.warnings.length?<p className="text-sm text-warning">Warnings: {legacyDomainReadiness.warnings.join(", ")}</p>:null}
        {legacyDomainReadiness.recommendedActions.length?<ul className="list-disc space-y-1 pl-5 text-sm">
          {legacyDomainReadiness.recommendedActions.map(action=><li key={action}>{action}</li>)}
        </ul>:null}
      </Disclosure>
      <Disclosure title={<Heading level={2} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">
          Additional setup evidence
        </Heading>} className="min-w-0" contentClassName="space-y-[var(--lms-space-3)] pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
        

        <p className="mt-2 text-sm leading-6 text-body">
          The following sources are inspected but do
          not independently block the ten-check
          readiness summary. Their presence does not
          prove teaching schedules, attendance workflows
          or runtime access are functional.
        </p>

        <dl className="mt-4 grid gap-4 md:grid-cols-2">
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
      </Disclosure>

      <Disclosure title={<Heading level={2} className="m-0 text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">
          Readiness interpretation
        </Heading>} className="min-w-0" contentClassName="space-y-[var(--lms-space-3)] pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">

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
      </Disclosure>
      <div className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
      <ButtonLink variant="secondary" href={"/api/admin/colleges/"+encodeURIComponent(college.id)+"/readiness/export"}>Export all persisted readiness checks (CSV) →</ButtonLink>
      <p className="text-xs text-muted-foreground">Export includes all ten persisted checks even when the page filter hides some; runtime verification is not certified.</p>
      </div>
    </div>
  );
}
