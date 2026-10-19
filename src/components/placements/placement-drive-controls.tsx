"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { PlacementCandidateEvidenceEditor } from "./placement-candidate-evidence-editor";
import type { TpoDriveScheduleWarnings } from "@/modules/placements/tpo-drive-schedule-warnings-model";
import {projectTpoRoundFacts} from "@/modules/placements/tpo-round-facts-model";

type RoundKind =
  | "TALK"
  | "TEST"
  | "VENDOR_TEST"
  | "GD"
  | "INTERVIEW";
type RoundMode = "ON_CAMPUS" | "VIRTUAL";
type ResultOutcome =
  | "PASS"
  | "FAIL"
  | "HOLD"
  | "ABSENT";

type EvaluationRound = {
  id: string;
  sequence: number;
  kind: RoundKind;
  name: string;
  whatToBring: string | null;
  platform: string | null;
  testUrl: string | null;
  durationMinutes: number | null;
  status: string;
};

type EligibilityReview = {
  status:
    | "ELIGIBLE"
    | "ELIGIBLE_WITH_MISSING_EVIDENCE"
    | "NEEDS_DATA"
    | "INELIGIBLE";
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

type ScreeningItem = {
  applicationId: string;
  membershipId: string;
  roleTitle: string;
  status: "PENDING" | "HOLD" | "SHORTLISTED" | "REJECTED";
  candidateMessage: string | null;
  internalReason: string | null;
  candidate: {
    displayName: string | null;
    email: string | null;
    phoneE164: string | null;
  };
};

type DriveRound = {
  id: string;
  sequence: number;
  kind: RoundKind;
  name: string;
  status: string;
  scheduledAt: string | null;
  timezone: string | null;
  mode: RoundMode | null;
  venue: string | null;
  meetingUrl: string | null;
  resultsDueAt: string | null;
  platform: string | null;
  testUrl: string | null;
  durationMinutes: number | null;
  whatToBring: string | null;
  participants: Array<{
    applicationId: string;
    roleTitle: string;
    displayName: string | null;
    email: string | null;
    result: {
      id: string;
      status: string;
      outcome: ResultOutcome;
      waitlistRank: number | null;
      scorePercent: number | null;
      reasonCategory:
        | "APTITUDE"
        | "TECHNICAL"
        | "COMMUNICATION"
        | "OTHER"
        | null;
      candidateMessage: string | null;
      internalComment: string | null;
    } | null;
  }>;
};

export type PlacementDriveControlData = {
  jobId: string;
  jobStatus: string;
  evaluation: {
    state: string;
    editable: boolean;
    rounds: EvaluationRound[];
  };
  screening: ScreeningItem[];
  rounds: DriveRound[];
};

type EvaluationDraft = Omit<
  EvaluationRound,
  "sequence" | "status"
>;

type ScreeningDraft = {
  candidateMessage: string;
  internalReason: string;
};

type ScheduleDraft = {
  scheduledAt: string;
  resultsDueAt: string;
  mode: RoundMode;
  venue: string;
  meetingUrl: string;
  cancelReason: string;
};

type ResultDraft = {
  outcome: ResultOutcome;
  waitlistRank: string;
  scorePercent: string;
  reasonCategory: string;
  candidateMessage: string;
  internalComment: string;
};

const inputClass = "w-full";
const textareaClass = "min-h-20 w-full";

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

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
}

async function mutate(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined
        ? undefined
        : {
            "content-type":
              "application/json",
          },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
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

function FieldLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="mb-1.5 block text-xs font-semibold text-body">
      {children}
    </span>
  );
}

export function PlacementDriveControls({
  data,
  scheduleWarnings,
}: {
  data: PlacementDriveControlData;
  scheduleWarnings?: TpoDriveScheduleWarnings;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingKey, setPendingKey] =
    useState<string | null>(null);
  const [presetToReplace,setPresetToReplace] = useState<{label:string;rounds:Array<[RoundKind,string]>}|null>(null);
  const [evaluationRounds, setEvaluationRounds] =
    useState<EvaluationDraft[]>(
      data.evaluation.rounds.map((round) => ({
        id: round.id,
        kind: round.kind,
        name: round.name,
        whatToBring: round.whatToBring,
        platform: round.platform,
        testUrl: round.testUrl,
        durationMinutes: round.durationMinutes,
      })),
    );
  const [screeningDrafts, setScreeningDrafts] =
    useState<Record<string, ScreeningDraft>>(
      Object.fromEntries(
        data.screening.map((item) => [
          item.applicationId,
          {
            candidateMessage:
              item.candidateMessage ?? "",
            internalReason:
              item.internalReason ?? "",
          },
        ]),
      ),
    );
  const [
    eligibilityReviews,
    setEligibilityReviews,
  ] = useState<
    Record<string, EligibilityReview>
  >({});
  const [
    overrideReasons,
    setOverrideReasons,
  ] = useState<Record<string, string>>({});

  const [scheduleDrafts, setScheduleDrafts] =
    useState<Record<string, ScheduleDraft>>(
      Object.fromEntries(
        data.rounds.map((round) => [
          round.id,
          {
            scheduledAt: toLocalInput(
              round.scheduledAt,
            ),
            resultsDueAt: toLocalInput(
              round.resultsDueAt,
            ),
            mode: round.mode ?? "ON_CAMPUS",
            venue: round.venue ?? "",
            meetingUrl: round.meetingUrl ?? "",
            cancelReason: "",
          },
        ]),
      ),
    );
  const initialResultDrafts = useMemo(() => {
    const entries: Array<
      [string, ResultDraft]
    > = [];
    for (const round of data.rounds) {
      for (const participant of round.participants) {
        const result = participant.result;
        entries.push([
          round.id +
            ":" +
            participant.applicationId,
          {
            outcome: result?.outcome ?? "PASS",
            waitlistRank:
              result?.waitlistRank?.toString() ?? "",
            scorePercent:
              result?.scorePercent?.toString() ?? "",
            reasonCategory:
              result?.reasonCategory ?? "",
            candidateMessage:
              result?.candidateMessage ?? "",
            internalComment:
              result?.internalComment ?? "",
          },
        ]);
      }
    }
    return Object.fromEntries(entries);
  }, [data.rounds]);
  const [resultDrafts, setResultDrafts] =
    useState<Record<string, ResultDraft>>(
      initialResultDrafts,
    );

  function success(
    title: string,
    description: string,
  ) {
    showToast({
      tone: "success",
      title,
      description,
    });
    router.refresh();
  }

  function failure(
    title: string,
    error: unknown,
  ) {
    showToast({
      tone: "error",
      title,
      description:
        error instanceof Error
          ? humanize(error.message)
          : "Please try again.",
    });
  }

  async function saveEvaluation() {
    setPendingKey("evaluation");
    try {
      await mutate(
        `/api/placements/jobs/${data.jobId}/evaluation-config`,
        "PUT",
        {
          rounds: evaluationRounds.map(
            (round) => ({
              ...round,
              whatToBring:
                round.whatToBring?.trim() || null,
              platform:
                round.platform?.trim() || null,
              testUrl:
                round.testUrl?.trim() || null,
              durationMinutes:
                round.durationMinutes || null,
            }),
          ),
        },
      );
      success(
        "Evaluation plan saved",
        "The round plan was updated atomically.",
      );
    } catch (error) {
      failure(
        "Could not save evaluation plan",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function decideScreening(
    applicationId: string,
    decision:
      | "HOLD"
      | "SHORTLISTED"
      | "REJECTED",
  ) {
    const draft =
      screeningDrafts[applicationId] ?? {
        candidateMessage: "",
        internalReason: "",
      };
    if (
      decision === "REJECTED" &&
      !draft.candidateMessage.trim()
    ) {
      failure(
        "Candidate message required",
        new Error(
          "Rejected candidates require a candidate-facing message",
        ),
      );
      return;
    }
    if (
      decision === "HOLD" &&
      !draft.internalReason.trim()
    ) {
      failure(
        "Internal reason required",
        new Error(
          "Hold decisions require an internal reason",
        ),
      );
      return;
    }

    const key =
      "screening:" +
      applicationId +
      ":" +
      decision;
    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/applications/${applicationId}/screening/actions`,
        "POST",
        {
          decision,
          candidateMessage:
            draft.candidateMessage.trim() ||
            null,
          internalReason:
            draft.internalReason.trim() ||
            null,
        },
      );
      success(
        "Screening updated",
        `Candidate moved to ${humanize(decision)}.`,
      );
    } catch (error) {
      failure("Screening update failed", error);
    } finally {
      setPendingKey(null);
    }
  }

  async function loadEligibility(
    membershipId: string,
  ) {
    const key =
      "eligibility:" + membershipId;
    setPendingKey(key);
    try {
      const response = await fetch(
        `/api/placements/jobs/${data.jobId}/eligibility/${membershipId}`,
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | {
            eligibility?: EligibilityReview;
            error?: string;
          }
        | null;
      if (
        !response.ok ||
        !payload?.eligibility
      ) {
        throw new Error(
          payload?.error ??
            "Eligibility review could not be loaded.",
        );
      }
      setEligibilityReviews(
        (current) => ({
          ...current,
          [membershipId]:
            payload.eligibility!,
        }),
      );
    } catch (error) {
      failure(
        "Could not load eligibility",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function setEligibilityDecision(
    membershipId: string,
    decision: "INCLUDE" | "EXCLUDE",
  ) {
    const reason =
      overrideReasons[membershipId]?.trim() ??
      "";
    if (!reason) {
      failure(
        "Override reason required",
        new Error(
          "Every manual eligibility override requires a reason",
        ),
      );
      return;
    }

    const key =
      "override:" +
      membershipId +
      ":" +
      decision;
    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/jobs/${data.jobId}/eligibility/${membershipId}`,
        "PUT",
        { decision, reason },
      );
      await loadEligibility(membershipId);
      success(
        decision === "INCLUDE"
          ? "Candidate included"
          : "Candidate excluded",
        "The reasoned manual override is now part of the eligibility decision.",
      );
    } catch (error) {
      failure(
        "Eligibility override failed",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function revokeEligibilityDecision(
    membershipId: string,
  ) {
    const key =
      "override-revoke:" + membershipId;
    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/jobs/${data.jobId}/eligibility/${membershipId}`,
        "DELETE",
      );
      await loadEligibility(membershipId);
      success(
        "Override removed",
        "Eligibility is back to the deterministic academic rules.",
      );
    } catch (error) {
      failure(
        "Could not remove override",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function scheduleRound(
    roundId: string,
  ) {
    const draft = scheduleDrafts[roundId];
    if (!draft?.scheduledAt) {
      failure(
        "Schedule time required",
        new Error(
          "Choose a date and time for the round",
        ),
      );
      return;
    }
    if (
      draft.mode === "ON_CAMPUS" &&
      !draft.venue.trim()
    ) {
      failure(
        "Venue required",
        new Error(
          "On-campus rounds require a venue",
        ),
      );
      return;
    }
    if (
      draft.mode === "VIRTUAL" &&
      !draft.meetingUrl.trim()
    ) {
      failure(
        "Meeting URL required",
        new Error(
          "Virtual rounds require a meeting URL",
        ),
      );
      return;
    }

    const key = "schedule:" + roundId;
    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/rounds/${roundId}/actions`,
        "POST",
        {
          action: "SCHEDULE",
          scheduledAt: new Date(
            draft.scheduledAt,
          ).toISOString(),
          timezone:
            Intl.DateTimeFormat().resolvedOptions()
              .timeZone || "Asia/Kolkata",
          mode: draft.mode,
          venue:
            draft.mode === "ON_CAMPUS"
              ? draft.venue.trim()
              : null,
          meetingUrl:
            draft.mode === "VIRTUAL"
              ? draft.meetingUrl.trim()
              : null,
          resultsDueAt: draft.resultsDueAt
            ? new Date(
                draft.resultsDueAt,
              ).toISOString()
            : null,
        },
      );
      success(
        "Round scheduled",
        "The drive timeline now reflects the confirmed schedule.",
      );
    } catch (error) {
      failure("Could not schedule round", error);
    } finally {
      setPendingKey(null);
    }
  }

  async function actOnRound(
    roundId: string,
    action: "COMPLETE" | "CANCEL",
  ) {
    const key =
      action.toLowerCase() + ":" + roundId;
    const draft = scheduleDrafts[roundId];
    if (
      action === "CANCEL" &&
      !draft?.cancelReason.trim()
    ) {
      failure(
        "Cancellation reason required",
        new Error(
          "Cancelling a round requires a reason",
        ),
      );
      return;
    }

    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/rounds/${roundId}/actions`,
        "POST",
        {
          action,
          ...(action === "CANCEL"
            ? {
                reason:
                  draft.cancelReason.trim(),
              }
            : {}),
        },
      );
      success(
        action === "COMPLETE"
          ? "Round completed"
          : "Round cancelled",
        action === "COMPLETE"
          ? "Results can now be applied after review."
          : "The cancellation is retained in the round audit trail.",
      );
    } catch (error) {
      failure(
        action === "COMPLETE"
          ? "Could not complete round"
          : "Could not cancel round",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function stageResult(
    roundId: string,
    applicationId: string,
  ) {
    const draft =
      resultDrafts[
        roundId + ":" + applicationId
      ];
    if (!draft) return;
    if (
      draft.outcome !== "PASS" &&
      !draft.candidateMessage.trim()
    ) {
      failure(
        "Candidate message required",
        new Error(
          "Non-pass results require a candidate-facing message",
        ),
      );
      return;
    }
    if (
      draft.outcome === "HOLD" &&
      !draft.waitlistRank
    ) {
      failure(
        "Waitlist rank required",
        new Error(
          "Hold results require a waitlist rank",
        ),
      );
      return;
    }

    const key =
      "result:" +
      roundId +
      ":" +
      applicationId;
    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/rounds/${roundId}/results`,
        "POST",
        {
          applicationId,
          outcome: draft.outcome,
          waitlistRank:
            draft.outcome === "HOLD"
              ? Number(draft.waitlistRank)
              : null,
          scorePercent: draft.scorePercent
            ? Number(draft.scorePercent)
            : null,
          reasonCategory:
            draft.reasonCategory || null,
          candidateMessage:
            draft.candidateMessage.trim() ||
            null,
          internalComment:
            draft.internalComment.trim() ||
            null,
        },
      );
      success(
        "Result staged",
        "Review it before applying; staged results do not advance candidates.",
      );
    } catch (error) {
      failure("Could not stage result", error);
    } finally {
      setPendingKey(null);
    }
  }

  async function applyResult(resultId: string) {
    const key = "apply-result:" + resultId;
    setPendingKey(key);
    try {
      await mutate(
        `/api/placements/results/${resultId}/actions`,
        "POST",
        { action: "APPLY" },
      );
      success(
        "Result applied",
        "Candidate progression now reflects the applied outcome.",
      );
    } catch (error) {
      failure("Could not apply result", error);
    } finally {
      setPendingKey(null);
    }
  }

  function applyRoundPreset(rounds:Array<[RoundKind,string]>){
    setEvaluationRounds(rounds.map(([kind,name])=>({
      id:crypto.randomUUID(),kind,name,whatToBring:null,
      platform:null,testUrl:null,
      durationMinutes:kind==="INTERVIEW"?45:60,
    })));
  }

  return (
    <>
    <div className="space-y-6">
      <section className="border-b border-border pb-6">
        <div className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-semibold text-foreground">
                Screening queue
              </h2>
              <p className="mt-1 text-sm text-body">
                Candidate-facing messages stay separate from internal review notes.
              </p>
            </div>
            <StatusBadge tone="info">
              {data.screening.filter(
                (item) =>
                  item.status === "PENDING" ||
                  item.status === "HOLD",
              ).length}{" "}
              open
            </StatusBadge>
          </div>
        </div>
        <div className="divide-y divide-border">
          {data.screening.length === 0 ? (
            <p className="m-0 px-5 py-6 text-sm text-muted-foreground">
              No submitted applications are waiting in this drive.
            </p>
          ) : (
            data.screening.map((item) => {
              const draft =
                screeningDrafts[
                  item.applicationId
                ] ?? {
                  candidateMessage: "",
                  internalReason: "",
                };
              const terminal =
                item.status === "SHORTLISTED" ||
                item.status === "REJECTED";
              return (
                <div
                  key={item.applicationId}
                  className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="m-0 font-semibold text-foreground">
                        {item.candidate
                          .displayName ??
                          "Learner"}
                      </p>
                      <StatusBadge tone="neutral">
                        {item.roleTitle}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          item.status ===
                          "SHORTLISTED"
                            ? "success"
                            : item.status ===
                                "REJECTED"
                              ? "error"
                              : "warning"
                        }
                      >
                        {humanize(item.status)}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-body">
                      {item.candidate.email ??
                        item.candidate.phoneE164 ??
                        "No contact on profile"}
                    </p>

                    <div className="mt-3 rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-3">
                      {eligibilityReviews[
                        item.membershipId
                      ] ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                              Eligibility
                            </span>
                            <StatusBadge
                              tone={
                                eligibilityReviews[
                                  item.membershipId
                                ]!.status ===
                                "ELIGIBLE"
                                  ? "success"
                                  : eligibilityReviews[
                                        item.membershipId
                                      ]!.status ===
                                      "INELIGIBLE"
                                    ? "error"
                                    : "warning"
                              }
                            >
                              {humanize(
                                eligibilityReviews[
                                  item.membershipId
                                ]!.status,
                              )}
                            </StatusBadge>
                          </div>

                          {eligibilityReviews[
                            item.membershipId
                          ]!.override ? (
                            <p className="mt-2 text-xs leading-5 text-body">
                              Manual{" "}
                              {eligibilityReviews[
                                item.membershipId
                              ]!.override!.decision.toLowerCase()}
                              :{" "}
                              {
                                eligibilityReviews[
                                  item.membershipId
                                ]!.override!.reason
                              }
                            </p>
                          ) : null}

                          {eligibilityReviews[
                            item.membershipId
                          ]!.checks.some(
                            (check) =>
                              check.status !== "PASS",
                          ) ? (
                            <div className="mt-2 grid gap-1">
                              {eligibilityReviews[
                                item.membershipId
                              ]!.checks
                                .filter(
                                  (check) =>
                                    check.status !==
                                    "PASS",
                                )
                                .map((check) => (
                                  <p
                                    key={
                                      check.criterion
                                    }
                                    className="m-0 text-xs leading-5 text-body"
                                  >
                                    <span className="font-semibold text-foreground">
                                      {
                                        check.criterion
                                      }
                                    </span>
                                    :{" "}
                                    {check.status ===
                                    "MISSING"
                                      ? "missing"
                                      : `${String(
                                          check.actual,
                                        )} vs ${String(
                                          check.required,
                                        )}`}
                                  </p>
                                ))}
                            </div>
                          ) : null}

                          <div className="mt-3 grid gap-2">
                            <Input
                              className={inputClass}
                              maxLength={1000}
                              value={
                                overrideReasons[
                                  item.membershipId
                                ] ?? ""
                              }
                              onChange={(event) =>
                                setOverrideReasons(
                                  (current) => ({
                                    ...current,
                                    [item.membershipId]:
                                      event.target
                                        .value,
                                  }),
                                )
                              }
                              placeholder="Required reason for manual include/exclude"
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={
                                  pendingKey !==
                                  null
                                }
                                onClick={() =>
                                  setEligibilityDecision(
                                    item.membershipId,
                                    "INCLUDE",
                                  )
                                }
                              >
                                Force include
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={
                                  pendingKey !==
                                  null
                                }
                                onClick={() =>
                                  setEligibilityDecision(
                                    item.membershipId,
                                    "EXCLUDE",
                                  )
                                }
                              >
                                Force exclude
                              </Button>
                              {eligibilityReviews[
                                item.membershipId
                              ]!.override ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={
                                    pendingKey !==
                                    null
                                  }
                                  onClick={() =>
                                    revokeEligibilityDecision(
                                      item.membershipId,
                                    )
                                  }
                                >
                                  Remove override
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={
                            pendingKey !== null
                          }
                          onClick={() =>
                            loadEligibility(
                              item.membershipId,
                            )
                          }
                        >
                          Review eligibility
                        </Button>
                      )}

                      <PlacementCandidateEvidenceEditor
                        membershipId={
                          item.membershipId
                        }
                        onSaved={() =>
                          loadEligibility(
                            item.membershipId,
                          )
                        }
                      />
                    </div>
                  </div>
                  {terminal ? (
                    <p className="m-0 text-sm text-muted-foreground">
                      Decision is final in the current screening state machine.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      <label>
                        <FieldLabel>
                          Candidate message
                        </FieldLabel>
                        <Textarea
                          className={
                            textareaClass
                          }
                          maxLength={1000}
                          value={
                            draft.candidateMessage
                          }
                          onChange={(event) =>
                            setScreeningDrafts(
                              (current) => ({
                                ...current,
                                [item.applicationId]:
                                  {
                                    ...draft,
                                    candidateMessage:
                                      event.target
                                        .value,
                                  },
                              }),
                            )
                          }
                          placeholder="Shown to the learner for shortlist or rejection."
                        />
                      </label>
                      <label>
                        <FieldLabel>
                          Internal reason
                        </FieldLabel>
                        <Textarea
                          className={
                            textareaClass
                          }
                          maxLength={2000}
                          value={
                            draft.internalReason
                          }
                          onChange={(event) =>
                            setScreeningDrafts(
                              (current) => ({
                                ...current,
                                [item.applicationId]:
                                  {
                                    ...draft,
                                    internalReason:
                                      event.target
                                        .value,
                                  },
                              }),
                            )
                          }
                          placeholder="Placement-team note; not shown to the learner."
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={
                            pendingKey !== null
                          }
                          onClick={() =>
                            decideScreening(
                              item.applicationId,
                              "SHORTLISTED",
                            )
                          }
                        >
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={
                            pendingKey !== null
                          }
                          onClick={() =>
                            decideScreening(
                              item.applicationId,
                              "HOLD",
                            )
                          }
                        >
                          Hold
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={
                            pendingKey !== null
                          }
                          onClick={() =>
                            decideScreening(
                              item.applicationId,
                              "REJECTED",
                            )
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="border-b border-border pb-6">
        <div className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-semibold text-foreground">
                Evaluation plan
              </h2>
              <p className="mt-1 text-sm text-body">
                One atomic round plan; it locks as soon as execution starts.
              </p>
            </div>
            <StatusBadge
              tone={
                data.evaluation.editable
                  ? "info"
                  : "neutral"
              }
            >
              {humanize(
                data.evaluation.state,
              )}
            </StatusBadge>
          </div>
        </div>
        <div className="grid gap-4 pt-4">
          {evaluationRounds.map(
            (round, index) => (
              <div
                key={round.id}
                className="grid gap-3 border-b border-border py-4 lg:grid-cols-[5rem_10rem_minmax(12rem,1fr)_8rem_auto]"
              >
                <div className="flex min-h-10 items-center text-sm font-semibold text-muted-foreground">
                  Round {index + 1}
                </div>
                <Select
                  className={inputClass}
                  disabled={
                    !data.evaluation.editable
                  }
                  value={round.kind}
                  onChange={(event) =>
                    setEvaluationRounds(
                      (current) =>
                        current.map(
                          (item) =>
                            item.id ===
                            round.id
                              ? {
                                  ...item,
                                  kind: event
                                    .target
                                    .value as RoundKind,
                                }
                              : item,
                        ),
                    )
                  }
                >
                  <option value="TALK">
                    Talk
                  </option>
                  <option value="TEST">
                    Test
                  </option>
                  <option value="VENDOR_TEST">
                    Vendor test
                  </option>
                  <option value="GD">
                    Group discussion
                  </option>
                  <option value="INTERVIEW">
                    Interview
                  </option>
                </Select>
                <Input
                  className={inputClass}
                  disabled={
                    !data.evaluation.editable
                  }
                  maxLength={100}
                  value={round.name}
                  onChange={(event) =>
                    setEvaluationRounds(
                      (current) =>
                        current.map(
                          (item) =>
                            item.id ===
                            round.id
                              ? {
                                  ...item,
                                  name: event
                                    .target
                                    .value,
                                }
                              : item,
                        ),
                    )
                  }
                  placeholder="Round name"
                />
                <Input
                  className={inputClass}
                  disabled={
                    !data.evaluation.editable
                  }
                  type="number"
                  min={1}
                  max={1440}
                  value={
                    round.durationMinutes ??
                    ""
                  }
                  onChange={(event) =>
                    setEvaluationRounds(
                      (current) =>
                        current.map(
                          (item) =>
                            item.id ===
                            round.id
                              ? {
                                  ...item,
                                  durationMinutes:
                                    event
                                      .target
                                      .value
                                      ? Number(
                                          event
                                            .target
                                            .value,
                                        )
                                      : null,
                                }
                              : item,
                        ),
                    )
                  }
                  placeholder="Minutes"
                />
                {data.evaluation.editable ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEvaluationRounds(
                        (current) =>
                          current.filter(
                            (item) =>
                              item.id !==
                              round.id,
                          ),
                      )
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ),
          )}
          {data.evaluation.editable ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setEvaluationRounds(
                    (current) => [
                      ...current,
                      {
                        id: crypto.randomUUID(),
                        kind: "INTERVIEW",
                        name: "Interview",
                        whatToBring: null,
                        platform: null,
                        testUrl: null,
                        durationMinutes: 45,
                      },
                    ],
                  )
                }
              >
                Add round
              </Button>
              {([
                ["Talk, Test, Interview", [["TALK", "Talk"], ["TEST", "Test"], ["INTERVIEW", "Interview"]]],
                ["Test, Technical, HR", [["TEST", "Test"], ["INTERVIEW", "Technical"], ["INTERVIEW", "HR"]]],
                ["Test, GD, Interview", [["TEST", "Test"], ["GD", "Group discussion"], ["INTERVIEW", "Interview"]]],
              ] as Array<[string, Array<[RoundKind, string]>]>).map(([label, rounds]) => (
                <Button
                  key={label}
                  size="sm"
                  variant="secondary"
                  disabled={pendingKey !== null}
                  onClick={() => {
                    if(evaluationRounds.length>0){
                      setPresetToReplace({label,rounds});
                      return;
                    }
                    applyRoundPreset(rounds);
                  }}
                >
                  Start with: {label}
                </Button>
              ))}
              <Button
                size="sm"
                disabled={
                  pendingKey !== null ||
                  evaluationRounds.some(
                    (round) =>
                      !round.name.trim(),
                  )
                }
                onClick={saveEvaluation}
              >
                {pendingKey ===
                "evaluation"
                  ? "Saving…"
                  : "Save evaluation plan"}
              </Button>
            </div>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">
              The plan is read-only because drive execution has started or the job is closed.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            Round operations & results
          </h2>
          <p className="mt-1 text-sm text-body">
            Stage results first. Applying a staged result is the explicit step that advances candidate progression.
          </p>
          {scheduleWarnings ? (
            <div className="mt-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3 text-sm text-body">
              {scheduleWarnings.state === "UNAVAILABLE"
                ? "Venue collision checking is unavailable. Do not assume the schedule is clear."
                : scheduleWarnings.state === "LIMITED"
                  ? "Venue collision scan was capped at 1,000 rounds. Results are incomplete."
                  : scheduleWarnings.collisions > 0 || scheduleWarnings.unknown > 0
                    ? String(scheduleWarnings.collisions) + " collision warning(s) and " +
                      String(scheduleWarnings.unknown) + " unassessable round(s) in this drive."
                    : "No persisted venue overlap was proven for the current drive within the assessed upcoming window. This is not schedule clearance."}
              {" "}
              <a href="/tpo/placements/schedule-conflicts?days=90"
                className="font-semibold text-primary-text hover:underline">
                Review college venue conflicts →
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                Persisted on-campus schedules only; unsaved form edits, student conflicts
                and dates outside the next 90 days are not assessed. Recheck after saving.
              </p>
            </div>
          ) : null}
        </div>
        {data.rounds.map((round) => {
          const schedule =
            scheduleDrafts[round.id];
          const facts = projectTpoRoundFacts(round);
          return (
            <article
              key={round.id}
              className="border-b border-border py-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Round {round.sequence} ·{" "}
                    {humanize(round.kind)}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {round.name}
                  </h3>
                </div>
                <StatusBadge
                  tone={
                    round.status ===
                    "COMPLETED"
                      ? "success"
                      : round.status ===
                          "SCHEDULED"
                        ? "info"
                        : "warning"
                  }
                >
                  {humanize(round.status)}
                </StatusBadge>
              </div>

              <dl aria-label={round.name+" round facts"} className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs text-body">Status</dt><dd className="font-semibold">{facts.status}</dd></div>
                <div><dt className="text-xs text-body">Mode</dt><dd>{facts.mode}</dd></div>
                <div><dt className="text-xs text-body">When</dt><dd>{facts.when}</dd></div>
                <div><dt className="text-xs text-body">Venue or meeting link</dt><dd className="break-words">{round.mode==="VIRTUAL"&&round.meetingUrl?
                  <a href={round.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-text underline">Open meeting link</a>:facts.place}</dd></div>
                <div><dt className="text-xs text-body">Students in this round</dt>
                  <dd><a className="font-semibold text-primary-text underline"
                    href={"/tpo/placements/jobs/"+encodeURIComponent(data.jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}>
                    {facts.students} · see who</a></dd>
                </div>
                <div><dt className="text-xs text-body">Results</dt><dd>{facts.results}</dd></div>
                <div><dt className="text-xs text-body">Results expected by</dt><dd>{facts.due}</dd></div>
                {facts.duration!=null?<div><dt className="text-xs text-body">Duration</dt><dd>{facts.duration} minutes</dd></div>:null}
                {facts.platform?<div><dt className="text-xs text-body">Test platform</dt><dd>{facts.platform}</dd></div>:null}
                {facts.testUrl?<div><dt className="text-xs text-body">Test link</dt><dd>
                  <a className="text-primary-text underline" target="_blank" rel="noopener noreferrer" href={facts.testUrl}>Open test</a>
                </dd></div>:null}
                {facts.bring?<div className="sm:col-span-2"><dt className="text-xs text-body">What to bring</dt><dd>{facts.bring}</dd></div>:null}
              </dl>

              {scheduleWarnings?.warnings
                .find((entry) => entry.roundId === round.id)?.messages.map((message) => (
                  <p key={message} role="status"
                    className="mt-3 rounded-[var(--lms-control-radius)] border border-border bg-muted p-3 text-sm text-warning">
                    {message}
                  </p>
                ))}

              {(round.status === "PENDING" ||
                round.status ===
                  "SCHEDULED") &&
              schedule ? (
                <details className="mt-4 rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    {round.status ===
                    "SCHEDULED"
                      ? "Reschedule / manage round"
                      : "Schedule round"}
                  </summary>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <label>
                      <FieldLabel>
                        Date & time
                      </FieldLabel>
                      <Input
                        className={
                          inputClass
                        }
                        type="datetime-local"
                        value={
                          schedule.scheduledAt
                        }
                        onChange={(event) =>
                          setScheduleDrafts(
                            (current) => ({
                              ...current,
                              [round.id]: {
                                ...schedule,
                                scheduledAt:
                                  event.target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <FieldLabel>
                        Mode
                      </FieldLabel>
                      <Select
                        className={
                          inputClass
                        }
                        value={schedule.mode}
                        onChange={(event) =>
                          setScheduleDrafts(
                            (current) => ({
                              ...current,
                              [round.id]: {
                                ...schedule,
                                mode: event
                                  .target
                                  .value as RoundMode,
                              },
                            }),
                          )
                        }
                      >
                        <option value="ON_CAMPUS">
                          On campus
                        </option>
                        <option value="VIRTUAL">
                          Virtual
                        </option>
                      </Select>
                    </label>
                    <label>
                      <FieldLabel>
                        Results due
                      </FieldLabel>
                      <Input
                        className={
                          inputClass
                        }
                        type="datetime-local"
                        value={
                          schedule.resultsDueAt
                        }
                        onChange={(event) =>
                          setScheduleDrafts(
                            (current) => ({
                              ...current,
                              [round.id]: {
                                ...schedule,
                                resultsDueAt:
                                  event.target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <FieldLabel>
                        Venue
                      </FieldLabel>
                      <Input
                        className={
                          inputClass
                        }
                        value={schedule.venue}
                        onChange={(event) =>
                          setScheduleDrafts(
                            (current) => ({
                              ...current,
                              [round.id]: {
                                ...schedule,
                                venue:
                                  event.target
                                    .value,
                              },
                            }),
                          )
                        }
                        placeholder="Main Auditorium"
                      />
                    </label>
                    <label>
                      <FieldLabel>
                        Meeting URL
                      </FieldLabel>
                      <Input
                        className={
                          inputClass
                        }
                        type="url"
                        value={
                          schedule.meetingUrl
                        }
                        onChange={(event) =>
                          setScheduleDrafts(
                            (current) => ({
                              ...current,
                              [round.id]: {
                                ...schedule,
                                meetingUrl:
                                  event.target
                                    .value,
                              },
                            }),
                          )
                        }
                        placeholder="https://…"
                      />
                    </label>
                    <label>
                      <FieldLabel>
                        Cancellation reason
                      </FieldLabel>
                      <Input
                        className={
                          inputClass
                        }
                        value={
                          schedule.cancelReason
                        }
                        onChange={(event) =>
                          setScheduleDrafts(
                            (current) => ({
                              ...current,
                              [round.id]: {
                                ...schedule,
                                cancelReason:
                                  event.target
                                    .value,
                              },
                            }),
                          )
                        }
                        placeholder="Required only to cancel"
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={
                        pendingKey !== null
                      }
                      onClick={() =>
                        scheduleRound(
                          round.id,
                        )
                      }
                    >
                      {round.status ===
                      "SCHEDULED"
                        ? "Save schedule"
                        : "Schedule round"}
                    </Button>
                    {round.status ===
                    "SCHEDULED" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={
                          pendingKey !== null
                        }
                        onClick={() =>
                          actOnRound(
                            round.id,
                            "COMPLETE",
                          )
                        }
                      >
                        Complete round
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={
                        pendingKey !== null
                      }
                      onClick={() =>
                        actOnRound(
                          round.id,
                          "CANCEL",
                        )
                      }
                    >
                      Cancel round
                    </Button>
                  </div>
                </details>
              ) : null}

              {round.kind !== "TALK" &&
              round.participants.length >
                0 ? (
                <div className="mt-5 grid gap-4">
                  {round.participants.map(
                    (participant) => {
                      const key =
                        round.id +
                        ":" +
                        participant.applicationId;
                      const draft =
                        resultDrafts[key] ?? {
                          outcome: "PASS",
                          waitlistRank: "",
                          scorePercent: "",
                          reasonCategory: "",
                          candidateMessage: "",
                          internalComment: "",
                        };
                      return (
                        <div
                          key={
                            participant.applicationId
                          }
                          className="rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="m-0 font-semibold text-foreground">
                                {participant.displayName ??
                                  "Learner"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {participant.email ??
                                  participant.applicationId}
                              </p>
                            </div>
                            {participant.result ? (
                              <StatusBadge
                                tone={
                                  participant
                                    .result
                                    .status ===
                                  "STAGED"
                                    ? "warning"
                                    : participant
                                          .result
                                          .outcome ===
                                        "PASS"
                                      ? "success"
                                      : "error"
                                }
                              >
                                {
                                  participant
                                    .result
                                    .status
                                }{" "}
                                ·{" "}
                                {
                                  participant
                                    .result
                                    .outcome
                                }
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="neutral">
                                No result
                              </StatusBadge>
                            )}
                          </div>
                          {participant.result
                            ?.status ===
                          "APPLIED" ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                              Applied results are immutable in this workflow.
                            </p>
                          ) : (
                            <>
                              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <label>
                                  <FieldLabel>
                                    Outcome
                                  </FieldLabel>
                                  <Select
                                    className={
                                      inputClass
                                    }
                                    value={
                                      draft.outcome
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setResultDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            outcome:
                                              event
                                                .target
                                                .value as ResultOutcome,
                                          },
                                        }),
                                      )
                                    }
                                  >
                                    <option value="PASS">
                                      Pass
                                    </option>
                                    <option value="FAIL">
                                      Fail
                                    </option>
                                    <option value="HOLD">
                                      Hold
                                    </option>
                                    <option value="ABSENT">
                                      Absent
                                    </option>
                                  </Select>
                                </label>
                                <label>
                                  <FieldLabel>
                                    Score %
                                  </FieldLabel>
                                  <Input
                                    className={
                                      inputClass
                                    }
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={
                                      draft.scorePercent
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setResultDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            scorePercent:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                  />
                                </label>
                                <label>
                                  <FieldLabel>
                                    Waitlist rank
                                  </FieldLabel>
                                  <Input
                                    className={
                                      inputClass
                                    }
                                    type="number"
                                    min={1}
                                    disabled={
                                      draft.outcome !==
                                      "HOLD"
                                    }
                                    value={
                                      draft.waitlistRank
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setResultDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            waitlistRank:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                  />
                                </label>
                                <label>
                                  <FieldLabel>
                                    Reason category
                                  </FieldLabel>
                                  <Select
                                    className={
                                      inputClass
                                    }
                                    value={
                                      draft.reasonCategory
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setResultDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            reasonCategory:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                  >
                                    <option value="">
                                      None
                                    </option>
                                    <option value="APTITUDE">
                                      Aptitude
                                    </option>
                                    <option value="TECHNICAL">
                                      Technical
                                    </option>
                                    <option value="COMMUNICATION">
                                      Communication
                                    </option>
                                    <option value="OTHER">
                                      Other
                                    </option>
                                  </Select>
                                </label>
                                <label className="md:col-span-2">
                                  <FieldLabel>
                                    Candidate message
                                  </FieldLabel>
                                  <Input
                                    className={
                                      inputClass
                                    }
                                    maxLength={1000}
                                    value={
                                      draft.candidateMessage
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setResultDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            candidateMessage:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                    placeholder="Required for fail, hold or absent"
                                  />
                                </label>
                                <label className="md:col-span-2 xl:col-span-3">
                                  <FieldLabel>
                                    Internal comment
                                  </FieldLabel>
                                  <Input
                                    className={
                                      inputClass
                                    }
                                    maxLength={2000}
                                    value={
                                      draft.internalComment
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setResultDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            internalComment:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                  />
                                </label>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={
                                    pendingKey !==
                                    null ||
                                    (round.status !==
                                      "SCHEDULED" &&
                                      round.status !==
                                        "COMPLETED")
                                  }
                                  onClick={() =>
                                    stageResult(
                                      round.id,
                                      participant.applicationId,
                                    )
                                  }
                                >
                                  Stage result
                                </Button>
                                {participant
                                  .result
                                  ?.status ===
                                  "STAGED" &&
                                round.status ===
                                  "COMPLETED" ? (
                                  <Button
                                    size="sm"
                                    disabled={
                                      pendingKey !==
                                      null
                                    }
                                    onClick={() =>
                                      applyResult(
                                        participant
                                          .result!.id,
                                      )
                                    }
                                  >
                                    Apply result
                                  </Button>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
    <ConfirmDialog open={presetToReplace!==null} onOpenChange={open=>{if(!open)setPresetToReplace(null);}}
      title={"Replace current round plan with "+(presetToReplace?.label??"preset")+"?"}
      description="The current draft round plan, including unsaved edits, will be replaced. Nothing is saved to the drive until you review and save the new plan."
      confirmLabel="Replace draft rounds" pending={pendingKey!==null} onConfirm={()=>{
        if(!presetToReplace||pendingKey!==null)return;
        applyRoundPreset(presetToReplace.rounds);setPresetToReplace(null);
      }}/>
    </>
  );
}
