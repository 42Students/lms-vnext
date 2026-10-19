"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { learnerQuizReviewQuestionNotice } from "@/modules/courses/learner-quiz-review-question-availability-model";
import { selectLearnerLatestQuizAttempt } from "@/modules/courses/learner-latest-quiz-attempt-model";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoading } from "@/components/ui/page-loading";
import { parseLearnerQuizDraft } from "@/modules/courses/learner-quiz-draft";
import { learnerQuizAnswerProgress } from "@/modules/courses/learner-quiz-answer-progress-model";
import { learnerQuizRequestCurrent } from "@/modules/courses/learner-quiz-request-race-model";
import { learnerQuizRouteScopeCurrent } from "@/modules/courses/learner-quiz-route-scope-model";
import { learnerQuizDraftCanPersist } from "@/modules/courses/learner-quiz-autosave-scope-model";
import { learnerQuizRefreshFailureMessage } from "@/modules/courses/learner-quiz-refresh-failure-model";
import { requireLearnerQuizResponseId } from "@/modules/courses/learner-quiz-response-id-model";
import { canReviewLearnerQuizCorrectAnswers } from "@/modules/courses/learner-quiz-correctness-visibility-model";
import { learnerAttemptResultLabel } from "@/modules/courses/learner-quiz-history-model";
import { learnerQuizClockInterval } from "@/modules/courses/learner-quiz-clock-interval-model";
import { learnerQuizQuestionNavState } from "@/modules/courses/learner-quiz-question-nav-model";
import { learnerQuizDeadlineDisplay } from "@/modules/courses/learner-quiz-deadline-display-model";
import { learnerQuizDeadlineWarning } from "@/modules/courses/learner-quiz-deadline-warning-model";
import { scheduleLearnerQuizReturn } from "@/modules/courses/learner-quiz-return-model";
import { learnerQuizSubmitDeadlineOpen } from "@/modules/courses/learner-quiz-submit-deadline-model";
import { learnerQuizSubmissionReceiptVisible } from "@/modules/courses/learner-quiz-submission-receipt-model";
import { learnerQuizReviewRows } from "@/modules/courses/learner-quiz-review-model";
import { clearLearnerQuizAnswer } from "@/modules/courses/learner-quiz-answer-edit-model";
import { normalizeLearnerQuizDraftForQuestions } from "@/modules/courses/learner-quiz-draft-scope-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { friendlyApiError } from "@/lib/friendly-error";

type QuizPayload = {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    maxAttempts: number;
    totalPoints: number;
    status: "PUBLISHED" | "CLOSED";
    resultsPublished: boolean;
  };
  attemptsUsed: number;
  attemptsRemaining: number;
  resultsVisible: boolean;
  questions: Array<{
    id: string;
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
    prompt: string;
    points: number;
    sequence: number;
    options: Array<{
      id: string;
      text: string;
      sequence: number;
      correct?: boolean;
    }>;
  }>;
};

type Attempt = {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  score: number | null;
  maxScore: number | null;
  resultsVisible: boolean;
  answers: Array<{
    questionId: string;
    selectedOptionIds: string[];
    correct?: boolean;
    pointsAwarded?: number;
    options?: Array<{
      id: string;
      text: string;
      sequence: number;
      correct: boolean;
    }>;
  }>;
};

function messageFrom(response: Response, fallback: string) {
  return response.json().then((payload: unknown) => {
    const body = payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown> : {};
    const code = typeof body.error === "string" ? body.error : null;
    // Never trust provider or API message strings as display copy.
    return response.status ? friendlyApiError({ status: response.status, code }) : fallback;
  }).catch(() => friendlyApiError({ status: response.status }));
}

function formatDate(value: string | null) {
  return learnerQuizDeadlineDisplay(value);
}

export function LearnerQuizAttempt() {
  const router = useRouter();
  const params = useSearchParams();
  const quizId = params.get("quizId") ?? "";
  const deliveryId = params.get("deliveryId") ?? "";
  const reviewRequested = params.get("review") === "true";
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [loadedScopeKey,setLoadedScopeKey]=useState<string|null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState(0);
  const [showReview,setShowReview]=useState(false);
  const [nowMs, setNowMs] = useState(0);
  const [review, setReview] = useState(reviewRequested);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [confirmedSubmissionQuizId,setConfirmedSubmissionQuizId]=useState<string|null>(null);
  const submittingRef = useRef(false);
  const cancelPendingReturn = useRef<(() => void) | null>(null);
  useEffect(() => () => { cancelPendingReturn.current?.(); }, []);
  const [error, setError] = useState<string | null>(null);
  const storageKey = quizId && deliveryId
    ? `learner-quiz:${deliveryId}:${quizId}`
    : "";
  const submitLockKey = storageKey ? `${storageKey}:submit-lock` : "";

  const load = useCallback(async (signal?: AbortSignal, afterSubmit = false) => {
    if (!quizId || !deliveryId) {
      setLoadedScopeKey(storageKey);
      setQuiz(null);
      setError("This quiz link is incomplete. Open the quiz again from All Quizzes.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const query = `deliveryId=${encodeURIComponent(deliveryId)}`;
      const [quizResponse, attemptsResponse] = await Promise.all([
        fetch(`/api/courses/quizzes/${encodeURIComponent(quizId)}?${query}`, { cache: "no-store", signal }),
        fetch(`/api/courses/quizzes/${encodeURIComponent(quizId)}/my-attempts?${query}`, { cache: "no-store", signal }),
      ]);
      if (!quizResponse.ok) throw new Error(await messageFrom(quizResponse, "Unable to load this quiz."));
      if (!attemptsResponse.ok) throw new Error(await messageFrom(attemptsResponse, "Unable to load your attempts."));
      const quizBody = await quizResponse.json();
      const attemptsBody = await attemptsResponse.json();
      requireLearnerQuizResponseId(quizId, quizBody.quiz?.quiz?.id);
      if (!learnerQuizRequestCurrent(signal)) return;
      const loadedAtMs = Date.now();
      const deadlinePassed = !learnerQuizSubmitDeadlineOpen(
        quizBody.quiz?.quiz?.dueAt ?? null, loadedAtMs,
      );
      const mustReview =
        reviewRequested ||
        quizBody.quiz?.quiz?.status === "CLOSED" ||
        deadlinePassed ||
        Number(quizBody.quiz?.attemptsRemaining ?? 0) <= 0;
      let rawDraft: string | null = null;
      if (!mustReview && storageKey && typeof window !== "undefined") {
        try {
          rawDraft = window.sessionStorage.getItem(storageKey);
        } catch {
          // A blocked sessionStorage API must not prevent loading the quiz.
        }
      }
      const draft = parseLearnerQuizDraft(
        rawDraft,
        Array.isArray(quizBody.quiz?.questions) ? quizBody.quiz.questions.length : 0,
      );
      // Restore only identifiers still present in the authorized quiz payload.
      // A modified, stale, or malicious draft must never submit foreign selections.
      const scopedDraft=normalizeLearnerQuizDraftForQuestions(
        draft,Array.isArray(quizBody.quiz?.questions)?quizBody.quiz.questions:[],
      );
      setAnswers(scopedDraft.answers);
      setStep(scopedDraft.step);
      setShowReview(false);
      setReview(mustReview);
      setNowMs(loadedAtMs);
      setQuiz(quizBody.quiz);
      setLoadedScopeKey(storageKey);
      setAttempts(Array.isArray(attemptsBody.attempts) ? attemptsBody.attempts : []);
    } catch (cause) {
      if (learnerQuizRequestCurrent(signal)) {
        if (!afterSubmit) setQuiz(null);
        setLoadedScopeKey(storageKey);
        setError(learnerQuizRefreshFailureMessage(afterSubmit,cause));
      }
    } finally {
      if (learnerQuizRequestCurrent(signal)) setLoading(false);
    }
  }, [quizId, deliveryId, reviewRequested, storageKey]);

  useEffect(() => {
    const controller = new AbortController();
    // Defer the initial load without synchronously setting state in an effect.
    const handle = window.setTimeout(() => void load(controller.signal), 0);
    return () => { controller.abort(); window.clearTimeout(handle); };
  }, [load]);

  useEffect(() => {
    const nextTick = learnerQuizClockInterval(quiz?.quiz.dueAt ?? null, nowMs);
    const handle = window.setTimeout(() => setNowMs(Date.now()), nextTick);
    return () => window.clearTimeout(handle);
  }, [quiz?.quiz.dueAt, nowMs]);

  useEffect(() => {
    if (!learnerQuizDraftCanPersist({storageKey,loadedScopeKey,review,loading,hasQuiz:Boolean(quiz)}) || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({ answers, step }));
    } catch {
      // Private browsing/quota should not block the attempt.
    }
  }, [answers, step, storageKey, loadedScopeKey, review, loading, quiz]);

  const questions = quiz?.questions ?? [];
  const current = questions[step] ?? null;
  const answerProgress=learnerQuizAnswerProgress(questions,answers);
  const reviewRows=learnerQuizReviewRows(questions,answers);
  const latestAttempt = selectLearnerLatestQuizAttempt(attempts);
  const answerMap = useMemo(
    () => new Map((latestAttempt?.answers ?? []).map((answer) => [answer.questionId, answer])),
    [latestAttempt],
  );
  const deadlineMissing = Boolean(quiz && !quiz.quiz.dueAt);
  const duePassed = quiz?.quiz.dueAt && nowMs > 0
    ? !learnerQuizSubmitDeadlineOpen(quiz.quiz.dueAt, nowMs)
    : false;
  const attemptable = Boolean(
    quiz &&
      quiz.quiz.status === "PUBLISHED" &&
      !duePassed &&
      !deadlineMissing &&
      quiz.attemptsRemaining > 0 &&
      questions.length > 0,
  );

  function choose(questionId: string, optionId: string, multiple: boolean) {
    setAnswers((currentAnswers) => {
      const existing = currentAnswers[questionId] ?? [];
      if (!multiple) return { ...currentAnswers, [questionId]: [optionId] };
      return {
        ...currentAnswers,
        [questionId]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId],
      };
    });
  }

  function leaveQuiz() {
    if (attemptable && !review) { setLeaveOpen(true); return; }
    router.replace("/learn/allQuizzes");
  }

  function requestSubmit() {
    if (!quiz || submittingRef.current || submitting || !attemptable) return;
    setSubmitOpen(true);
  }

  async function submit() {
    setSubmitOpen(false);
    if (!quiz || submittingRef.current || submitting || !attemptable) return;
    // Confirm dialogs may stay open past the server-enforced deadline.
    const confirmedAtMs = Date.now();
    if (!learnerQuizSubmitDeadlineOpen(quiz.quiz.dueAt, confirmedAtMs)) {
      setNowMs(confirmedAtMs);
      setError("This quiz deadline has passed. Your answers were not submitted.");
      return;
    }

    if (submitLockKey && typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem(submitLockKey);
        const lockedAt = raw ? Number(JSON.parse(raw)?.ts) : 0;
        if (
          Number.isFinite(lockedAt) &&
          lockedAt > 0 &&
          Date.now() - lockedAt < 30_000
        ) {
          setError("A submission is already in progress in this tab. Please wait.");
          return;
        }
        window.sessionStorage.setItem(
          submitLockKey,
          JSON.stringify({ ts: Date.now() }),
        );
      } catch {
        // Session storage is only a client-side duplicate-submit guard.
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/courses/quizzes/${encodeURIComponent(quiz.quiz.id)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryId,
            answers: questions.map((question) => ({
              questionId: question.id,
              selectedOptionIds: answers[question.id] ?? [],
            })),
          }),
        },
      );
      if (!response.ok) throw new Error(await messageFrom(response, "Quiz submission failed."));
      setConfirmedSubmissionQuizId(quiz.quiz.id);
      // Session storage may be blocked; a confirmed server write is never a failed submission.
      try { window.sessionStorage.removeItem(storageKey); } catch { /* local cleanup is best effort */ }
      await load(undefined, true);
      setReview(true);
      setStep(0);
      router.replace(
        `/quiz?quizId=${encodeURIComponent(quizId)}&deliveryId=${encodeURIComponent(deliveryId)}&review=true`,
      );
      cancelPendingReturn.current?.();
      cancelPendingReturn.current = scheduleLearnerQuizReturn(
        () => router.replace("/learn/allQuizzes"), 2000, window.setTimeout.bind(window), window.clearTimeout.bind(window),
      );
    } catch (cause) {
      setError(friendlyApiError({ network: true }));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      if (submitLockKey && typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(submitLockKey);
        } catch {
          // Ignore session-storage cleanup failures.
        }
      }
    }
  }

  if (loading || !learnerQuizRouteScopeCurrent(storageKey,loadedScopeKey)) {
    return <PageLoading label="Loading quiz…" variant="form" count={4} />;
  }

  if (error && !quiz) {
    return (
      <div className="rounded-xl border border-error/30 bg-surface p-8">
        <h1 className="m-0 font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Something went wrong</h1>
        <p className="mt-2 text-sm text-body">{error}</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void load()}>Try Again</Button>
          <Link href="/learn/allQuizzes" className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text">All Quizzes</Link>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (review || !attemptable) {
    return (
      <section className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Quiz review</p>
            <h1 className="mt-2 font-semibold text-[var(--lms-heading)] text-[30px] leading-10">{quiz.quiz.title}</h1>
            <p className="mt-2 text-sm text-body">
              {learnerQuizReviewQuestionNotice(questions.length,Boolean(latestAttempt))
                ? learnerQuizReviewQuestionNotice(questions.length,Boolean(latestAttempt))
                : latestAttempt
                ? latestAttempt.resultsVisible
                  ? `Attempt ${latestAttempt.attemptNumber} · ${learnerAttemptResultLabel(latestAttempt)}`
                  : "Your attempt is submitted. Results will appear after Faculty publishes them."
                : duePassed || quiz.quiz.status === "CLOSED"
                  ? "Not attempted before this quiz closed."
                  : "No attempt is available to review."}
            </p>
          </div>
          <Button type="button" onClick={leaveQuiz} variant="ghost" className="min-h-9 !text-[var(--lms-primary-text)]">← Back</Button>
        </div>
        {deadlineMissing && !latestAttempt ? (
          <p role="status" className="mt-4 rounded-[var(--lms-control-radius)] border border-warning p-3 text-sm text-body">
            Unavailable · Quiz deadline is not configured. Ask your faculty to set a due date.
          </p>
        ) : null}
        {learnerQuizSubmissionReceiptVisible(confirmedSubmissionQuizId,quiz.quiz.id) ? (
          <p role="status" className="mt-4 rounded-[var(--lms-control-radius)] border border-success p-3 text-sm font-semibold text-body">
            {latestAttempt?.resultsVisible&&latestAttempt.score!==null&&latestAttempt.maxScore!==null
              ?"Quiz submitted! Score: "+latestAttempt.score+"/"+latestAttempt.maxScore
              :"Quiz submitted. Results will be visible after faculty releases them."}
          </p>
        ) : null}
        {error ? <p role="alert" className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
        {learnerQuizReviewQuestionNotice(questions.length,Boolean(latestAttempt)) ? (
          <div role="status" className="mt-6 rounded-xl border border-border bg-surface-subtle p-5">
            <p className="text-sm text-body">{learnerQuizReviewQuestionNotice(questions.length,Boolean(latestAttempt))}</p>
            <Link href="/learn/allQuizzes" className="mt-3 inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">
              Return to All Quizzes
            </Link>
          </div>
        ) : null}
        <div className="mt-6 space-y-4">
          {questions.map((question, index) => {
            const submitted = answerMap.get(question.id);
            const selected = new Set(submitted?.selectedOptionIds ?? []);
            return (
              <article key={question.id} className="rounded-xl border border-border bg-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 text-sm font-semibold text-foreground">Question {index + 1}. {question.prompt}</h2>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{question.points} pts</span>
                </div>
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selected.has(option.id);
                    const correct = canReviewLearnerQuizCorrectAnswers(quiz.quiz.resultsPublished,latestAttempt?.resultsVisible === true) && option.correct === true;
                    return (
                      <div key={option.id} className="flex items-start gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm">
                        <span aria-hidden="true">{correct ? "✓" : isSelected ? "•" : "○"}</span>
                        <span className="flex-1 text-body">{option.text}</span>
                        {isSelected ? <StatusBadge tone="info">Your answer</StatusBadge> : null}
                        {correct ? <StatusBadge tone="success">Correct</StatusBadge> : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0">
      <ConfirmDialog open={leaveOpen} onOpenChange={setLeaveOpen}
        title="Cancel quiz?" description="Are you sure you want to cancel this quiz? Your unsent answers will remain in this browser, but this attempt has not been submitted."
        confirmVariant="danger" confirmLabel="Leave quiz" onConfirm={() => {
          setLeaveOpen(false);
          try { window.sessionStorage.setItem(storageKey, JSON.stringify({ answers, step })); } catch { /* browser storage unavailable */ }
          router.replace("/learn/allQuizzes");
        }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} pending={submitting || !attemptable}
        title="Submit quiz attempt?" description={answerProgress.total > answerProgress.answered
          ? `You have ${answerProgress.total-answerProgress.answered} unanswered question${answerProgress.total-answerProgress.answered === 1 ? "" : "s"}. Your quiz will still be submitted. Submit this quiz attempt? You cannot edit this attempt after submission.`
          : "Submit this quiz attempt? You cannot edit this attempt after submission."}
        confirmLabel="Submit" onConfirm={() => void submit()} />
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              Question {step + 1} / {questions.length} · {quiz.attemptsRemaining} attempt(s) remaining
            </p>
            <h1 className="mt-1 font-semibold text-[var(--lms-heading)] text-[30px] leading-10">{quiz.quiz.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(quiz.quiz.dueAt)}</p>
            {learnerQuizDeadlineWarning(quiz.quiz.dueAt,nowMs,attemptable) ? (
              <p role="status" className="mt-2 rounded-md border border-warning p-2 text-sm font-semibold text-body">{learnerQuizDeadlineWarning(quiz.quiz.dueAt,nowMs,attemptable)}</p>
            ) : null}
          </div>
          <Button type="button" onClick={leaveQuiz} variant="ghost" className="min-h-9 !text-[var(--lms-primary-text)]">Back</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-body" aria-live="polite">
          <span>{answerProgress.answered} answered · {answerProgress.total-answerProgress.answered} unanswered</span>
          {answerProgress.firstUnanswered!==null ? (
            <Button type="button" onClick={() => setStep(answerProgress.firstUnanswered!)}
              variant="secondary" className="min-h-9">
              Go to first unanswered
            </Button>
          ) : <span className="font-semibold text-success">All questions answered</span>}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[220px_1fr]">
        <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Progress</p>
          <div className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-3">
            {questions.map((question, index) => (
              <Button
                key={question.id}
                type="button"
                onClick={() => setStep(index)}
                aria-label={learnerQuizQuestionNavState(
                  index,step,answers[question.id] ?? [],question.options.map(option=>option.id),
                ).label}
                aria-current={index === step ? "step" : undefined}
                variant={index === step ? "primary" : "secondary"}
                className={`min-h-9 ${index !== step && learnerQuizQuestionNavState(index,step,answers[question.id] ?? [],question.options.map(option=>option.id)).answered ? "!border-[var(--lms-success)] !bg-[var(--lms-success-subtle)] !text-[var(--lms-body-text)]" : ""}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </aside>

        <div className="p-5 sm:p-7">
          {current ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="m-0 text-lg font-semibold leading-7 text-foreground">{current.prompt}</h2>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">{current.points} pts</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {current.type === "MULTIPLE_CHOICE" ? "Select all that apply." : "Select one answer."}
              </p>
              <div className="mt-5 space-y-3">
                {current.options.map((option) => {
                  const checked = (answers[current.id] ?? []).includes(option.id);
                  const ChoiceControl = current.type === "MULTIPLE_CHOICE" ? Checkbox : Radio;
                  return (
                    <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-subtle p-4 hover:border-primary">
                      <ChoiceControl
                        name={current.id}
                        checked={checked}
                        onChange={() => choose(current.id, option.id, current.type === "MULTIPLE_CHOICE")}
                        className="mt-1"
                      />
                      <span className="text-sm leading-6 text-body">{option.text}</span>
                    </label>
                  );
                })}
              </div>
              {(answers[current.id] ?? []).length > 0 ? (
                <Button type="button"
                  onClick={() => setAnswers(currentAnswers => clearLearnerQuizAnswer(currentAnswers,current.id))}
                  variant="secondary" className="mt-4 min-h-9">
                  Clear this answer
                </Button>
              ) : null}
            </>
          ) : null}
          <div className="mt-6">
            <Button type="button" aria-expanded={showReview}
              onClick={()=>setShowReview(value=>!value)}
              variant="secondary" className="min-h-9">
              {showReview ? "Hide answer review" : "Review answers before submitting"}
            </Button>
            {showReview ? (
              <section aria-label="Your quiz answer review" className="mt-3 rounded-xl border border-border bg-surface-subtle p-4">
                <p className="text-sm text-body">Review your responses. These are not grading results.</p>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {reviewRows.map((item,index)=>(
                    <li key={item.questionId}>
                      <Button type="button" onClick={()=>{setStep(index);setShowReview(false);}}
                        variant="secondary" className="min-h-9 w-full justify-between gap-2 text-left">
                        <span>Question {index+1}</span>
                        <span>{item.answered ? item.selectedCount+" selected" : "Unanswered"}</span>
                      </Button>
                    </li>
                  ))}
                </ol>
                <Button disabled={submitting} onClick={requestSubmit}>
                  {submitting?"Submitting…":"Submit reviewed attempt"}
                </Button>
              </section>
            ) : null}
          </div>
          {error ? <p role="alert" className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
          <div className="mt-7 flex flex-wrap justify-between gap-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Previous</Button>
            {step < questions.length - 1 ? (
              <Button disabled={!current || (answers[current.id]??[]).length===0}
                title={!current || (answers[current.id]??[]).length===0?"Answer this question or use the question numbers to skip.":undefined}
                onClick={() => setStep((value) => Math.min(questions.length - 1, value + 1))}>Next</Button>
            ) : (
              <Button disabled={submitting} onClick={requestSubmit}>{submitting ? "Submitting…" : "Submit"}</Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
