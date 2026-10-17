"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { safeLearnerPlacementUrl } from "@/modules/placements/learner-job-detail-model";
import { learnerDriveApplyGate, learnerDriveApplySelectionSchema } from "@/modules/placements/learner-drive-apply-model";
import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
import {learnerJobDetailFromDrivesHref} from "@/modules/placements/learner-drives-return-model";
import {LearnerSaveDriveButton} from "@/components/placements/learner-save-drive-button";

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
    publishedAt?: string | null;
    stipendPerMonthInr?:number|null;
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
    fixedLpa?:string|null;
    variableLpa?:string|null;
    joiningBonusLpa?:string|null;
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
    return "Not disclosed";
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
  const [confirmation, setConfirmation] =
    useState<"WITHDRAW" | "EXTERNAL" | "INTERNAL" | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [showSharedDetails, setShowSharedDetails] = useState(false);
  const { job, roleOption, application } = item;
  const reason = withdrawReason.trim();
  const validWithdrawalReason = reason.length >= 3 && reason.length <= 900;

  async function apply(
    channel: "INTERNAL" | "EXTERNAL",
  ) {
    const preview=learnerDriveApplyGate({
      hasApplication:Boolean(application),deadlinePassed:item.deadlinePassed,
      canApply:item.canApply,applicationMode:job.applicationMode,channel,
    });
    const checked=learnerDriveApplySelectionSchema.safeParse({
      roleOptionId:roleOption.id,channel,confirmed:true,
    });
    if(preview!=="READY" || !checked.success) return;
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
      setConfirmation(null);
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
    if (!application || !validWithdrawalReason || pendingAction !== null) return;

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
      setConfirmation(null);
      setWithdrawReason("");
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
      <>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="success">
            Applied · {humanize(application.channel)}
          </StatusBadge>
          <Button
            size="sm"
            variant="secondary"
            disabled={pendingAction !== null}
            onClick={() => setConfirmation("WITHDRAW")}
          >
            Ask to withdraw
          </Button>
        </div>
        <Dialog
          open={confirmation === "WITHDRAW"}
          onOpenChange={(open) => {
            if (!open && pendingAction === null) setConfirmation(null);
          }}
          title="Withdraw Application"
          description={`Request to withdraw ${roleOption.title} at this employer. The placement team must review your request.`}
          footer={
            <>
              <Button variant="secondary" disabled={pendingAction !== null}
                onClick={() => setConfirmation(null)}>
                Keep application
              </Button>
              <Button
                disabled={!validWithdrawalReason || pendingAction !== null}
                onClick={() => void requestWithdrawal()}
              >
                {pendingAction === "WITHDRAW" ? "Submitting request…" : "Send withdrawal request"}
              </Button>
            </>
          }
        >
          <label htmlFor={`withdraw-reason-${roleOption.id}`}
            className="block text-sm font-semibold text-foreground">
            Reason for withdrawal
          </label>
          <textarea
            id={`withdraw-reason-${roleOption.id}`}
            value={withdrawReason}
            onChange={(event) => setWithdrawReason(event.target.value)}
            rows={4}
            maxLength={2000}
            disabled={pendingAction !== null}
            placeholder="Explain why you want to withdraw this application…"
            className="mt-2 min-h-28 w-full rounded-lg border border-border bg-surface p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            3–900 characters. Requesting withdrawal does not immediately
            remove your application or its results.
          </p>
          {reason.length > 0 && !validWithdrawalReason ? (
            <p role="alert" className="mt-2 text-sm text-warning">
              Enter at least three characters.
            </p>
          ) : null}
        </Dialog>
      </>
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
    const missing=item.eligibility.checks.filter(check=>check.status==="MISSING");
    const failed=item.eligibility.checks.filter(check=>check.status==="FAIL");
    return <div role="status" className="space-y-2 rounded-lg border border-border bg-surface-subtle p-3 text-sm">
      <p className="font-semibold text-foreground">You can’t apply to this drive</p>
      <p className="text-body">{item.eligibility.status==="NEEDS_DATA"
        ?"Some academic evidence is missing."
        :failed.length?"One or more college eligibility rules are not met.":"The placement cell has not cleared this application."}</p>
      {missing.length>0?<p className="text-xs text-body">Missing: {missing.map(row=>row.criterion).join(", ")}</p>:null}
      {failed.length>0?<p className="text-xs text-body">Not met: {failed.map(row=>row.criterion).join(", ")}</p>:null}
      <div className="flex flex-wrap gap-3">
        <Link href="/learn/my-placements#registration" className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Check registration</Link>
        <Link href="/learn/my-placements#placement-academic-evidence" className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Review academic evidence</Link>
      </div>
    </div>;
  }

  const safeExternalUrl = safeLearnerPlacementUrl(job.externalApplicationUrl);
  const externalAvailable =
    Boolean(safeExternalUrl) &&
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
          onClick={() => setConfirmation("INTERNAL")}
        >
          {pendingAction === "INTERNAL"
            ? "Applying…"
            : "Apply to this role"}
        </Button>
      ) : null}
      {externalAvailable ? (
        <>
          <a
            href={safeExternalUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Open employer form
          </a>
          <Button
            size="sm"
            variant="secondary"
            disabled={pendingAction !== null}
            onClick={() => setConfirmation("EXTERNAL")}
          >
            {pendingAction === "EXTERNAL"
              ? "Recording…"
              : "I applied externally"}
          </Button>
        </>
      ) : null}
      <Dialog
        open={confirmation === "INTERNAL"}
        onOpenChange={(open) => {if(!open && pendingAction===null)setConfirmation(null);}}
        title="Ready to apply?"
        description="We'll send your profile to the recruiter. You can withdraw later from Applications."
        footer={<>
          <Button variant="secondary" disabled={pendingAction!==null} onClick={()=>setConfirmation(null)}>Not yet</Button>
          <Button disabled={pendingAction!==null} onClick={()=>void apply("INTERNAL")}>
            {pendingAction==="INTERNAL"?"Submitting…":"Confirm & apply"}
          </Button>
        </>}
      >
        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface-subtle p-3 text-sm sm:grid-cols-3">
            <div><dt className="font-semibold text-muted-foreground">Role</dt>
              <dd className="mt-1 text-foreground">{roleOption.title}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Company</dt>
              <dd className="mt-1 text-foreground">{item.company.name}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Resume</dt>
              <dd className="mt-1 text-foreground">Not attached</dd></div>
          </dl>
          <button type="button" aria-expanded={showSharedDetails}
            onClick={()=>setShowSharedDetails(open=>!open)}
            className="min-h-10 font-semibold text-primary-text underline">
            {showSharedDetails?"Hide what gets shared":"What exactly gets shared?"}
          </button>
          {showSharedDetails?<ul className="list-disc space-y-2 pl-5 text-sm text-body">
            <li>Your contact details may be shared with the company by the placement cell. No resume is attached by this form.</li>
            <li>Your academic record is checked for eligibility; the record itself is not sent with this application.</li>
            <li>The placement cell can see your application and review your eligibility.</li>
          </ul>:null}
          <p className="text-xs text-muted-foreground">
            Eligibility and the application deadline are checked again when you confirm.
          </p>
        </div>
      </Dialog>
      <Dialog
        open={confirmation === "EXTERNAL"}
        onOpenChange={(open) => {
          if (!open && pendingAction === null) setConfirmation(null);
        }}
        title="Confirm your external application"
        description={`Record your application for ${roleOption.title} at ${item.company.name} in your LMS journey.`}
        footer={
          <>
            <Button variant="secondary" disabled={pendingAction !== null}
              onClick={() => setConfirmation(null)}>
              Not yet
            </Button>
            <Button disabled={pendingAction !== null}
              onClick={() => void apply("EXTERNAL")}>
              {pendingAction === "EXTERNAL" ? "Recording…" : "Yes, I submitted externally"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-body">
          Only confirm after completing the employer&apos;s form. This records a
          learner-declared external application, not an employer receipt or verified submission.
        </p>
      </Dialog>
    </div>
  );
}

function postedAtLabel(value: string | null | undefined): string {
  if (!value) return "Posted date not specified";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Posted date not specified";
  return "Posted " + new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeZone: "Asia/Kolkata",
  }).format(date);
}

export function LearnerPlacementJobs({
  items,snapshotNowIso=null,returnQuery="",savedJobIds=[],
}: {
  items: readonly LearnerPlacementJobItem[];
  snapshotNowIso?:string|null;
  returnQuery?:string;
  savedJobIds?:readonly string[];
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
                  <Link
                    href={learnerJobDetailFromDrivesHref(item.job.id,returnQuery) ?? "/learn/my-placements/jobs"}
                    className="underline-offset-2 hover:text-primary-text hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                    aria-label={`View ${item.roleOption.title} drive details at ${item.company.name}`}
                  >
                    {item.roleOption.title}
                  </Link>
                </h2>
                {item.roleOption.title !==
                item.job.title ? (
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    Drive · {item.job.title}
                  </p>
                ) : null}
                <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-6 text-body">
                  {item.job.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
              <LearnerSaveDriveButton jobId={item.job.id} jobTitle={item.job.title} initialSaved={savedJobIds.includes(item.job.id)}/>
               {item.application ? (
                 <StatusBadge tone={item.application.status==="SUBMITTED"?"success":"neutral"}>
                   {item.application.status==="SUBMITTED"?"Applied":humanize(item.application.status)}
                 </StatusBadge>
               ) : null}
              <StatusBadge
                tone={eligibilityTone(
                  item.eligibility.status,
                )}
              >
                {humanize(item.eligibility.status)}
              </StatusBadge>
              </div>
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
                <p className="mt-1 text-xs font-semibold text-body" role="status">
                  {learnerDriveDeadlineUrgency(item.job.applicationDeadline,
                    item.deadlinePassed,snapshotNowIso).label}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-muted-foreground">{postedAtLabel(item.job.publishedAt)}</p>
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
