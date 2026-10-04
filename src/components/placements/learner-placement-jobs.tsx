"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

type EligibilityStatus =
  | "ELIGIBLE"
  | "ELIGIBLE_WITH_MISSING_EVIDENCE"
  | "NEEDS_DATA"
  | "INELIGIBLE";

export type LearnerPlacementJobItem = {
  job: {
    id: string;
    title: string;
    description: string;
    employmentType: string;
    workMode: string;
    locations: string[];
    openings: number | null;
    minimumAnnualCtcInr: number | null;
    maximumAnnualCtcInr: number | null;
    applicationMode: string;
    externalApplicationUrl: string | null;
    applicationDeadline: string | null;
  };
  roleOption: {
    id: string;
    title: string;
    employmentType: string;
    workMode: string;
    locations: string[];
    openings: number | null;
    minimumAnnualCtcInr: number | null;
    maximumAnnualCtcInr: number | null;
    isPrimary: boolean;
  };
  company: {
    id: string;
    name: string;
    websiteUrl: string | null;
  };
  application: {
    id: string;
    channel: string;
    status: string;
    eligibilityStatus: string;
    submittedAt: string;
    withdrawnAt: string | null;
  } | null;
  eligibility: {
    status: EligibilityStatus;
    checks: Array<{
      criterion: string;
      status: "PASS" | "FAIL" | "MISSING";
      actual: string | number | null;
      required: string | number;
      detail: string;
    }>;
    override: {
      decision: "INCLUDE" | "EXCLUDE";
      reason: string;
    } | null;
  };
  deadlinePassed: boolean;
  canApply: boolean;
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function eligibilityTone(
  status: EligibilityStatus,
): "success" | "warning" | "error" | "info" {
  switch (status) {
    case "ELIGIBLE":
      return "success";
    case "ELIGIBLE_WITH_MISSING_EVIDENCE":
      return "warning";
    case "NEEDS_DATA":
      return "info";
    case "INELIGIBLE":
      return "error";
  }
}

function formatCtc(
  minimum: number | null,
  maximum: number | null,
) {
  if (minimum === null && maximum === null) {
    return "Compensation not published";
  }
  const lakh = (value: number) =>
    `₹${(value / 100_000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} LPA`;
  if (minimum !== null && maximum !== null) {
    return `${lakh(minimum)} – ${lakh(maximum)}`;
  }
  if (minimum !== null) {
    return `From ${lakh(minimum)}`;
  }
  return `Up to ${lakh(maximum!)}`;
}

function formatDeadline(value: string | null) {
  if (!value) return "No application deadline";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

async function placementMutation(
  url: string,
  body: unknown,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ??
        "Placement action could not be completed.",
    );
  }
  return payload;
}

function JobActions({
  item,
}: {
  item: LearnerPlacementJobItem;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] =
    useState<string | null>(null);
  const { job, roleOption, application } = item;

  async function apply(
    channel: "INTERNAL" | "EXTERNAL",
  ) {
    setPendingAction(channel);
    try {
      await placementMutation(
        `/api/placements/jobs/${job.id}/applications`,
        channel === "EXTERNAL"
          ? {
              roleOptionId: roleOption.id,
              channel,
              externalConfirmation: true,
            }
          : job.applicationMode === "HYBRID"
            ? {
                roleOptionId: roleOption.id,
                channel,
              }
            : {
                roleOptionId: roleOption.id,
              },
      );
      showToast({
        tone: "success",
        title:
          channel === "EXTERNAL"
            ? "External application recorded"
            : "Application submitted",
        description:
          channel === "EXTERNAL"
            ? "Your LMS placement timeline now reflects the employer application."
            : "Your application is now with the placement team.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Application not submitted",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function requestWithdrawal() {
    if (!application) return;
    const reason =
      window.prompt(
        "Why do you want to withdraw this application?",
      )?.trim() ?? "";
    if (reason.length < 3) return;

    setPendingAction("WITHDRAW");
    try {
      await placementMutation(
        "/api/placements/requests",
        {
          requestType:
            "APPLICATION_WITHDRAWAL",
          applicationId: application.id,
          reason,
        },
      );
      showToast({
        tone: "success",
        title: "Withdrawal requested",
        description:
          "Your placement team can review it without losing the application history.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not request withdrawal",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  if (application?.status === "SUBMITTED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="success">
          Applied · {humanize(application.channel)}
        </StatusBadge>
        <Button
          size="sm"
          variant="secondary"
          disabled={pendingAction !== null}
          onClick={requestWithdrawal}
        >
          {pendingAction === "WITHDRAW"
            ? "Requesting…"
            : "Request withdrawal"}
        </Button>
      </div>
    );
  }

  if (application?.status === "WITHDRAWN") {
    return (
      <StatusBadge tone="neutral">
        Withdrawn
      </StatusBadge>
    );
  }

  if (item.deadlinePassed) {
    return (
      <StatusBadge tone="neutral">
        Applications closed
      </StatusBadge>
    );
  }

  if (!item.canApply) {
    return (
      <p className="m-0 text-sm font-semibold text-body">
        {item.eligibility.status === "NEEDS_DATA"
          ? "Complete your placement academic evidence to apply."
          : "You do not currently meet this job's eligibility rules."}
      </p>
    );
  }

  const externalAvailable =
    Boolean(job.externalApplicationUrl) &&
    (job.applicationMode === "HYBRID" ||
      job.applicationMode === "EXTERNAL_ONLY");
  const internalAvailable =
    job.applicationMode === "INTERNAL" ||
    job.applicationMode === "HYBRID";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {internalAvailable ? (
        <Button
          size="sm"
          disabled={pendingAction !== null}
          onClick={() => apply("INTERNAL")}
        >
          {pendingAction === "INTERNAL"
            ? "Applying…"
            : "Apply in LMS"}
        </Button>
      ) : null}
      {externalAvailable ? (
        <>
          <a
            href={job.externalApplicationUrl!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Open employer form
          </a>
          <Button
            size="sm"
            variant="secondary"
            disabled={pendingAction !== null}
            onClick={() => apply("EXTERNAL")}
          >
            {pendingAction === "EXTERNAL"
              ? "Recording…"
              : "I applied externally"}
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function LearnerPlacementJobs({
  items,
}: {
  items: readonly LearnerPlacementJobItem[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No live opportunities yet"
        description="Published opportunities for your college will appear here with your eligibility and application state."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const failedChecks =
          item.eligibility.checks.filter(
            (check) => check.status === "FAIL",
          );
        const missingChecks =
          item.eligibility.checks.filter(
            (check) => check.status === "MISSING",
          );

        return (
          <article
            key={item.roleOption.id}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  {item.company.name}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {item.roleOption.title}
                </h2>
                {item.roleOption.title !==
                item.job.title ? (
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    Drive · {item.job.title}
                  </p>
                ) : null}
                <p className="mt-2 max-w-3xl text-sm leading-6 text-body">
                  {item.job.description}
                </p>
              </div>
              <StatusBadge
                tone={eligibilityTone(
                  item.eligibility.status,
                )}
              >
                {humanize(item.eligibility.status)}
              </StatusBadge>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="m-0 text-xs font-semibold text-muted-foreground">
                  Work
                </p>
                <p className="mt-1 font-semibold text-body">
                  {humanize(
                    item.roleOption.employmentType,
                  )}{" "}
                  ·{" "}
                  {humanize(
                    item.roleOption.workMode,
                  )}
                </p>
              </div>
              <div>
                <p className="m-0 text-xs font-semibold text-muted-foreground">
                  Location
                </p>
                <p className="mt-1 font-semibold text-body">
                  {item.roleOption.locations.length
                    ? item.roleOption.locations.join(", ")
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="m-0 text-xs font-semibold text-muted-foreground">
                  Compensation
                </p>
                <p className="mt-1 font-semibold text-body">
                  {formatCtc(
                    item.roleOption
                      .minimumAnnualCtcInr,
                    item.roleOption
                      .maximumAnnualCtcInr,
                  )}
                </p>
              </div>
              <div>
                <p className="m-0 text-xs font-semibold text-muted-foreground">
                  Deadline
                </p>
                <p className="mt-1 font-semibold text-body">
                  {formatDeadline(
                    item.job.applicationDeadline,
                  )}
                </p>
              </div>
            </div>

            {failedChecks.length > 0 ||
            missingChecks.length > 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Eligibility evidence
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {failedChecks.map((check) => (
                    <StatusBadge
                      key={check.criterion}
                      tone="error"
                    >
                      {check.criterion}: not met
                    </StatusBadge>
                  ))}
                  {missingChecks.map((check) => (
                    <StatusBadge
                      key={check.criterion}
                      tone="warning"
                    >
                      {check.criterion}: missing
                    </StatusBadge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-border pt-4">
              <JobActions item={item} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
