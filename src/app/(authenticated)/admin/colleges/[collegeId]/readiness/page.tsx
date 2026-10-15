import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
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
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = await params;

  if (
    !collegeIdSchema.safeParse(collegeId).success
  ) {
    notFound();
  }

  const context =
    await getCurrentRequestContext();

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

  return (
    <div className="space-y-6">
      <Link
        href="/admin/colleges"
        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
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

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
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
            className="rounded-xl border border-border bg-surface p-4"
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

      <section className="rounded-xl border border-border bg-surface p-5">
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

        <p className="mt-2 text-sm leading-6 text-body">
          PASS means that the required record or state
          was found. FAIL means a known requirement was
          not satisfied. UNKNOWN means the underlying
          data could not be verified. An unknown check
          never counts as passed.
        </p>

        <ol className="mt-5 space-y-3">
          {evaluation.checks.map(
            (check, index) => (
              <li
                key={check.id}
                className="rounded-lg border border-border bg-surface-subtle p-4"
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
                    <Link href={readinessRemediationLink(check.id,college.id)} className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary-text underline">Open related setup →</Link>
                  </p>
                ) : null}
              </li>
            ),
          )}
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
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

      <section className="rounded-xl border border-border bg-surface-subtle p-5">
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
