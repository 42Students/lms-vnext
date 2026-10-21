import { formatWallClock, isPastDeadline } from "@/utils/dateUtils";
import { formatTimestamp } from "@/components/admin/projects/adminProjectUtils";
import React, { Fragment, useState, useEffect, useRef } from "react";
import { Alert, Progress, Form, Button, Radio, Checkbox, Input, Modal, Drawer, Tag, List, Typography } from "antd";
const { TextArea } = Input;
import Status from "./leftpanel";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { message, Empty, notification } from "antd";
import { useSelector } from "react-redux";
import { Markup } from "interweave";
import { useRouter } from "next/router";
import { getMyQuizSubmissionsV2, getQuizAttemptV2, getQuizSubmissionsV2, getQuizV2, submitQuizV2 } from "@/api/Services/quizServices";
import { decodeJwtPayload, getAccessToken, refreshAccessToken } from "@/utils/authUtils";
import { resolveEffectiveUserType } from "@/utils/quizRoleUtils";
import { getSafeInternalReturnPath } from "@/utils/navigationContext";

// Same row styling as the quiz list's own submissions modal (Quiz/Table/table.js) -- tinted
// avatar, name/detail, color-banded score pill -- reused here so a faculty member previewing a
// quiz from the Blueprint page (where "Quiz Preview" only ever showed questions/correct answers,
// with no student data at all) doesn't get a visually different, lesser experience.
const AVATAR_TINTS = [
  { bg: "#e0f2f1", fg: "#0f766e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dcfce7", fg: "#166534" },
];

function learnerInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function learnerAvatarTint(seedValue) {
  const seed = String(seedValue ?? "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TINTS[seed % AVATAR_TINTS.length];
}

function submissionLabel(item) {
  const name = item?.learnerName || item?.learnerRollNumber || (item?.learnerId ? `Learner ${item.learnerId}` : "Learner");
  const detail = [
    item?.learnerRollNumber ? `Roll ${item.learnerRollNumber}` : null,
    item?.learnerMobile,
  ].filter(Boolean).join(" - ");
  return { name, detail };
}

function quizScoreLabel(item) {
  const score = item?.score ?? item?.pointsObtained ?? item?.points_obtained ?? item?.grade ?? 0;
  const maxScore = item?.maxScore ?? item?.totalPoints ?? item?.points ?? item?.max_points;
  return maxScore != null ? `${score}/${maxScore}` : `${score}`;
}

function quizScoreBand(item) {
  const score = Number(item?.score ?? item?.pointsObtained ?? item?.points_obtained ?? item?.grade ?? 0);
  const maxScore = Number(item?.maxScore ?? item?.totalPoints ?? item?.points ?? item?.max_points);
  if (!maxScore) return "neutral";
  const pct = (score / maxScore) * 100;
  if (pct >= 75) return "high";
  if (pct >= 40) return "mid";
  return "low";
}

// A submission time is server UTC; read as local it showed 5½ hours early.
function formatSubmissionDate(value) {
  if (!value) return null;
  const text = formatTimestamp(Array.isArray(value) ? value : value?.date ?? value);
  return text && text !== "—" ? text : null;
}

const QUIZ_ALLOWED_TAGS = [
  'p', 'div', 'span',
  'strong', 'em', 'u', 's', 'br',
  'ul', 'ol', 'li',
  'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img',
  'code', 'pre', 'sub', 'sup',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const QUIZ_ALLOWED_ATTRS = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title'],
};

const getQuestionTypeLabel = (question) => {
  if (question?.question_type === "Multiple") return "Multiple choice";
  if (question?.question_type === "Single") return "Single choice";
  if (question?.question_type === "Word") return "Short answer";
  if (question?.question_type === "Description" || question?.question_type === "Discription") return "Written answer";
  return "Question";
};

// Review header: the deadline is what the author typed (wall-clock), the submission time is server
// UTC. Both used to print the raw browser format ("15/09/2026, 12:43:00").
const formatReviewDue = (value) => {
  const text = formatWallClock(value, "MMM D, YYYY h:mm A", "");
  return text || null;
};
const formatReviewDateTime = (value) => formatSubmissionDate(value);

// LRN-X-03: deadlines are compared in India time, the same rule the server uses.
const isPastDateTime = (value) => isPastDeadline(value);

const getReviewQuestionState = (selectedIndexes, correctIndexes) => {
  const normalizedSelected = [...selectedIndexes].sort((a, b) => a - b);
  const normalizedCorrect = [...correctIndexes].sort((a, b) => a - b);
  if (normalizedSelected.length === 0) return "unanswered";
  if (normalizedSelected.length !== normalizedCorrect.length) return "incorrect";
  return normalizedSelected.every((value, index) => value === normalizedCorrect[index]) ? "correct" : "incorrect";
};

function normalizeV2Quiz(data) {
  return {
    id: data?.id,
    quizId: data?.id,
    contentTitle: data?.title,
    dueAt: data?.dueAt ?? data?.due_at ?? data?.dueDate ?? null,
    questions: (data?.questions || []).map(question => ({
      id: question.id,
      question_type: question.type === "MULTIPLE_CHOICE" ? "Multiple" : "Single",
      question_data: { content: question.prompt },
      answer_data: {
        points: question.points,
        answers: (question.options || []).map(option => ({
          id: option.id,
          option_text: option.text,
        })),
      },
      correct_answer: {
        answer_array: (question.options || []).map(option => ({ option_value: !!option?.correct })),
      },
    })),
  };
}

const QuizPanel = () => {
  const router = useRouter();
  const quizId = router.query.quizId;
  const isV2Quiz = !!quizId;
  const isReviewMode = router.query.review === "true";
  const isEmbeddedRoadmap = router.query.embed === "roadmap";
  const successfulSubmitReturn = getSafeInternalReturnPath(router.query?.returnTo, {
    fallback: "/learn/allQuizzes",
    allowedPrefixes: ["/learn/allQuizzes", "/learn/courses"],
  });
  const [form] = Form.useForm();
  const [Next, setNext] = useState(false);
  const [step, setStep] = useState(0);
  const [stepsValid, setStepsValid] = useState([]);
  const [ProgressVal, setProgress] = useState(1);
  const [SelectedValues, setSelectedValues] = useState([]);
  const loginUser = useSelector(state => state.loginUser);
  const [api, contextHolder] = notification.useNotification();
  // Opened in the roadmap iframe (see syllabus.js), this page is a fresh browsing context with
  // its own in-memory access token starting empty -- decodeJwtPayload(getAccessToken()) reads
  // nothing on the very first render, and since it isn't React state, nothing forces a re-render
  // once a token does show up. Track the resolved userType in state instead, and if no access
  // token is available yet, proactively refresh one from the shared refresh token/cookie (rather
  // than waiting for some API call to 401) so the role resolves before the fetch effect below
  // commits to the wrong (learner) request.
  const [tokenUserType, setTokenUserType] = useState(
    () => decodeJwtPayload(getAccessToken() || "")?.userType || undefined
  );
  useEffect(() => {
    if (tokenUserType) return;
    if (getAccessToken()) return;
    let cancelled = false;
    refreshAccessToken()
      .then((token) => {
        if (cancelled) return;
        const userType = decodeJwtPayload(token || "")?.userType;
        if (userType) setTokenUserType(userType);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tokenUserType]);
  // See resolveEffectiveUserType for why this can't just read loginUser.userType directly.
  const effectiveUserType = resolveEffectiveUserType({ userType: tokenUserType }, loginUser);
  const isTeacherRole = effectiveUserType === "FACULTY" ? true : false;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [blinkOn, setBlinkOn] = useState(false);
  const [quizContent, setQuizContent] = useState(null);
  const [submissionsModal, setSubmissionsModal] = useState({ open: false, loading: false, submissions: [] });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  // A past-deadline quiz is never attemptable. Wherever a learner arrives from (Learning Path,
  // lesson view, a stale tab, a bookmarked link), swap the attempt for the read-only review: their
  // own attempt if they submitted, otherwise "Not attempted" with the answer key once released.
  const openReviewInstead = () => {
    router.replace({
      pathname: "/quiz",
      query: {
        quizId,
        contentTitle: router.query.contentTitle || "",
        review: "true",
        ...(isEmbeddedRoadmap ? { embed: "roadmap" } : {}),
      },
    });
  };
  const [isMobile, setIsMobile] = useState(false);
  const restoredOnceRef = useRef(false);
  const [reviewMeta, setReviewMeta] = useState(null);

  const extractReviewAnswers = (attempt) => {
    const answerMap = new Map();
    (attempt?.answers || []).forEach((answer) => {
      const selectedIds = Array.isArray(answer?.selectedOptionIds)
        ? answer.selectedOptionIds
        : String(answer?.selectedOptionIds || "")
            .split(",")
            .map((value) => Number(String(value).trim()))
            .filter((value) => Number.isFinite(value));
      answerMap.set(Number(answer?.questionId), selectedIds);
    });
    return answerMap;
  };

  const applyReviewAttempt = (normalizedQuiz, attempt) => {
    const answersByQuestion = extractReviewAnswers(attempt);
    const selected = normalizedQuiz.questions.map((question) => {
      const selectedOptionIds = answersByQuestion.get(Number(question?.id)) || [];
      const selectedIndexes = (question?.answer_data?.answers || [])
        .map((option, optionIndex) => selectedOptionIds.includes(Number(option?.id)) ? optionIndex : null)
        .filter((optionIndex) => optionIndex != null);
      if (question?.question_type === "Multiple") return selectedIndexes;
      return selectedIndexes.length > 0 ? selectedIndexes[0] : null;
    });
    setQuizContent(normalizedQuiz);
    setSelectedValues(selected);
    setStepsValid(selected.map((value) => hasAnswerValue(value)));
    setAlreadySubmitted(true);
    setReviewMeta({
      score: attempt?.score ?? 0,
      maxScore: attempt?.maxScore ?? 0,
      submittedAt: attempt?.submittedAt ?? null,
      attemptNumber: attempt?.attemptNumber ?? 1,
      resultsVisible: attempt?.resultsVisible !== false,
    });
  };

  const activeAccountKey = [
    loginUser?.userType || "anon",
    loginUser?.id || "0",
    loginUser?.collegeId || loginUser?.college_id || "no-college",
    loginUser?.organizationId || loginUser?.organization_id || "no-org",
    loginUser?.classId || loginUser?.class_id || "no-class",
  ].join(":");
  const activeQuizKey = isV2Quiz ? `${activeAccountKey}:v2:${quizId}` : null;
  const ssKey = (suffix) => (activeQuizKey ? `quiz:${activeQuizKey}:${suffix}` : null);
  const setSessionJson = (key, value) => {
    if (!key || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore (private mode / quota)
    }
  };
  const getSessionJson = (key) => {
    if (!key || typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const clearSessionKeys = (...keys) => {
    if (typeof window === "undefined") return;
    keys.filter(Boolean).forEach((key) => {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
  };
  const clearQuizTransientState = () => {
    clearSessionKeys(
      ssKey("localState"),
      ssKey("submitLock")
    );
  };

  const hasAnswerValue = (val) => {
    if (val === null || val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "string") return val.trim().length > 0;
    return true; // number/boolean/etc
  };

  useEffect(() => {
    // Runtime-only (Next.js): determine mobile layout for showing status drawer.
    const mql = typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)") : null;
    if (!mql) return;
    const apply = () => setIsMobile(!!mql.matches);
    apply();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    // Safari fallback
    mql.addListener(apply);
    return () => mql.removeListener(apply);
  }, []);

  const jumpToQuestion = (idx) => {
    const total = quizContent?.questions?.length || 0;
    if (typeof idx !== "number" || idx < 0 || idx >= total) return;
    setStep(idx);
    setProgress(idx + 1);
    setNext(hasAnswerValue(SelectedValues[idx]));
    if (isMobile) setIsStatusOpen(false);
  };

  useEffect(() => {
    let cancelled = false;
    if (isV2Quiz && quizId) {
      setLoading(true);
      setAlreadySubmitted(false);
      const request = isTeacherRole || isReviewMode
        ? Promise.all([
            getQuizV2(quizId, { includeCorrectAnswers: true }),
            isReviewMode ? getMyQuizSubmissionsV2(quizId) : Promise.resolve(null),
          ])
        : getQuizAttemptV2(quizId);
      request
        .then((res) => {
          if (cancelled) return;
          const data = isTeacherRole || isReviewMode ? res?.[0]?.data : res?.data;
          const normalized = normalizeV2Quiz(data);
          if (normalized.questions.length > 0) {
            if (isReviewMode) {
              const attempts = res?.[1]?.data || [];
              const latestAttempt = Array.isArray(attempts) && attempts.length > 0 ? attempts[0] : null;
              if (latestAttempt) {
                applyReviewAttempt(normalized, latestAttempt);
                return;
              }
              if (!isTeacherRole) {
                const hasAnswerKey = normalized.questions.some((question) =>
                  (question?.correct_answer?.answer_array || []).some((item) => item?.option_value));
                setQuizContent(normalized);
                setSelectedValues(normalized.questions.map(() => null));
                setReviewMeta({ notAttempted: true, resultsVisible: hasAnswerKey, dueAt: normalized?.dueAt ?? null });
                return;
              }
            }
            // #9: getQuizForAttempt (the backend endpoint behind getQuizAttemptV2, used here to
            // start a new attempt) never checks the deadline at all -- only submitQuiz does. A
            // learner could open a past-deadline quiz, fill in every answer, and only discover it
            // was already too late when Submit came back with a 400. Catching it here, before the
            // fill-out form ever renders, matches the same early-redirect pattern this effect
            // already uses for "maximum attempts reached" in the catch block below.
            if (!isTeacherRole && !isReviewMode && isPastDateTime(normalized?.dueAt)) {
              openReviewInstead();
              return;
            }
            setQuizContent(normalized);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          if (isV2Quiz && !isTeacherRole && !isReviewMode && err?.response?.status === 400) {
            const msg = String(err?.response?.data?.message || "").toLowerCase();
            // The attempt endpoint now refuses a past-deadline quiz server-side too.
            if (msg.includes("deadline has passed")) {
              openReviewInstead();
              return;
            }
            if (msg.includes("maximum quiz attempts reached")) {
              router.replace({
                pathname: "/quiz",
                query: {
                  quizId,
                  contentTitle: router.query.contentTitle || "",
                  review: "true",
                  ...(isEmbeddedRoadmap ? { embed: "roadmap" } : {}),
                },
              });
              return;
            }
          }
          api.error({
            message: "Server Notification",
            description: err?.response?.data?.message || "Failed to load quiz.",
            placement: "bottomRight",
          });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => { cancelled = true; };
  }, [quizId, isReviewMode, isTeacherRole, isV2Quiz]);

  useEffect(() => {
    if (!activeQuizKey || restoredOnceRef.current || alreadySubmitted) return;

    const localState = getSessionJson(ssKey("localState"));
    if (!localState) return;

    const localAnswers = Array.isArray(localState?.answers) ? localState.answers : null;
    const localStep = Number.isInteger(localState?.step) ? localState.step : null;

    if (!localAnswers) return;

    setSelectedValues(localAnswers);
    setStepsValid(localAnswers.map((v) => hasAnswerValue(v)));
    if (typeof localStep === "number" && localStep >= 0) {
      setStep(localStep);
      setProgress(localStep + 1);
      setNext(hasAnswerValue(localAnswers[localStep]));
      form.setFieldsValue({ Answer: localAnswers[localStep] ?? undefined });
    }

    restoredOnceRef.current = true;
  }, [activeQuizKey, form, alreadySubmitted]);

  useEffect(() => {
    if (!activeQuizKey || alreadySubmitted || isReviewMode || isTeacherRole) return;
    if (!Array.isArray(quizContent?.questions) || quizContent.questions.length === 0) return;
    setSessionJson(ssKey("localState"), {
      answers: SelectedValues,
      step,
      updatedAt: Date.now(),
    });
  }, [SelectedValues, step, activeQuizKey, alreadySubmitted, isReviewMode, isTeacherRole, quizContent?.questions?.length]);

  useEffect(() => {
    if (quizContent?.questions?.length && step < quizContent.questions.length) {
      form.setFieldsValue({ Answer: SelectedValues[step] ?? undefined });
    }
  }, [step, quizContent?.questions?.length, SelectedValues]);

  const submits = () => {
    if (isTeacherRole) {
      setBlinkOn(true);
      setTimeout(() => setBlinkOn(false), 3000);
      return;
    }
    if (alreadySubmitted) {
      api.info({
        message: "Already submitted",
        description: "This quiz is already submitted. Check your quiz list.",
        placement: "bottomRight",
        duration: 6,
      });
      router.push({ pathname: "/learn/allQuizzes" });
      return;
    }
    if (!quizId || !quizContent?.id) {
      api.error({
        message: "Cannot submit",
        description: "Quiz not loaded. Open the quiz from the syllabus or quiz list.",
        placement: "bottomRight",
      });
      return;
    }
    const totalQ = quizContent?.questions?.length || 0;
    if (isPastDateTime(quizContent?.dueAt)) {
      api.error({
        message: "Deadline passed",
        description: "This quiz deadline has passed. Your answers cannot be submitted now.",
        placement: "bottomRight",
        duration: 8,
      });
      return;
    }
    const answeredCount = SelectedValues.filter(hasAnswerValue).length;
    if (answeredCount < totalQ) {
      const unanswered = totalQ - answeredCount;
      api.warning({
        message: "Unanswered Questions",
        description: `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Your quiz will still be submitted.`,
        placement: "bottomRight",
        duration: 8,
      });
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    setSubmitting(true);
    const lockKey = ssKey("submitLock");
    const now = Date.now();
    const existingLock = getSessionJson(lockKey);
    if (existingLock && typeof existingLock?.ts === "number" && now - existingLock.ts < 30_000) {
      submittingRef.current = false;
      setSubmitting(false);
      api.warning({
        message: "Please wait",
        description: "A submission is already in progress in this tab.",
        placement: "bottomRight",
        duration: 6,
      });
      return;
    }
    setSessionJson(lockKey, { ts: now });
    const placement = "bottomLeft";
    const payload = {
      answers: (quizContent?.questions || []).map((q, i) => {
        const value = SelectedValues[i];
        const selectedIndexes = Array.isArray(value) ? value : [value];
        const selectedOptionIds = selectedIndexes
          .filter(item => item !== null && item !== undefined && item !== "")
          .map(index => q?.answer_data?.answers?.[Number(index)]?.id)
          .filter(Boolean);
        return {
          questionId: q.id,
          selectedOptionIds,
        };
      }),
      // LRN-Q-01: the questions this learner was shown, so a quiz edited mid-attempt is refused with
      // a clear "reload" message instead of being scored against a different question set.
      shownQuestionIds: (quizContent?.questions || []).map((q) => q?.id).filter((id) => id != null),
    };
    submitQuizV2(quizContent.quizId || quizId, payload)
      .then((response) => {
        const data = response?.data;
        const resultsVisible = data?.resultsVisible !== false;
        api.success({
          message: "Server Notification",
          description: resultsVisible
            ? `Quiz submitted! Score: ${data?.score ?? 0}/${data?.maxScore ?? 0}`
            : "Quiz submitted. Results will be visible after faculty releases them.",
          icon: <CheckCircleOutlined style={{ color: "green" }} />,
          placement,
          duration: 8,
        });
        clearQuizTransientState();
        setAlreadySubmitted(true);
        // LRN-Q-05: leave explicitly, never through browser history. Embedded in the Learning Path,
        // ask the parent to close the viewer (it re-fetches progress and the quiz list on close);
        // otherwise go back to where the learner came from (a checked internal path, default the quiz list).
        setTimeout(() => {
          if (isEmbeddedRoadmap && typeof window !== "undefined" && window.parent !== window) {
            window.parent.postMessage({ type: "closeRoadmapQuiz" }, window.location.origin);
            return;
          }
          router.replace(successfulSubmitReturn);
        }, 2000);
      })
      .catch((err) => {
        const submitMessage = err?.response?.data?.message || "Submission failed. Please try again.";
        setSubmitError(submitMessage);
        api.info({
          message: "Server Notification",
          description: submitMessage,
          icon: <ExclamationCircleOutlined style={{ color: "red" }} />,
          placement,
          duration: 8,
        });
      })
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
        if (typeof window !== "undefined") {
          try { window.sessionStorage.removeItem(ssKey("submitLock")); } catch {}
        }
      });
  };

  const showModal = () => {
    if (submitting) return;
    if (!isTeacherRole) {
      setIsModalOpen(true);
    }
  };
  const handleOk = () => {
    if (isTeacherRole || submitting) return;
    setIsModalOpen(false);
    if (isEmbeddedRoadmap) {
      // Embedded inside syllabus.js's roadmap iframe — navigating this frame's own
      // location would just load the destination page nested inside the small
      // embedded view, so ask the parent page to close the modal instead.
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage({ type: "closeRoadmapQuiz" }, window.location.origin);
      }
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push({ pathname: "/learn/allQuizzes" });
    }
  };
  const handleCancel = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const openSubmissions = () => {
    if (submissionsModal.loading || !quizId) return;
    setSubmissionsModal({ open: true, loading: true, submissions: [] });
    getQuizSubmissionsV2(quizId)
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setSubmissionsModal({ open: true, loading: false, submissions: Array.isArray(list) ? list : [] });
      })
      .catch((err) => {
        message.error(err?.response?.data?.message || "Failed to load quiz submissions");
        setSubmissionsModal({ open: false, loading: false, submissions: [] });
      });
  };

  const Answered = e => {
    if (alreadySubmitted) return;
    const $val = e?.target?.value;
    const hasValue =
      $val !== null &&
      $val !== undefined &&
      (typeof $val === "number" || String($val).length > 0);
    setSelectedValues(prev => {
      const next = [...prev];
      next[step] = hasValue ? $val : null;
      return next;
    });
    setStepsValid(prev => {
      const next = [...prev];
      next[step] = hasValue;
      return next;
    });
    setNext(hasValue);
  };

  const PreviousStep = () => {
    const prevStep = step - 1;
    setStep(prevStep);
    setProgress(prevStep + 1);
    setNext(hasAnswerValue(SelectedValues[prevStep]));
  };

  const NextStep = () => {
    if (alreadySubmitted) return;
    if (!hasAnswerValue(SelectedValues[step])) return;
    const nextStep = step + 1;
    setStep(nextStep);
    setProgress(nextStep + 1);
    setNext(hasAnswerValue(SelectedValues[nextStep]));
  };


  return (
    <div className={`d-md-flex h-100 ln-quiz-page${isEmbeddedRoadmap ? " ln-quiz-page--embedded" : ""}`}>
      {quizContent?.questions?.length > 0 && !isTeacherRole && !isReviewMode && !isEmbeddedRoadmap && (
        <div className="ln-quiz-left-panel">
          <Status
            Checkboxvalid={stepsValid}
            questionlist={quizContent?.questions}
            CancelQuiz={showModal}
            contentTitle={quizContent?.contentTitle}
            onJump={jumpToQuestion}
          />
        </div>
      )}
      <div
        className={
          "ln-quiz-panel ln-quiz-main" +
          (isEmbeddedRoadmap ? " ln-quiz-main--embedded" : "") +
          (quizContent?.questions?.length < 1 ? " align-item-center m-auto" : "")
        }
      >
        {loading ? (
          <Empty description="Loading quiz..." />
        ) : !quizId ? (
          <Empty description="Open the quiz from the syllabus or quiz list." />
        ) : Array.isArray(quizContent?.questions) && quizContent.questions.length > 0 ? (
          <>
            {alreadySubmitted && !isReviewMode && !isTeacherRole && (
              <div className="alert alert-info mb-3" role="alert">
                This quiz is already submitted.{" "}
                <Button type="link" onClick={() => router.push({ pathname: "/learn/allQuizzes" })}>
                  Go to quiz list
                </Button>
              </div>
            )}
            {isTeacherRole ? (
              <div className="ln-quiz-teacher-preview">
                <div className="ln-quiz-teacher-preview__head">
                  <div className="ln-quiz-teacher-preview__nav">
                    <Button type="default" onClick={() => router.back()}>
                      Back
                    </Button>
                    {/* Was entirely missing -- "Quiz Preview" from Blueprint showed only the
                        questions and correct answers, with no way to see who actually took the
                        quiz or how they scored without leaving for the My Quizzes list instead. */}
                    <Button type="primary" icon={<TeamOutlined aria-hidden />} onClick={openSubmissions}>
                      View Submissions
                    </Button>
                    {/* #26: the same score-distribution + question-accuracy report reachable from
                        All Quizzes, so it's one report regardless of which list you opened it from. */}
                    <Button
                      icon={<BarChartOutlined aria-hidden />}
                      onClick={() => router.push({ pathname: "/teacher/report/quiz/[quizId]", query: { quizId } })}
                    >
                      View Report
                    </Button>
                  </div>
                  <h3>Quiz Preview</h3>
                  <p>Review questions, options, and correct answers.</p>
                </div>
                <div className="ln-quiz-teacher-preview__list">
                  {quizContent.questions.map((question, index) => {
                    const answers = question?.answer_data?.answers ?? [];
                    const correctArray = question?.correct_answer?.answer_array ?? [];
                    const correctIndexes = correctArray
                      .map((item, answerIndex) => item?.option_value ? answerIndex : null)
                      .filter(answerIndex => answerIndex != null);
                    return (
                      <div key={question?.id ?? index} className="ln-quiz-teacher-preview__card">
                        <div className="ln-quiz-teacher-preview__meta">
                          <span className="ln-quiz-teacher-preview__question-number">Question {index + 1}</span>
                          <span className="ln-quiz-teacher-preview__points">{question?.answer_data?.points ?? 0} pts</span>
                        </div>
                        <div className="ln-quiz-teacher-preview__question">
                          <Markup
                            content={question?.question_data?.content ?? ""}
                            allowList={QUIZ_ALLOWED_TAGS}
                            allowAttributes={QUIZ_ALLOWED_ATTRS}
                          />
                        </div>
                        <div className="ln-quiz-teacher-preview__answers">
                          {answers.map((option, answerIndex) => (
                            <div
                              key={option?.id ?? answerIndex}
                              className={`ln-quiz-teacher-preview__option ${correctIndexes.includes(answerIndex) ? "is-correct" : ""}`}
                            >
                              <span>{String.fromCharCode(65 + answerIndex)}.</span>
                              <span>{option?.option_text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : isReviewMode ? (
              <div className="ln-quiz-teacher-preview">
                <div className="ln-quiz-teacher-preview__head">
                  <div className="ln-quiz-teacher-preview__nav">
                    <Button
                      type="default"
                      onClick={() => {
                        if (isEmbeddedRoadmap && typeof window !== "undefined" && window.parent !== window) {
                          window.parent.postMessage({ type: "closeRoadmapQuiz" }, window.location.origin);
                          return;
                        }
                        router.push({ pathname: "/learn/allQuizzes" });
                      }}
                    >
                      {isEmbeddedRoadmap ? "Close" : "Back to Quiz List"}
                    </Button>
                  </div>
                  <h3>{reviewMeta?.notAttempted ? "Not attempted" : "Quiz Review"}</h3>
                  <p>
                    {reviewMeta?.notAttempted
                      ? reviewMeta?.resultsVisible
                        ? "You didn't attempt this quiz before its deadline. The correct answers are marked below so you can still learn from it."
                        : "You didn't attempt this quiz before its deadline. The correct answers will appear here once your faculty releases results."
                      : reviewMeta?.resultsVisible === false
                        ? "Your attempt is submitted. Results will appear after faculty releases them."
                        : "Review your answers, see the correct options, and understand where you lost marks."}
                  </p>
                  <div className="ln-quiz-review-summary ln-quiz-review-summary--hero">
                    <div className="ln-quiz-review-summary__metric">
                      <span className="ln-quiz-review-summary__label">Score</span>
                      <strong>
                        {reviewMeta?.notAttempted
                          ? "Not attempted"
                          : reviewMeta?.resultsVisible === false
                            ? "Not released"
                            : `${reviewMeta?.score ?? 0}/${reviewMeta?.maxScore ?? 0}`}
                      </strong>
                    </div>
                    {reviewMeta?.notAttempted ? (
                      <div className="ln-quiz-review-summary__metric">
                        <span className="ln-quiz-review-summary__label">Questions</span>
                        <strong>{quizContent?.questions?.length ?? 0}</strong>
                      </div>
                    ) : (
                      <div className="ln-quiz-review-summary__metric">
                        <span className="ln-quiz-review-summary__label">Attempt</span>
                        <strong>{reviewMeta?.attemptNumber ?? 1}</strong>
                      </div>
                    )}
                    {reviewMeta?.notAttempted && formatReviewDue(reviewMeta?.dueAt) ? (
                      <div className="ln-quiz-review-summary__metric">
                        <span className="ln-quiz-review-summary__label">Deadline was</span>
                        <strong>{formatReviewDue(reviewMeta?.dueAt)}</strong>
                      </div>
                    ) : null}
                    {formatReviewDateTime(reviewMeta?.submittedAt) ? (
                      <div className="ln-quiz-review-summary__metric">
                        <span className="ln-quiz-review-summary__label">Submitted</span>
                        <strong>{formatReviewDateTime(reviewMeta?.submittedAt)}</strong>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="ln-quiz-teacher-preview__list">
                  {quizContent.questions.map((question, index) => {
                    const answers = question?.answer_data?.answers ?? [];
                    const selectedValue = SelectedValues[index];
                    const selectedIndexes = Array.isArray(selectedValue)
                      ? selectedValue
                      : selectedValue == null ? [] : [selectedValue];
                    const correctIndexes = (question?.correct_answer?.answer_array || [])
                      .map((item, answerIndex) => item?.option_value ? answerIndex : null)
                      .filter(answerIndex => answerIndex != null);
                    const resultsVisible = reviewMeta?.resultsVisible !== false;
                    const questionState = resultsVisible ? getReviewQuestionState(selectedIndexes, correctIndexes) : "withheld";
                    return (
                      <div key={question?.id ?? index} className="ln-quiz-teacher-preview__card">
                        <div className="ln-quiz-teacher-preview__meta">
                          <div className="ln-quiz-teacher-preview__meta-main">
                            <span className="ln-quiz-teacher-preview__question-number">Question {index + 1}</span>
                            <Tag color={reviewMeta?.notAttempted ? "default" : questionState === "correct" ? "green" : questionState === "incorrect" ? "red" : "default"}>
                              {reviewMeta?.notAttempted
                                ? "Not attempted"
                                : questionState === "withheld"
                                ? "Submitted"
                                : questionState === "correct"
                                  ? "Correct"
                                  : questionState === "incorrect"
                                    ? "Incorrect"
                                    : "Not answered"}
                            </Tag>
                          </div>
                          <span className="ln-quiz-teacher-preview__points">{question?.answer_data?.points ?? 0} pts</span>
                        </div>
                        <div className="ln-quiz-teacher-preview__question">
                          <Markup
                            content={question?.question_data?.content ?? ""}
                            allowList={QUIZ_ALLOWED_TAGS}
                            allowAttributes={QUIZ_ALLOWED_ATTRS}
                          />
                        </div>
                        <div className="ln-quiz-teacher-preview__answers">
                          {answers.map((option, answerIndex) => {
                            const isSelected = selectedIndexes.includes(answerIndex);
                            const isCorrect = resultsVisible && correctIndexes.includes(answerIndex);
                            const isWrongSelection = resultsVisible && isSelected && !isCorrect;
                            return (
                              <div
                                key={option?.id ?? answerIndex}
                                className={`ln-quiz-teacher-preview__option ${isCorrect ? "is-correct" : ""} ${isSelected ? "is-selected" : ""} ${isWrongSelection ? "is-incorrect" : ""}`}
                              >
                                <div className="ln-quiz-teacher-preview__option-copy">
                                  <span>{String.fromCharCode(65 + answerIndex)}.</span>
                                  <span>{option?.option_text}</span>
                                </div>
                                <div className="ln-quiz-teacher-preview__badges">
                                  {isSelected ? <Tag color="geekblue">Your answer</Tag> : null}
                                  {isCorrect ? <Tag color="green">Correct</Tag> : null}
                                  {isWrongSelection ? <Tag color="red">Incorrect</Tag> : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
            <>
            <div className="ln-quiz-progress-bar ln-quiz-attempt-header pb-md-4 pb-lg-3 w-100">
              <Progress
                percent={
                  ((Math.min(step + 1, quizContent?.questions?.length || 1)) / (quizContent?.questions?.length || 1)) * 100
                }
                showInfo={false}
              />
              <div className="d-flex align-items-center justify-content-between">
                <div className="ln-quiz-step-num clrgray7AE">
                  {step + 1 > quizContent?.questions?.length ? (
                    <span>{step}</span>
                  ) : (
                    <span>{step + 1}</span>
                  )}
                  <span className="clrgray7AE">
                    &nbsp;/&nbsp;{quizContent?.questions?.length}
                  </span>
                  {quizContent?.questions?.[step] && (
                    <span className="ln-quiz-question-type-badge">
                      {getQuestionTypeLabel(quizContent.questions[step])}
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center ln-quiz-header-actions">
                  {isMobile && (
                    <Button
                      type="default"
                      size="small"
                      onClick={() => setIsStatusOpen(true)}
                      aria-label="Open question status"
                    >
                      Questions
                    </Button>
                  )}
                  {step === 0 && (
                    <Button
                      type="default"
                      size="small"
                      icon={<ArrowLeftOutlined />}
                      onClick={showModal}
                      disabled={submitting}
                      aria-label="Back to quiz list"
                      className="ln-quiz-back-btn"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="default"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={showModal}
                    disabled={submitting}
                    aria-label="Close quiz"
                    className="ln-quiz-close-btn"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>

            <div className="ln-quiz-body mt-lg-4 col-12 col-md-8 pe-3 ln-quiz-body-scroll">
              <div className="ln-quiz">
                <div className="ln-quiz__item">
                  {step === quizContent?.questions?.length ? (
                    <h2 className="black">
                      Do you want to Submit your answers...?
                    </h2>
                  ) : (
                    ""
                  )}

                  {(Array.isArray(quizContent?.questions) ? quizContent.questions : []).map((q, i) => {
                    if (i === step) {
                      return (
                        <div key={i} className="ln-quiz-question-card">
                          <Form
                            name="basic"
                            form={form}
                            autoComplete="off"
                            className="ln-Quiz-form d-flex flex-column"
                            initialValues={{
                              Answer: SelectedValues[step] ?? undefined,
                            }}
                            labelCol={{
                              span: 24,
                            }}
                            wrapperCol={{
                              span: 24,
                            }}
                          >
                            <Form.Item
                              label={
                                <Markup
                                  content={q?.question_data?.content ?? ""}
                                  allowList={QUIZ_ALLOWED_TAGS}
                                  allowAttributes={QUIZ_ALLOWED_ATTRS}
                                />
                              }
                              key={i}
                              className="ln-quiz-answer-item"
                            >
                              <div className="ln-quiz-form-item-content">
                                {q.question_type === "Single" ? (
                                  <div>
                                    <Radio.Group
                                      value={SelectedValues[i] ?? undefined}
                                      onChange={Answered}
                                      disabled={alreadySubmitted || submitting}
                                    >
                                      <div className="d-flex flex-wrap justify-content-between ln-quiz-radio-group">
                                        {(q?.answer_data?.answers ?? []).map((o, x) => {
                                          return (
                                            <div key={x} className="col-12 col-md-6 mb-4 ln-quiz-radio-group__item">
                                              <Radio.Button
                                                value={x}
                                              >
                                                {String.fromCharCode(97 + x)}.{" "}
                                                {o.option_text}
                                              </Radio.Button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </Radio.Group>
                                  </div>
                                ) : (
                                  ""
                                )}
                                {q.question_type === "Multiple" ? (
                                  <div>
                                    <Checkbox.Group
                                      className="d-flex flex-wrap justify-content-between"
                                      options={(q?.answer_data?.answers ?? []).map((o, x) => ({ label: o.option_text, value: x }))}
                                      value={SelectedValues[i] ?? undefined}
                                      disabled={alreadySubmitted || submitting}
                                      onChange={e => {
                                        if (alreadySubmitted) return;
                                        setSelectedValues(prev => {
                                          const next = [...prev];
                                          next[step] = e.length > 0 ? e : null;
                                          return next;
                                        });
                                        setStepsValid(prev => {
                                          const next = [...prev];
                                          next[step] = e.length > 0;
                                          return next;
                                        });
                                        setNext(e.length > 0);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  ""
                                )}

                                {q.question_type === "Word" ? (
                                  <div>
                                    <Input
                                      className="quiz-input"
                                      placeholder="Enter Answer in word"
                                      value={SelectedValues[i] ?? ""}
                                      onChange={Answered}
                                      disabled={alreadySubmitted || submitting}
                                    />
                                  </div>
                                ) : (
                                  ""
                                )}

                                {(q.question_type === "Description" || q.question_type === "Discription") ? (
                                  <div>
                                    {/* TODO: "Discription" is legacy typo; keep for backward compatibility with existing quiz data */}
                                    <TextArea
                                      className="quiz-textarea"
                                      value={SelectedValues[i] ?? ""}
                                      onChange={Answered}
                                      disabled={alreadySubmitted || submitting}
                                    />
                                  </div>
                                ) : (
                                  ""
                                )}
                              </div>
                            </Form.Item>
                          </Form>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>

            <div className="ln-quiz-footer ln-quiz-navigation-footer mt-auto pe-3 ln-quiz-footer-actions">
              {step === quizContent?.questions?.length ? (
                <Form.Item>
                  {submitError ? (
                    <Alert
                      type="error"
                      showIcon
                      message="Quiz was not submitted"
                      description={submitError}
                      style={{ marginBottom: 12 }}
                    />
                  ) : null}
                  <Button
                    htmltype="button"
                    className="ln-btn ln-ant-btn ln-btn--blue-trans me-2 w-160"
                    onClick={PreviousStep}
                    aria-label="Go to previous question"
                  >
                    Previous
                  </Button>

                  <Button
                    type="primary"
                    className="ln-btn ln-btn--regular ln-ant-btn w-160"
                    onClick={submits}
                    loading={submitting}
                    disabled={submitting || alreadySubmitted}
                  >
                    Submit
                  </Button>
                </Form.Item>
              ) : (
                <Form.Item>
                  {step >= 1 ? (
                    <Button
                      htmltype="button"
                      className="ln-btn ln-ant-btn ln-btn--blue-trans me-2 w-160"
                      onClick={PreviousStep}
                      disabled={submitting}
                      aria-label="Go to previous question"
                    >
                      Previous
                    </Button>
                  ) : (
                    ""
                  )}

                  <Button
                    type="primary"
                    className="ln-btn ln-btn--regular ln-ant-btn w-160"
                    disabled={
                      submitting ||
                      alreadySubmitted ||
                      SelectedValues[step] == null ||
                      (typeof SelectedValues[step] === "string" && SelectedValues[step] === "") ||
                      (Array.isArray(SelectedValues[step]) && SelectedValues[step].length === 0)
                    }
                    onClick={NextStep}
                    aria-label="Go to next question"
                  >
                    Next
                  </Button>
                </Form.Item>
              )}
            </div>
            </>
            )}
          </>
        ) : (
          <Empty description="No Quiz Found" />
        )}
      </div>
      {contextHolder}
      {!isTeacherRole ? (
        <Modal
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          cancelText={"No"}
          okText={"Yes"}
          okButtonProps={{ disabled: submitting }}
          cancelButtonProps={{ disabled: submitting }}
        >
          <h2>Are you sure you want to cancel this quiz?</h2>
        </Modal>
      ) : null}

      {isTeacherRole && (
        <Modal
          title={quizContent?.contentTitle || "Quiz submissions"}
          open={submissionsModal.open}
          onCancel={() => setSubmissionsModal((prev) => ({ ...prev, open: false }))}
          footer={null}
          centered
          width={720}
          className="ln-mobile-safe-modal quiz-submissions-v2-modal"
          wrapClassName="ln-mobile-safe-modal-wrap"
        >
          {submissionsModal.loading ? (
            <div className="quiz-create-context-modal__loading">Loading submissions…</div>
          ) : submissionsModal.submissions.length ? (
            <>
              <div className="quiz-submissions-v2-summary">
                {submissionsModal.submissions.length} {submissionsModal.submissions.length === 1 ? "submission" : "submissions"}
              </div>
              <List
                className="quiz-submissions-v2-list"
                itemLayout="horizontal"
                dataSource={submissionsModal.submissions}
                renderItem={(item) => {
                  const { name, detail } = submissionLabel(item);
                  const dateLabel = formatSubmissionDate(
                    item.submittedAt ?? item.submitted_at ?? item.createdAt ?? item.created_at
                  );
                  const tint = learnerAvatarTint(item?.learnerId ?? name);
                  return (
                    <List.Item className="quiz-submission-row">
                      <span
                        className="quiz-submission-row__avatar"
                        style={{ background: tint.bg, color: tint.fg }}
                        aria-hidden="true"
                      >
                        {learnerInitials(name)}
                      </span>
                      <span className="quiz-submission-row__body">
                        <span className="quiz-submission-row__name">{name}</span>
                        <span className="quiz-submission-row__detail">
                          {[detail, item.status || "Submitted"].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="quiz-submission-row__meta">
                        <span className={`quiz-submission-row__score quiz-submission-row__score--${quizScoreBand(item)}`}>
                          {quizScoreLabel(item)}
                        </span>
                        {dateLabel && (
                          <Typography.Text type="secondary" className="quiz-submission-row__date">
                            {dateLabel}
                          </Typography.Text>
                        )}
                      </span>
                    </List.Item>
                  );
                }}
              />
            </>
          ) : (
            <Empty description="No submissions yet" />
          )}
        </Modal>
      )}

      <Drawer
        title="Question Status"
        placement="right"
        open={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        width="100%"
        className="ln-quiz-status-drawer"
      >
        <Status
          Checkboxvalid={stepsValid}
          questionlist={quizContent?.questions}
          CancelQuiz={showModal}
          contentTitle={quizContent?.contentTitle}
          showLogo={false}
          onJump={jumpToQuestion}
        />
      </Drawer>
    </div>
  );
};
export default QuizPanel;
