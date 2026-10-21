"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Drawer} from "@/components/ui/drawer";
import {isSafeInternalHref} from "@/lib/safe-internal-href";
import { Alert } from "@/components/ui/alert";
import { MetricBar } from "@/components/ui/metric-bar";
import styles from "./learner-quiz-attempt.module.css";
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
  const returnToRaw=params.get("returnTo");
  const returnTo=returnToRaw&&isSafeInternalHref(returnToRaw)&&
    /^\/learn\//.test(returnToRaw)?returnToRaw:"/learn/allQuizzes";
  const [questionsDrawerOpen,setQuestionsDrawerOpen]=useState(false);
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
  const [accountScope,setAccountScope]=useState<string|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    void fetch("/api/auth/memberships",{cache:"no-store",signal:controller.signal})
      .then(async response=>{
        if(!response.ok)return;
        const data:unknown=await response.json();
        if(!data||typeof data!=="object"||!("memberships" in data))return;
        const raw=(data as {memberships:unknown}).memberships;
        if(!Array.isArray(raw)||raw.length===0)return;
        const ids=raw.map((entry:unknown)=>entry&&typeof entry==="object"&&
          "id" in entry?(entry as {id:unknown}).id:null);
        if(ids.some(id=>typeof id!=="string"||!/^[a-f0-9-]{36}$/i.test(id)))return;
        if(!controller.signal.aborted)setAccountScope((ids as string[]).sort().join(":"));
      }).catch(()=>{ /* No identity scope means no browser draft persistence. */ });
    return ()=>controller.abort();
  },[]);
  // Cross-account draft isolation: the authenticated membership roster is
  // unique to a user; never restore or persist if that scope is unavailable.
  const storageKey = quizId && deliveryId && accountScope
    ? `learner-quiz:${accountScope}:${deliveryId}:${quizId}`
    : "";
  const submitLockKey = storageKey ? `${storageKey}:submit-lock` : "";

  const load = useCallback(async (signal?: AbortSignal, afterSubmit = false) => {
    if (!quizId || !deliveryId) {
      setLoadedScopeKey(storageKey);
      setQuiz(null);
      setError("Cannot submit: Quiz not loaded. Open the quiz from the syllabus or quiz list.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const query = `deliveryId=${encodeURIComponent(deliveryId)}&includeCorrectAnswers=true`;
      const [quizResponse, attemptsResponse] = await Promise.all([
        fetch(`/api/courses/quizzes/${encodeURIComponent(quizId)}?${query}`, { cache: "no-store", signal }),
        fetch(`/api/courses/quizzes/${encodeURIComponent(quizId)}/my-attempts?${query}`, { cache: "no-store", signal }),
      ]);
      if (!quizResponse.ok) throw new Error(await messageFrom(quizResponse, "Unable to load this quiz."));
      if (!attemptsResponse.ok) throw new Error(await messageFrom(attemptsResponse, "Unable to load your attempts."));
      const quizBody = await quizResponse.json();
      const attemptsBody = await attemptsResponse.json();
      requireLearnerQuizResponseId(quizId, quizBody.quiz?.quiz?.id);
      const received=quizBody.quiz?.questions;
      if(!Array.isArray(received)||received.some((item:unknown)=>!item||typeof item!=="object"||
        !("type" in item)||!["SINGLE_CHOICE","MULTIPLE_CHOICE"].includes(String(item.type))))
        throw new Error("This quiz contains an unsupported question type. Open it from your current course syllabus.");
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
    router.replace(returnTo);
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
      setError("Deadline passed — This quiz deadline has passed. Your answers cannot be submitted now.");
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
        () => router.replace(returnTo), 2000, window.setTimeout.bind(window), window.clearTimeout.bind(window),
      );
    } catch (cause) {
      setError("Quiz was not submitted. "+(cause instanceof Error?cause.message:
        friendlyApiError({network:true})));
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
    return <PageLoading label="Loading quiz..." variant="form" count={4} />;
  }

  if (error && !quiz) {
    return (
      <div className="min-w-0 space-y-3">
        <PageHeader title="Something went wrong" />
        <Alert tone="error" className="mt-2">{error}</Alert>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void load()} className="min-h-11 md:min-h-9">Try Again</Button>
          <Button type="button" variant="secondary" onClick={()=>window.location.reload()}
            className="min-h-11 md:min-h-9">Refresh page</Button>
          <Link href="/learn/allQuizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">Back to quizzes</Link>
        </div>
      </div>
    );
  }

  if (!quiz) return <div className="py-8 text-center text-muted-foreground">No Quiz Found</div>;

  if (review || !attemptable) {
    return (
      <section className="min-w-0 space-y-5">
        <PageHeader
          title={quiz.quiz.title}
          description="Quiz review"
          actions={<Button type="button" onClick={leaveQuiz} variant="ghost" className="min-h-11 md:min-h-9">← Back</Button>}
        />
        {!learnerQuizReviewQuestionNotice(questions.length, Boolean(latestAttempt)) ? <p className="mt-2 text-sm text-body leading-[22px]">
              {latestAttempt
                ? latestAttempt.resultsVisible
                  ? `Attempt ${latestAttempt.attemptNumber} · ${learnerAttemptResultLabel(latestAttempt)}`
                  : "Your attempt is submitted. Results will appear after Faculty publishes them."
                : duePassed || quiz.quiz.status === "CLOSED"
                  ? "Not attempted before this quiz closed."
                  : "No attempt is available to review."}
        </p> : null}
        {deadlineMissing && !latestAttempt ? (
          <Alert tone="warning" className="mt-4">
            Unavailable · Quiz deadline is not configured. Ask your faculty to set a due date.
          </Alert>
        ) : null}
        {learnerQuizSubmissionReceiptVisible(confirmedSubmissionQuizId,quiz.quiz.id) ? (
          <Alert tone="success" className="mt-4 font-semibold">
            {latestAttempt?.resultsVisible&&latestAttempt.score!==null&&latestAttempt.maxScore!==null
              ?"Quiz submitted! Score: "+latestAttempt.score+"/"+latestAttempt.maxScore
              :"Quiz submitted. Results will be visible after faculty releases them."}
          </Alert>
        ) : null}
        {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}
        {learnerQuizReviewQuestionNotice(questions.length,Boolean(latestAttempt)) ? (
          <Alert tone="info" className="mt-6">
            <p className="text-sm text-body leading-[22px]">{learnerQuizReviewQuestionNotice(questions.length,Boolean(latestAttempt))}</p>
            <Link href="/learn/allQuizzes" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
              Return to All Quizzes
            </Link>
          </Alert>
        ) : null}
        {latestAttempt?<div role="group" aria-label="Quiz attempt results"
          className="grid grid-cols-2 gap-2 rounded-[var(--lms-canvas-radius)] border border-border p-3 sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Score</p>
            <strong className="block text-xl text-foreground">{latestAttempt.resultsVisible&&latestAttempt.score!==null
              ? latestAttempt.score+" / "+(latestAttempt.maxScore??quiz.quiz.totalPoints):"Not released"}</strong></div>
          <div><p className="text-xs text-muted-foreground">Attempt / Questions</p>
            <strong className="block text-xl text-foreground">{latestAttempt.attemptNumber} / {questions.length}</strong></div>
          <div><p className="text-xs text-muted-foreground">Submitted</p>
            <strong className="block text-sm text-foreground">{formatDate(latestAttempt.submittedAt)}</strong></div>
        </div>:null}
        <div className="mt-6 space-y-4">
          {questions.map((question, index) => {
            const submitted = answerMap.get(question.id);
            const selected = new Set(submitted?.selectedOptionIds ?? []);
            return (
              <article key={question.id} className="border-b border-[var(--lms-canvas-border)] bg-transparent py-[var(--lms-space-4)]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 min-w-0 flex-1 break-words [overflow-wrap:anywhere] font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Question {index + 1}. {question.prompt}</h2>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{question.points} pts</span>
                </div>
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selected.has(option.id);
                    const correct = canReviewLearnerQuizCorrectAnswers(quiz.quiz.resultsPublished,latestAttempt?.resultsVisible === true) && option.correct === true;
                    return (
                      <div key={option.id} className="flex flex-wrap items-start gap-2 border-b border-[var(--lms-canvas-border)] bg-transparent px-3 py-2 text-sm last:border-b-0">
                        <span aria-hidden="true">{correct ? "✓" : isSelected ? "•" : "○"}</span>
                        <span className="min-w-0 flex-1 break-words text-body">{option.text}</span>
                        {isSelected ? <StatusBadge tone="info">Your answer</StatusBadge> : null}
                        {correct ? <StatusBadge tone="success">Correct</StatusBadge> : null}
                        {isSelected&&!correct&&canReviewLearnerQuizCorrectAnswers(
                          quiz.quiz.resultsPublished,latestAttempt?.resultsVisible===true)&&
                          submitted?.correct===false?
                          <StatusBadge tone="danger">Incorrect</StatusBadge>:null}
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
        title="Are you sure you want to cancel this quiz?"
        description="Your unsent answers will remain in this browser. This attempt has not been submitted."
        confirmVariant="danger" confirmLabel="Yes" cancelLabel="No" onConfirm={() => {
          setLeaveOpen(false);
          try { window.sessionStorage.setItem(storageKey, JSON.stringify({ answers, step })); } catch { /* browser storage unavailable */ }
          router.replace(returnTo);
        }} />
      <ConfirmDialog open={submitOpen} onOpenChange={setSubmitOpen} pending={submitting} confirmDisabled={!attemptable}
        title={answerProgress.total>answerProgress.answered?"Unanswered Questions":"Submit quiz attempt?"} description={answerProgress.total > answerProgress.answered
          ? `You have ${answerProgress.total-answerProgress.answered} unanswered question${answerProgress.total-answerProgress.answered === 1 ? "" : "s"}. Your quiz will still be submitted. Submit this quiz attempt? You cannot edit this attempt after submission.`
          : "Submit this quiz attempt? You cannot edit this attempt after submission."}
        confirmLabel="Submit" confirmVariant="primary" onConfirm={() => void submit()} />
      <div className={styles.header+" pb-4"}>
        <PageHeader title={quiz.quiz.title}
          eyebrow="Quiz"
          actions={<div className="flex flex-wrap gap-2">
            <Button type="button" onClick={()=>setQuestionsDrawerOpen(true)}
              variant="secondary" className="min-h-11 md:hidden">Questions</Button>
            <Button type="button" onClick={leaveQuiz} variant="ghost" className="min-h-11 md:min-h-9">Close</Button>
          </div>}
        />
        <p className="text-sm font-semibold">Progress</p>
        <MetricBar label={`Question ${step+1} of ${questions.length}`}
          role="progressbar" value={step+1} maximum={questions.length}
          className={styles.track+" mt-2"} />
        <p className="mt-2 text-xs font-semibold text-muted-foreground leading-[20px]">
          Question {step + 1} / {questions.length} · {quiz.attemptsRemaining} attempt(s) remaining
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Due {formatDate(quiz.quiz.dueAt)}</p>
        {learnerQuizDeadlineWarning(quiz.quiz.dueAt,nowMs,attemptable) ? (
          <Alert tone="warning" className="mt-2 font-semibold">{learnerQuizDeadlineWarning(quiz.quiz.dueAt,nowMs,attemptable)}</Alert>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-body" aria-live="polite">
          <span>{answerProgress.answered} answered · {answerProgress.total-answerProgress.answered} unanswered</span>
          {answerProgress.firstUnanswered!==null ? (
            <Button type="button" onClick={() => setStep(answerProgress.firstUnanswered!)}
              variant="secondary" className="min-h-11 md:min-h-9">
              Go to first unanswered
            </Button>
          ) : <span className="font-semibold text-success">All questions answered</span>}
        </div>

      </div>

      <Drawer open={questionsDrawerOpen} onOpenChange={setQuestionsDrawerOpen}
        title="Question Status" className="md:hidden">
        <div className="space-y-2">
          {questions.map((question,index)=><Button key={question.id}
            type="button" variant={index===step?"primary":"secondary"}
            className="w-full min-h-11 justify-between"
            aria-label={learnerQuizQuestionNavState(index,step,
              answers[question.id]??[],question.options.map(option=>option.id)).label+
              ", "+question.points+" points"}
            onClick={()=>{setStep(index);setQuestionsDrawerOpen(false);}}>
            <span>Question {index+1}</span>
            <span>{question.points} pts · {(answers[question.id]??[]).length?"✓":"○"}</span>
          </Button>)}
        </div>
      </Drawer>
      <div className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 border-r border-border p-4 md:block">
          <Link href={returnTo} className="inline-flex min-h-10 w-[130px] items-center justify-center border border-border text-sm font-semibold text-primary-text">
            42 LMS
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground leading-[20px]">Question Status</p>
          <div className="mt-3 grid gap-2">
            {questions.map((question, index) => (
              <Button
                key={question.id}
                type="button"
                onClick={() => setStep(index)}
                aria-label={learnerQuizQuestionNavState(
                  index,step,answers[question.id] ?? [],question.options.map(option=>option.id),
                ).label+", "+question.points+" points"}
                aria-current={index === step ? "step" : undefined}
                variant={index === step ? "primary" : "secondary"}
                className={`min-h-11 md:min-h-9 ${index !== step && learnerQuizQuestionNavState(index,step,answers[question.id] ?? [],question.options.map(option=>option.id)).answered ? "!border-[var(--lms-success)] !bg-[var(--lms-success-subtle)] !text-[var(--lms-body-text)]" : ""}`}
              >
                <span className="flex w-full items-center justify-between gap-2 text-xs">
                  <span>Question {index+1}</span>
                  <span>{question.points} pts · {(answers[question.id]??[]).length?"✓":"○"}</span>
                </span>
              </Button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-4 min-[768px]:p-[var(--lms-canvas-padding)]">
          {current ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="m-0 min-w-0 flex-1 break-words [overflow-wrap:anywhere] font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">{current.prompt}</h2>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">{current.points} pts</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-[20px]">
                <StatusBadge tone="info">{current.type==="MULTIPLE_CHOICE"?"Multiple choice":"Single choice"}</StatusBadge>
                <span className="ml-2">{step+1} / {questions.length}</span>
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {current.options.map((option,index) => {
                  const checked = (answers[current.id] ?? []).includes(option.id);
                  const ChoiceControl = current.type === "MULTIPLE_CHOICE" ? Checkbox : Radio;
                  return (
                    <label key={option.id} className="flex min-w-0 cursor-pointer items-start gap-3 rounded-[var(--lms-control-radius)] border border-border bg-[var(--lms-form-bg)] p-4 transition-colors duration-[var(--lms-motion-fast)] hover:border-primary focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lms-primary)] motion-reduce:transition-none">
                      <ChoiceControl
                        name={current.id}
                        checked={checked}
                        onChange={() => choose(current.id, option.id, current.type === "MULTIPLE_CHOICE")}
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">
                        <span aria-hidden="true" className="mr-2 font-semibold">{String.fromCharCode(97+index%26)}.</span>
                        {option.text}
                      </span>
                    </label>
                  );
                })}
              </div>
              {(answers[current.id] ?? []).length > 0 ? (
                <Button type="button"
                  onClick={() => setAnswers(currentAnswers => clearLearnerQuizAnswer(currentAnswers,current.id))}
                  variant="secondary" className="mt-4 min-h-11 md:min-h-9">
                  Clear this answer
                </Button>
              ) : null}
            </>
          ) : null}
          <div className="mt-6">
            <Button type="button" aria-expanded={showReview}
              onClick={()=>setShowReview(value=>!value)}
              variant="secondary" className="min-h-11 md:min-h-9">
              {showReview ? "Hide answer review" : "Review answers before submitting"}
            </Button>
            {showReview ? (
              <section aria-label="Your quiz answer review" className="mt-3 border-y border-[var(--lms-canvas-border)] bg-transparent py-[var(--lms-space-4)]">
                <p className="text-sm text-body leading-[22px]">Review your responses. These are not grading results.</p>
                <ol className="mt-3 grid gap-2 md:grid-cols-2">
                  {reviewRows.map((item,index)=>(
                    <li key={item.questionId}>
                      <Button type="button" onClick={()=>{setStep(index);setShowReview(false);}}
                        variant="secondary" className="min-h-11 w-full justify-between gap-2 text-left md:min-h-9">
                        <span>Question {index+1}</span>
                        <span>{item.answered ? item.selectedCount+" selected" : "Unanswered"}</span>
                      </Button>
                    </li>
                  ))}
                </ol>
                <Button loading={submitting} disabled={submitting} onClick={requestSubmit} className="min-h-11 md:min-h-9">
                  {submitting?"Submitting…":"Submit reviewed attempt"}
                </Button>
              </section>
            ) : null}
          </div>
          {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}
          <div className="sticky bottom-0 z-10 mt-7 grid min-w-0 grid-cols-2 gap-2 border-t border-[var(--lms-canvas-border)] bg-white py-3 lg:static lg:border-t-0 lg:bg-transparent lg:py-0">
            {step>0?<Button variant="secondary" className="min-h-11 w-full md:min-h-9" onClick={() => setStep((value) => Math.max(0, value - 1))}>Previous</Button>:<span aria-hidden="true"/>}
            {step < questions.length - 1 ? (
              <Button className="min-h-11 w-full md:min-h-9" disabled={!current || (answers[current.id]??[]).length===0}
                title={!current || (answers[current.id]??[]).length===0?"Answer this question or use the question numbers to skip.":undefined}
                onClick={() => setStep((value) => Math.min(questions.length - 1, value + 1))}>Next</Button>
            ) : (
              <Button className="min-h-11 w-full md:min-h-9" loading={submitting} disabled={submitting} onClick={requestSubmit}>{submitting ? "Submitting…" : "Submit"}</Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
