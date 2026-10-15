"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { parseLearnerQuizDraft } from "@/modules/courses/learner-quiz-draft";
import { learnerQuizAnswerProgress } from "@/modules/courses/learner-quiz-answer-progress-model";
import { learnerQuizRequestCurrent } from "@/modules/courses/learner-quiz-request-race-model";
import { learnerQuizRouteScopeCurrent } from "@/modules/courses/learner-quiz-route-scope-model";
import { learnerQuizDraftCanPersist } from "@/modules/courses/learner-quiz-autosave-scope-model";
import { learnerQuizRefreshFailureMessage } from "@/modules/courses/learner-quiz-refresh-failure-model";
import { requireLearnerQuizResponseId } from "@/modules/courses/learner-quiz-response-id-model";
import { canReviewLearnerQuizCorrectAnswers } from "@/modules/courses/learner-quiz-correctness-visibility-model";
import { learnerAttemptResultLabel } from "@/modules/courses/learner-quiz-history-model";
import { learnerQuizDeadlineDisplay } from "@/modules/courses/learner-quiz-deadline-display-model";
import { learnerQuizDeadlineWarning } from "@/modules/courses/learner-quiz-deadline-warning-model";
import { scheduleLearnerQuizReturn } from "@/modules/courses/learner-quiz-return-model";
import { learnerQuizSubmitDeadlineOpen } from "@/modules/courses/learner-quiz-submit-deadline-model";
import { learnerQuizSubmissionReceiptVisible } from "@/modules/courses/learner-quiz-submission-receipt-model";
import { learnerQuizReviewRows } from "@/modules/courses/learner-quiz-review-model";
import { clearLearnerQuizAnswer } from "@/modules/courses/learner-quiz-answer-edit-model";
import { normalizeLearnerQuizDraftForQuestions } from "@/modules/courses/learner-quiz-draft-scope-model";
import { StatusBadge } from "@/components/ui/status-badge";

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
  return response
    .json()
    .then((payload) => payload?.message || payload?.error || fallback)
    .catch(() => fallback);
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
    const handle = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(handle);
  }, []);

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
  const latestAttempt = attempts.at(-1) ?? null;
  const answerMap = useMemo(
    () => new Map((latestAttempt?.answers ?? []).map((answer) => [answer.questionId, answer])),
    [latestAttempt],
  );
  const duePassed = quiz?.quiz.dueAt && nowMs > 0
    ? !learnerQuizSubmitDeadlineOpen(quiz.quiz.dueAt, nowMs)
    : false;
  const attemptable = Boolean(
    quiz &&
      quiz.quiz.status === "PUBLISHED" &&
      !duePassed &&
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
    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      router.back();
      return;
    }
    router.push("/learn/allQuizzes");
  }

  async function submit() {
    if (!quiz || submittingRef.current || submitting || !attemptable) return;

    const unanswered = answerProgress.total-answerProgress.answered;
    const confirmation =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Your quiz will still be submitted. Submit this quiz attempt? You cannot edit this attempt after submission.`
        : "Submit this quiz attempt? You cannot edit this attempt after submission.";

    if (!window.confirm(confirmation)) return;
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
        leaveQuiz, 2000, window.setTimeout.bind(window), window.clearTimeout.bind(window),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Quiz submission failed.");
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
    return <div role="status" className="rounded-xl border border-border bg-surface p-8 text-sm text-body">Loading quiz…</div>;
  }

  if (error && !quiz) {
    return (
      <div className="rounded-xl border border-error/30 bg-surface p-8">
        <h1 className="m-0 text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-body">{error}</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void load()}>Try Again</Button>
          <Link href="/learn/allQuizzes" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">All Quizzes</Link>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (review || !attemptable) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Quiz review</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{quiz.quiz.title}</h1>
            <p className="mt-2 text-sm text-body">
              {latestAttempt
                ? latestAttempt.resultsVisible
                  ? `Attempt ${latestAttempt.attemptNumber} · ${learnerAttemptResultLabel(latestAttempt)}`
                  : "Your attempt is submitted. Results will appear after Faculty publishes them."
                : duePassed || quiz.quiz.status === "CLOSED"
                  ? "Not attempted before this quiz closed."
                  : "No attempt is available to review."}
            </p>
          </div>
          <button type="button" onClick={leaveQuiz} className="text-sm font-semibold text-primary-text">← Back</button>
        </div>
        {learnerQuizSubmissionReceiptVisible(confirmedSubmissionQuizId,quiz.quiz.id) ? (
          <p role="status" className="mt-4 rounded-lg border border-success p-3 text-sm font-semibold text-body">Your quiz submission was received. Results may remain hidden until published.</p>
        ) : null}
        {error ? <p role="alert" className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
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
                      <div key={option.id} className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
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
    <section className="rounded-xl border border-border bg-surface">
      <header className="border-b border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              Question {step + 1} / {questions.length} · {quiz.attemptsRemaining} attempt(s) remaining
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">{quiz.quiz.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(quiz.quiz.dueAt)}</p>
            {learnerQuizDeadlineWarning(quiz.quiz.dueAt,nowMs,attemptable) ? (
              <p role="status" className="mt-2 rounded-md border border-warning p-2 text-sm font-semibold text-body">{learnerQuizDeadlineWarning(quiz.quiz.dueAt,nowMs,attemptable)}</p>
            ) : null}
          </div>
          <button type="button" onClick={leaveQuiz} className="text-sm font-semibold text-primary-text">Back</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-body" aria-live="polite">
          <span>{answerProgress.answered} answered · {answerProgress.total-answerProgress.answered} unanswered</span>
          {answerProgress.firstUnanswered!==null ? (
            <button type="button" onClick={() => setStep(answerProgress.firstUnanswered!)}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 font-semibold text-primary-text hover:bg-primary-subtle">
              Go to first unanswered
            </button>
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
              <button
                key={question.id}
                type="button"
                onClick={() => setStep(index)}
                aria-label={`Go to question ${index + 1}`}
                className={`min-h-9 rounded-md border text-sm font-semibold ${index === step ? "border-primary bg-primary text-on-primary" : answers[question.id]?.length ? "border-success bg-success-subtle text-foreground" : "border-border bg-surface text-body"}`}
              >
                {index + 1}
              </button>
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
                  return (
                    <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-subtle p-4 hover:border-primary">
                      <input
                        type={current.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
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
                <button type="button"
                  onClick={() => setAnswers(currentAnswers => clearLearnerQuizAnswer(currentAnswers,current.id))}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
                  Clear this answer
                </button>
              ) : null}
            </>
          ) : null}
          <div className="mt-6">
            <button type="button" aria-expanded={showReview}
              onClick={()=>setShowReview(value=>!value)}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">
              {showReview ? "Hide answer review" : "Review answers before submitting"}
            </button>
            {showReview ? (
              <section aria-label="Your quiz answer review" className="mt-3 rounded-xl border border-border bg-surface-subtle p-4">
                <p className="text-sm text-body">Review your responses. These are not grading results.</p>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {reviewRows.map((item,index)=>(
                    <li key={item.questionId}>
                      <button type="button" onClick={()=>{setStep(index);setShowReview(false);}}
                        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-primary-text">
                        <span>Question {index+1}</span>
                        <span>{item.answered ? item.selectedCount+" selected" : "Unanswered"}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <Button disabled={submitting} onClick={()=>void submit()}>
                  {submitting?"Submitting…":"Submit reviewed attempt"}
                </Button>
              </section>
            ) : null}
          </div>
          {error ? <p role="alert" className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
          <div className="mt-7 flex flex-wrap justify-between gap-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Previous</Button>
            {step < questions.length - 1 ? (
              <Button onClick={() => setStep((value) => Math.min(questions.length - 1, value + 1))}>Next</Button>
            ) : (
              <Button disabled={submitting} onClick={() => void submit()}>{submitting ? "Submitting…" : "Submit"}</Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
