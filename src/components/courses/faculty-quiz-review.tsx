"use client";
import { Alert } from "@/components/ui/alert";

import {useEffect,useRef,useState} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
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
  const requests=useRef(0);
  const activeController=useRef<AbortController|null>(null);
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
    return ()=>{
      requests.current++;
      activeController.current?.abort();
      activeController.current=null;
    };
  },[quizId,deliveryId]);
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
    activeController.current?.abort();
    const controller=new AbortController();
    activeController.current=controller;
    const thisRequest=++requests.current;
    setOpen(true);
    setError(null);
    setLoading(true);
    setAttempts(null);

    try {
      const response = await fetch(
        `/api/courses/quiz-attempts?quizId=${encodeURIComponent(
          quizId,
        )}&deliveryId=${encodeURIComponent(
          deliveryId,
        )}`,
        {signal:controller.signal,cache:"no-store"},
      );

      if (thisRequest!==requests.current||controller.signal.aborted)return;
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
      if(!Array.isArray(payload.attempts)){
        setError("Unexpected submissions response. Please retry.");
        return;
      }
      if(thisRequest===requests.current&&!controller.signal.aborted)
        setAttempts(payload.attempts);
    } catch {
      if(controller.signal.aborted||thisRequest!==requests.current)return;
      setError(
        "Could not load Quiz attempts. Check your connection and try again.",
      );
    } finally {
      if(thisRequest===requests.current)setLoading(false);
    }
  }

  async function setResults(
    published: boolean,
  ) {
    if (resultUpdatePending.current) return;
    resultUpdatePending.current=true;
    const updateScope=quizId+"::"+deliveryId;
    setError(null);setNotice(published?"Releasing results…":"Withholding results…");
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

      if(updateScope!==quizId+"::"+deliveryId)return;
      setNotice(published?"Results released to students":"Results withheld");
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
      {notice?<Alert tone={savingResults?"info":"success"} className="mt-[var(--lms-space-2)]">{notice}</Alert>:null}
      <div className="mt-3 flex min-w-0 items-center gap-2">
        <Button size="md" className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
          variant="secondary" onClick={load}>Submissions</Button>
        {status === "CLOSED" && !deliveryOwned ? (
          <span className="text-xs text-muted-foreground">
            Shared-Offering result publication remains admin-owned.
          </span>
        ) : null}
      </div>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={quizTitle??"Submissions"}
        description="Review immutable Section-scoped attempts and choose whether released results are visible to learners."
      >
      <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[var(--lms-font-sm)] leading-5 text-[var(--lms-body-text)]">
            Submitted scores and answer review are read from
            immutable submitted snapshots.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
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
            loading={loading}
            onClick={load}
          >
            Refresh
          </Button>

        </div>
      </div>

      {loading ? <LoadingState label="Loading attempts…" /> : null}

      {error ? (
        <div className="space-y-2"><Alert tone="error" className="mt-[var(--lms-space-3)]">{error}</Alert><Button type="button" variant="secondary" onClick={()=>void load()} className="min-h-11 w-full sm:w-auto md:min-h-9">Refresh</Button></div>
      ) : null}

      {!loading && attempts && attempts.length === 0 ? (
        <EmptyState title="No submissions yet" action={<Button type="button" variant="secondary" onClick={()=>void load()} className="min-h-11 md:min-h-9">Refresh</Button>} />
      ) : null}

      {!loading && attempts && attempts.length > 0 ? <p className="text-sm font-semibold text-foreground leading-[22px]">{attempts.length} submission(s)</p> : null}
      {!loading && attempts &&
      attempts.length > 0 ? (
        <div className="mt-3 min-w-0 divide-y divide-border">
          {attempts.map((attempt) => (
            <section
              key={attempt.id}
              className="min-w-0 py-[var(--lms-space-4)]"
            >
              <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <h4 className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
                    {learnerLabel(attempt)}
                  </h4>
                  {attempt.learnerEmail ? (
                    <p className="mt-1 text-xs text-muted-foreground leading-5">
                      {attempt.learnerEmail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground leading-5">
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

              <Disclosure title="Review answers" className="mt-3" contentClassName="min-w-0 divide-y divide-border">
                {attempt.answers.map(
                  (answer, index) => (
                    <div
                      key={answer.id}
                      className="min-w-0 py-[var(--lms-space-3)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="m-0 text-sm font-semibold text-foreground leading-[22px]">
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
                                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
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
              </Disclosure>
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
