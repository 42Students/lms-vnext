"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  if (!value) return "No deadline";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function LearnerQuizAttempt() {
  const router = useRouter();
  const params = useSearchParams();
  const quizId = params.get("quizId") ?? "";
  const deliveryId = params.get("deliveryId") ?? "";
  const reviewRequested = params.get("review") === "true";
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState(0);
  const [review, setReview] = useState(reviewRequested);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = quizId && deliveryId
    ? `learner-quiz:${deliveryId}:${quizId}`
    : "";
  const submitLockKey = storageKey ? `${storageKey}:submit-lock` : "";

  async function load() {
    if (!quizId || !deliveryId) {
      setError("This quiz link is incomplete. Open the quiz again from All Quizzes.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const query = `deliveryId=${encodeURIComponent(deliveryId)}`;
      const [quizResponse, attemptsResponse] = await Promise.all([
        fetch(`/api/courses/quizzes/${encodeURIComponent(quizId)}?${query}`, { cache: "no-store" }),
        fetch(`/api/courses/quizzes/${encodeURIComponent(quizId)}/my-attempts?${query}`, { cache: "no-store" }),
      ]);
      if (!quizResponse.ok) throw new Error(await messageFrom(quizResponse, "Unable to load this quiz."));
      if (!attemptsResponse.ok) throw new Error(await messageFrom(attemptsResponse, "Unable to load your attempts."));
      const quizBody = await quizResponse.json();
      const attemptsBody = await attemptsResponse.json();
      setQuiz(quizBody.quiz);
      setAttempts(Array.isArray(attemptsBody.attempts) ? attemptsBody.attempts : []);
      const deadlinePassed = quizBody.quiz?.quiz?.dueAt
        ? new Date(quizBody.quiz.quiz.dueAt).getTime() < Date.now()
        : false;
      if (
        reviewRequested ||
        quizBody.quiz?.quiz?.status === "CLOSED" ||
        deadlinePassed ||
        Number(quizBody.quiz?.attemptsRemaining ?? 0) <= 0
      ) {
        setReview(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load this quiz.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // quiz/delivery identify a fresh attempt surface.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, deliveryId]);

  useEffect(() => {
    if (!storageKey || review || typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setAnswers(parsed.answers ?? {});
        setStep(Number.isInteger(parsed.step) ? parsed.step : 0);
      }
    } catch {
      // Corrupt transient state should not block the quiz.
    }
  }, [storageKey, review]);

  useEffect(() => {
    if (!storageKey || review || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({ answers, step }));
    } catch {
      // Private browsing/quota should not block the attempt.
    }
  }, [answers, step, storageKey, review]);

  const questions = quiz?.questions ?? [];
  const current = questions[step] ?? null;
  const latestAttempt = attempts.at(-1) ?? null;
  const answerMap = useMemo(
    () => new Map((latestAttempt?.answers ?? []).map((answer) => [answer.questionId, answer])),
    [latestAttempt],
  );
  const duePassed = quiz?.quiz.dueAt
    ? new Date(quiz.quiz.dueAt).getTime() < Date.now()
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

    const unanswered = questions.filter(
      (question) => (answers[question.id] ?? []).length === 0,
    ).length;
    const confirmation =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Your quiz will still be submitted. Submit this quiz attempt? You cannot edit this attempt after submission.`
        : "Submit this quiz attempt? You cannot edit this attempt after submission.";

    if (!window.confirm(confirmation)) return;

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
      if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKey);
      await load();
      setReview(true);
      setStep(0);
      router.replace(
        `/quiz?quizId=${encodeURIComponent(quizId)}&deliveryId=${encodeURIComponent(deliveryId)}&review=true`,
      );
      window.setTimeout(() => {
        leaveQuiz();
      }, 2000);
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

  if (loading) {
    return <div className="rounded-xl border border-border bg-surface p-8 text-sm text-body">Loading quiz…</div>;
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
                  ? `Attempt ${latestAttempt.attemptNumber} · ${latestAttempt.score ?? 0}/${latestAttempt.maxScore ?? quiz.quiz.totalPoints}`
                  : "Your attempt is submitted. Results will appear after Faculty publishes them."
                : duePassed || quiz.quiz.status === "CLOSED"
                  ? "Not attempted before this quiz closed."
                  : "No attempt is available to review."}
            </p>
          </div>
          <button type="button" onClick={leaveQuiz} className="text-sm font-semibold text-primary-text">← Back</button>
        </div>
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
                    const correct = latestAttempt?.resultsVisible ? option.correct === true : false;
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
          </div>
          <button type="button" onClick={leaveQuiz} className="text-sm font-semibold text-primary-text">Back</button>
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
            </>
          ) : null}
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
