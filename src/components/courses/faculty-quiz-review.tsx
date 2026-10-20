"use client";
import { Alert } from "@/components/ui/alert";


import {useEffect,useRef,useState} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { courseApiError } from "./learner-course-api";
import {
  quizReviewActions,
} from "./faculty-assessment-operation-model";

type AttemptAnswer = {
  id: string;
  questionId: string;
  promptSnapshot: string;
  pointsPossible: number;
  selectedOptionIds: string[];
  optionsSnapshot: Array<{
    id: string;
    text: string;
    sequence: number;
    correct: boolean;
  }>;
  correct: boolean;
  pointsAwarded: number;
};

type Attempt = {
  id: string;
  membershipId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  submittedAt: string;
  learnerDisplayName: string | null;
  learnerEmail: string | null;
  answers: AttemptAnswer[];
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function learnerLabel(attempt: Attempt) {
  return (
    attempt.learnerDisplayName?.trim() ||
    attempt.learnerEmail?.trim() ||
    `Learner ${attempt.membershipId.slice(0, 8)}`
  );
}

export function FacultyQuizReview({
  quizId,
  quizTitle,
  deliveryId,
  status,
  resultsPublished,
  deliveryOwned,
  updatedAt,
  deadlineReached = false,
  autoOpen=false,
}: {
  quizId: string;
  quizTitle?:string;
  deliveryId: string;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "CLOSED"
    | "ARCHIVED";
  resultsPublished: boolean;
  deliveryOwned: boolean;
  updatedAt:string;
  deadlineReached?:boolean;
  autoOpen?:boolean;
}) {
  const router = useRouter();
  const openedOnce=useRef(false);
  const resultUpdatePending=useRef(false);
  const actions = quizReviewActions({
    deliveryOwned,
    status,
    resultsPublished,
    deadlineReached,
  });
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] =
    useState<Attempt[] | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [savingResults, setSavingResults] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const [confirmPublished,setConfirmPublished]=useState<boolean|null>(null);

  useEffect(()=>{
    if(autoOpen&&actions.canReviewAttempts&&!openedOnce.current){
      openedOnce.current=true;
      void load();
    }
  },[autoOpen,actions.canReviewAttempts]);
  if (!actions.canReviewAttempts) {
    return null;
  }

  async function load() {
    setOpen(true);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/courses/quiz-attempts?quizId=${encodeURIComponent(
          quizId,
        )}&deliveryId=${encodeURIComponent(
          deliveryId,
        )}`,
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      const payload =
        (await response.json()) as {
          attempts: Attempt[];
        };
      setAttempts(payload.attempts);
    } catch {
      setError(
        "Could not load Quiz attempts. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function setResults(
    published: boolean,
  ) {
    if (resultUpdatePending.current) return;
    resultUpdatePending.current=true;
    setError(null);setNotice(null);
    setSavingResults(true);

    try {
      const response = await fetch(
        `/api/courses/quizzes/${quizId}/faculty-results`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            deliveryId,
            action:published?"PUBLISH":"HIDE",
            expectedUpdatedAt:updatedAt,
            confirmed:true,
          }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      setNotice(published?"Results released successfully.":"Results withheld successfully.");
      router.refresh();
    } catch {
      setError(
        "Could not update Quiz result visibility. Check your connection and try again.",
      );
    } finally {
      resultUpdatePending.current=false;
      setSavingResults(false);
      setConfirmPublished(null);
    }
  }

  return (
    <>
      {notice?<Alert tone="success" className="mt-[var(--lms-space-2)]">{notice}</Alert>:null}
      <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
        <Button
          size="md"
          className="min-h-11 md:min-h-[var(--lms-control-height)]"
          variant="secondary"
          onClick={load}
        >
          Submissions
        </Button>

        {actions.canPublishResults ? (
          <Button
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
            disabled={savingResults}
            onClick={() =>
              setConfirmPublished(true)
            }
          >
            {savingResults
              ? "Publishing…"
               : "Release results"}
          </Button>
        ) : null}

        {actions.canHideResults ? (
          <Button
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
            variant="ghost"
            disabled={savingResults}
            onClick={() =>
              setConfirmPublished(false)
            }
          >
            {savingResults
              ? "Saving…"
              : "Withhold results"}
          </Button>
        ) : null}

        {status === "CLOSED" &&
        !deliveryOwned ? (
          <span className="text-xs text-muted-foreground">
            Shared-Offering result publication
            remains admin-owned.
          </span>
        ) : null}
      </div>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={quizTitle??"Submissions"}
        description="Review immutable Section-scoped attempts and choose whether released results are visible to learners."
      >
      <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">
            {quizTitle??"Submissions"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted scores and answer review are read from
            immutable submitted snapshots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.canPublishResults ? (
            <Button
              size="md"
              className="min-h-11 md:min-h-[var(--lms-control-height)]"
              disabled={savingResults}
              onClick={() =>
                setConfirmPublished(true)
              }
            >
              {savingResults
                ? "Publishing…"
                 : "Release results"}
            </Button>
          ) : null}
          {actions.canHideResults ? (
            <Button
              size="md"
              className="min-h-11 md:min-h-[var(--lms-control-height)]"
              variant="secondary"
              disabled={savingResults}
              onClick={() =>
                setConfirmPublished(false)
              }
            >
              {savingResults
                ? "Saving…"
                : "Withhold results"}
            </Button>
          ) : null}
          <Button
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
            variant="ghost"
            disabled={loading}
            onClick={load}
          >
            Refresh
          </Button>
          <span className="text-xs text-muted-foreground">
            Escape or close the drawer to return to the assessment list.
          </span>
        </div>
      </div>

      {loading ? <LoadingState label="Loading attempts…" /> : null}

      {error ? (
        <Alert tone="error" className="mt-[var(--lms-space-3)]">{error}</Alert>
      ) : null}

      {!loading && attempts && attempts.length === 0 ? (
        <EmptyState title="No submissions yet" description="" />
      ) : null}

      {!loading && attempts ? <p className="text-sm font-semibold text-foreground">{attempts.length} submission(s)</p> : null}
      {!loading && attempts &&
      attempts.length > 0 ? (
        <div className="mt-4 space-y-3">
          {attempts.map((attempt) => (
            <section
              key={attempt.id}
              className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
                    {learnerLabel(attempt)}
                  </h4>
                  {attempt.learnerEmail ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {attempt.learnerEmail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Attempt{" "}
                    {attempt.attemptNumber} ·{" "}
                    {formatDateTime(
                      attempt.submittedAt,
                    )}
                  </p>
                </div>
                <StatusBadge tone="info">
                  {attempt.score}/
                  {attempt.maxScore}
                </StatusBadge>
              </div>

              <div className="mt-4 space-y-3">
                {attempt.answers.map(
                  (answer, index) => (
                    <div
                      key={answer.id}
                      className="min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-3)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="m-0 text-sm font-semibold text-foreground">
                          {index + 1}.{" "}
                          {
                            answer.promptSnapshot
                          }
                        </p>
                        <StatusBadge
                          tone={
                            answer.correct
                              ? "success"
                              : "error"
                          }
                        >
                          {answer.correct
                            ? "Correct"
                            : "Incorrect"}{" "}
                          ·{" "}
                          {answer.pointsAwarded}/
                          {
                            answer.pointsPossible
                          }
                        </StatusBadge>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {answer.optionsSnapshot.map(
                          (option) => {
                            const selected =
                              answer.selectedOptionIds.includes(
                                option.id,
                              );
                            return (
                              <div
                                key={
                                  option.id
                                }
                                className="flex flex-wrap items-center gap-2 text-sm text-body"
                              >
                                <span
                                  aria-hidden="true"
                                  className="w-4 text-center font-bold"
                                >
                                  {option.correct
                                    ? "✓"
                                    : selected
                                      ? "•"
                                      : "–"}
                                </span>
                                <span>
                                  {option.text}
                                </span>
                                {selected ? (
                                  <span className="text-xs font-semibold text-primary-text">
                                    Learner selected
                                  </span>
                                ) : null}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      </div>
      </Drawer>
      <ConfirmDialog
        open={confirmPublished !== null}
        onOpenChange={nextOpen => { if (!nextOpen && !savingResults) setConfirmPublished(null); }}
        title={confirmPublished ? "Release quiz results" : "Withhold quiz results"}
        description={confirmPublished
          ? "Release results? Learners can view their scores and correct answers."
          : "Withhold results? Learners will no longer see scores or answers."}
        confirmLabel={confirmPublished ? "Release results" : "Withhold results"}
        confirmVariant={confirmPublished ? "primary" : "danger"}
        pending={savingResults}
        onConfirm={() => { if (confirmPublished !== null) void setResults(confirmPublished); }}
      />
    </>
  );
}
