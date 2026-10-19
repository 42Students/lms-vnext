"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { courseApiError } from "./learner-course-api";
import {
  quizInteractionState,
  type ProgressStatus,
} from "./learner-interaction-model";

type QuizQuestion = {
  id: string;
  type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE";
  prompt: string;
  points: number;
  sequence: number;
  options: Array<{
    id: string;
    text: string;
    sequence: number;
  }>;
};

type QuizView = {
  attemptsUsed: number;
  attemptsRemaining: number;
  resultsVisible: boolean;
  questions: Array<QuizQuestion & { options: Array<QuizQuestion["options"][number] & {correct?:boolean}> }>;
};

type PublishedAttempt = {
  id: string;
  attemptNumber: number;
  score: number | null;
  maxScore: number | null;
  submittedAt: string;
  resultsVisible: boolean;
  answers: Array<{
    id: string;
    questionId: string;
    questionType:
      | "SINGLE_CHOICE"
      | "MULTIPLE_CHOICE";
    prompt: string;
    pointsPossible: number;
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

function formatAttemptDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function QuizAttemptControl({
  quizId,
  deliveryId,
  status,
  attemptsUsed,
  attemptsRemaining,
  resultsPublished,
  progressStatus,
}: {
  quizId: string;
  deliveryId: string;
  status: "PUBLISHED" | "CLOSED";
  attemptsUsed: number;
  attemptsRemaining: number;
  resultsPublished: boolean;
  progressStatus: ProgressStatus;
}) {
  const router = useRouter();
  const interaction = quizInteractionState({
    status,
    attemptsUsed,
    attemptsRemaining,
    resultsPublished,
    progressStatus,
  });
  const [quiz, setQuiz] =
    useState<QuizView | null>(null);
  const [attempts, setAttempts] =
    useState<PublishedAttempt[] | null>(null);
  const [missedReview,setMissedReview]=useState<QuizView|null>(null);
  const [answers, setAnswers] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [submitted, setSubmitted] =
    useState(false);

  async function startAttempt() {
    setError(null);
    setSubmitted(false);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/courses/quizzes/${quizId}?deliveryId=${encodeURIComponent(
          deliveryId,
        )}`,
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      const payload = (await response.json()) as {
        quiz: QuizView;
      };

      setQuiz(payload.quiz);
      setAttempts(null);
      setAnswers({});
    } catch {
      setError(
        "Could not load the quiz. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function reviewResults() {
    setError(null);
    setLoading(true);

    try {
      if(attemptsUsed===0 && progressStatus==="MISSED" && resultsPublished && status==="CLOSED"){
        const response=await fetch(`/api/courses/quizzes/${quizId}?deliveryId=${encodeURIComponent(deliveryId)}`);
        if(!response.ok)throw new Error(await courseApiError(response));
        const payload=await response.json() as {quiz:QuizView};
        if(!payload.quiz.resultsVisible)throw new Error("Quiz answer key has not been released yet.");
        setMissedReview(payload.quiz);
        setQuiz(null);
        return;
      }
      const response = await fetch(
        `/api/courses/quizzes/${quizId}/my-attempts?deliveryId=${encodeURIComponent(
          deliveryId,
        )}`,
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      const payload = (await response.json()) as {
        attempts: PublishedAttempt[];
      };

      setAttempts(payload.attempts);
      setQuiz(null);
    } catch {
      setError(
        "Could not load quiz results. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectOption(
    question: QuizQuestion,
    optionId: string,
  ) {
    setAnswers((current) => {
      if (
        question.type ===
        "SINGLE_CHOICE"
      ) {
        return {
          ...current,
          [question.id]: [optionId],
        };
      }

      const selected =
        current[question.id] ?? [];
      return {
        ...current,
        [question.id]: selected.includes(
          optionId,
        )
          ? selected.filter(
              (id) => id !== optionId,
            )
          : [...selected, optionId],
      };
    });
  }

  async function submitAttempt() {
    if (!quiz) return;

    const unanswered =
      quiz.questions.filter(
        (question) =>
          (answers[question.id] ?? [])
            .length === 0,
      ).length;

    if (
      unanswered > 0 &&
      !window.confirm(
        `${unanswered} question${
          unanswered === 1 ? "" : "s"
        } are unanswered and will score zero. Submit anyway?`,
      )
    ) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/courses/quizzes/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId,
            answers: quiz.questions.map(
              (question) => ({
                questionId:
                  question.id,
                selectedOptionIds:
                  answers[question.id] ??
                  [],
              }),
            ),
          }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      setSubmitted(true);
      setQuiz(null);
      setAnswers({});
      router.refresh();
    } catch {
      setError(
        "Could not submit the quiz. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if(missedReview){
    return <section aria-label="Missed quiz review" className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-base font-semibold text-foreground">Review quiz</h3>
          <p className="text-sm text-body">You didn&apos;t attempt this quiz. The answer key has been released.</p></div>
        <Button size="sm" variant="secondary" onClick={()=>setMissedReview(null)}>Close review</Button>
      </div>
      <ol className="space-y-3">
        {missedReview.questions.map((question,index)=><li key={question.id} className="rounded-[var(--lms-control-radius)] border border-border p-3">
          <h4 className="font-semibold text-foreground">Question {index+1}: {question.prompt}</h4>
          <p className="mt-1 text-xs text-body">{question.points} pts</p>
          <ul className="mt-2 space-y-1">{question.options.map(option=>
            <li key={option.id} className="flex gap-2 text-sm text-body">
              <span aria-hidden="true">{(option as {correct?:boolean}).correct?"✓":"–"}</span>{option.text}
              {(option as {correct?:boolean}).correct?<span className="font-semibold text-success">Correct answer</span>:null}
            </li>)}</ul>
        </li>)}
      </ol>
    </section>;
  }

  if (quiz) {
    const answered =
      quiz.questions.filter(
        (question) =>
          (answers[question.id] ?? [])
            .length > 0,
      ).length;

    return (
      <div className="mt-4 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-semibold text-foreground">
              Quiz attempt
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {answered} of{" "}
              {quiz.questions.length} questions
              answered
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setQuiz(null);
              setAnswers({});
              setError(null);
            }}
          >
            Close
          </Button>
        </div>

        <nav aria-label="Quiz question progress" className="mt-4 rounded-xl border border-border bg-surface p-3">
          <h3 className="text-sm font-semibold text-foreground">Progress</h3>
          <details className="mt-2 lg:hidden">
            <summary className="cursor-pointer text-sm text-primary-text">Questions</summary>
            <ol className="mt-2 flex flex-wrap gap-2">
              {quiz.questions.map((question,index)=><li key={question.id}>
                <a className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle sm:min-h-9"
                  href={"#quiz-question-"+question.id}>Question {index+1} · {question.points} pts</a>
              </li>)}
            </ol>
          </details>
          <ol className="mt-2 hidden flex-wrap gap-2 lg:flex">
            {quiz.questions.map((question,index)=><li key={question.id}>
              <a className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle sm:min-h-9"
                href={"#quiz-question-"+question.id}>Question {index+1} · {question.points} pts</a>
            </li>)}
          </ol>
        </nav>
        <div className="mt-4 space-y-4">
          {quiz.questions.map(
            (question, questionIndex) => (
              <fieldset
                id={"quiz-question-"+question.id}
                key={question.id}
                className="rounded-lg border border-border bg-surface p-4"
                disabled={submitting}
              >
                <legend className="px-1 text-sm font-semibold text-foreground">
                  {questionIndex + 1}.{" "}
                  {question.prompt}
                </legend>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {question.points} points
                  </span>
                  <span>·</span>
                  <span>
                    {question.type ===
                    "SINGLE_CHOICE"
                      ? "Choose one"
                      : "Choose all that apply"}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {question.options.map(
                    (option) => {
                      const checked = (
                        answers[
                          question.id
                        ] ?? []
                      ).includes(option.id);
                      const ChoiceControl = question.type === "SINGLE_CHOICE" ? Radio : Checkbox;

                      return (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-start gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2.5 text-sm text-body transition hover:border-primary hover:bg-primary-subtle"
                        >
                          <ChoiceControl
                            name={`quiz-${quizId}-${question.id}`}
                            checked={checked}
                            onChange={() =>
                              selectOption(
                                question,
                                option.id,
                              )
                            }
                            className="mt-0.5"
                          />
                          <span>
                            {option.text}
                          </span>
                        </label>
                      );
                    },
                  )}
                </div>
              </fieldset>
            ),
          )}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 text-sm font-semibold text-error"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={submitting}
            onClick={submitAttempt}
          >
            {submitting
              ? "Submitting…"
              : "Submit quiz"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Answers cannot be changed after
            submission.
          </span>
        </div>
      </div>
    );
  }

  if (attempts) {
    return (
      <div className="mt-4 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-semibold text-foreground">
              Published quiz results
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Historical answers are shown from
              the submitted attempt snapshot.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setAttempts(null)
            }
          >
            Close
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {attempts.map((attempt) => (
            <section
              key={attempt.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-sm font-semibold text-foreground">
                    Attempt{" "}
                    {attempt.attemptNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatAttemptDate(
                      attempt.submittedAt,
                    )}
                  </p>
                </div>
                {attempt.resultsVisible ? (
                  <StatusBadge tone="info">
                    {attempt.score ?? 0}/
                    {attempt.maxScore ?? 0}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">
                    Results pending
                  </StatusBadge>
                )}
              </div>

              {attempt.resultsVisible ? (
                <div className="mt-4 space-y-3">
                  {attempt.answers.map(
                    (
                      answer,
                      answerIndex,
                    ) => (
                      <div
                        key={answer.id}
                        className="rounded-[var(--lms-control-radius)] border border-border p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="m-0 text-sm font-semibold text-foreground">
                            {answerIndex +
                              1}
                            . {answer.prompt}
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
                            {answer.pointsAwarded ??
                              0}
                            /
                            {
                              answer.pointsPossible
                            }
                          </StatusBadge>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          {answer.options?.map(
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
                                      Your answer
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
              ) : null}
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {submitted ? (
        <div
          role="status"
          className="mb-3 rounded-lg bg-[var(--lms-success-subtle)] px-3 py-2 text-sm font-semibold text-success"
        >
          Quiz attempt submitted. Results stay
          hidden until the quiz is closed and
          published.
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mb-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {interaction.canAttempt ? (
          <Button
            size="sm"
            disabled={loading}
            onClick={startAttempt}
          >
            {loading
              ? "Loading…"
              : attemptsUsed > 0
                ? "Take another attempt"
                : "Start quiz"}
          </Button>
        ) : null}

        {interaction.canReviewResults ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={reviewResults}
          >
            {loading
              ? "Loading…"
              : "View published results"}
          </Button>
        ) : null}

        {interaction.waitingForResults ? (
          <span className="text-xs font-semibold text-muted-foreground">
            Quiz closed · Results have not been
            published yet.
          </span>
        ) : null}

        {interaction.exhausted ? (
          <span className="text-xs font-semibold text-muted-foreground">
            Attempt limit reached. Results will
            appear after the quiz is closed and
            published.
          </span>
        ) : null}
      </div>
    </div>
  );
}
