import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Modal } from "antd";
import { CalendarOutlined, FileTextOutlined, FormOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import ContentTitle, { ContentAddedDate } from "@/components/Course/Syllabus/ContentTitle";
import { deadlineMs } from "@/utils/dateUtils";

const ViewAssignmentModal = dynamic(() => import("@/components/Assignments/ViewAssignmentModal"), { ssr: false });

function dueOf(content) {
  const data = content?.contentDataDTO || content?.content_data_dto || {};
  const raw = content?.deadline ?? data.due_date ?? data.dueDate ?? content?.dueAt ?? null;
  if (!raw) return null;
  const ms = deadlineMs(raw);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

function formatDue(date) {
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function ActivityCard({ icon, content, typeLabel, due, status, actionLabel, onAction, actionType = "primary", actionDisabled = false }) {
  return (
    <div className="ln-activity-card">
      <div className="ln-activity-card__head">
        <ContentTitle content={content} contentType={typeLabel} />
        <ContentAddedDate content={content} />
      </div>
      <div className="ln-activity-card__body">
        <span className="ln-activity-card__icon" aria-hidden="true">{icon}</span>
        <div className="ln-activity-card__info">
          {status ? <span className={`ln-activity-status ln-activity-status--${status.tone}`}>{status.label}</span> : null}
          <span className={`ln-activity-card__due${status?.tone === "late" || status?.tone === "missed" ? " is-late" : ""}`}>
            <CalendarOutlined aria-hidden="true" /> {due ? `${due.getTime() < Date.now() ? "Was due" : "Due"} ${formatDue(due)}` : "No due date"}
          </span>
        </div>
        <Button type={actionType} onClick={onAction} disabled={actionDisabled} className="ln-activity-card__action">{actionLabel}</Button>
      </div>
    </div>
  );
}

/**
 * Assignment on the lesson page. Was rendered as <ViewAssignmentModal open ...> straight inside
 * the list, so opening a lesson popped every assignment's drawer at once and closing one sent the
 * learner back to the Learning Path. Now a card that opens the drawer on demand.
 */
export function AssignmentLessonCard({ content, submitted, submissionStateUnknown = false, onClosed }) {
  const loginUser = useSelector((state) => state.loginUser);
  const isLearner = loginUser?.userType === "LEARNER";
  const [open, setOpen] = useState(false);
  const due = dueOf(content);
  const deadlineUnavailable = !due;
  const past = Boolean(due && due.getTime() < Date.now());
  const status = !isLearner
    ? null
    : submissionStateUnknown
      ? { tone: "pending", label: "Submission status unavailable" }
      : submitted
        ? { tone: "done", label: "Submitted" }
        : deadlineUnavailable
          ? { tone: "pending", label: "Submission unavailable · deadline missing" }
          : past
            ? { tone: "late", label: "Closed · not submitted" }
            : { tone: "open", label: "Not submitted" };
  return (
    <>
      <ActivityCard
        icon={<FileTextOutlined />}
        content={content}
        typeLabel="Assignment"
        due={due}
        status={status}
        actionLabel={!isLearner ? "Open assignment" : submissionStateUnknown ? "Open assignment" : submitted ? "View submission" : deadlineUnavailable || past ? "View assignment" : "Open & submit"}
        actionType={isLearner && !submissionStateUnknown && !submitted && !deadlineUnavailable && !past ? "primary" : "default"}
        onAction={() => setOpen(true)}
      />
      {open ? (
        <ViewAssignmentModal open={open} onClose={() => { setOpen(false); onClosed?.(); }} assignmentContent={content} insideSyllabus />
      ) : null}
    </>
  );
}

/**
 * Quiz on the lesson page. Was a live attempt iframe per quiz embedded in the list, so opening a
 * lesson loaded every quiz's attempt form inline. Now a card with the learner's state that opens
 * the attempt / review / faculty preview in a window.
 */
export function QuizLessonCard({ content, onClosed }) {
  const loginUser = useSelector((state) => state.loginUser);
  const isLearner = loginUser?.userType === "LEARNER";
  const [open, setOpen] = useState(false);
  const due = dueOf(content);
  const deadlineConfigured = Boolean(due);
  const past = Boolean(due && due.getTime() < Date.now());
  const submitted = Boolean(content?.submitted) || Number(content?.attemptCount || 0) > 0;
  const attemptCount = Number(content?.attemptCount || 0);
  const maxAttempts = Math.max(1, Number(content?.maxAttempts || 1));
  const canRetake = submitted && attemptCount < maxAttempts && deadlineConfigured && !past;
  const reviewOnly = isLearner && ((submitted && !canRetake) || (!submitted && past));
  const status = !isLearner
    ? (String(content?.status || "").toUpperCase() === "DRAFT" ? { tone: "open", label: "Draft · hidden from students" } : null)
    : submitted
      ? { tone: "done", label: canRetake ? "Submitted · retake available" : "Submitted" }
      : !deadlineConfigured
        ? { tone: "pending", label: "Unavailable · deadline missing" }
        : past
          ? { tone: "missed", label: "Missed · not attempted" }
          : { tone: "open", label: "Not attempted" };
  const actionLabel = !isLearner
    ? "Preview quiz"
    : !submitted && !deadlineConfigured
      ? "Unavailable"
      : !submitted && past
        ? (content?.gradePublished === true ? "View answers" : "Review quiz")
        : submitted
        ? (canRetake ? "Retake quiz" : "Review attempt")
        : "Start quiz";
  const quizId = content?.quizId ?? content?.quiz_id ?? content?.id;
  const src = quizId
    ? `/quiz?quizId=${encodeURIComponent(quizId)}&embed=roadmap${reviewOnly ? "&review=true" : ""}`
    : "";

  // The embedded quiz page asks its parent to close via postMessage (its Close / Done buttons).
  useEffect(() => {
    if (!open) return undefined;
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event?.data?.type === "closeRoadmapQuiz") {
        setOpen(false);
        onClosed?.();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, onClosed]);

  return (
    <>
      <ActivityCard
        icon={<FormOutlined />}
        content={content}
        typeLabel="Quiz"
        due={due}
        status={status}
        actionLabel={actionLabel}
        actionType={actionLabel === "Start quiz" || actionLabel === "Retake quiz" ? "primary" : "default"}
        actionDisabled={isLearner && !submitted && !deadlineConfigured}
        onAction={() => setOpen(true)}
      />
      <Modal
        open={open}
        onCancel={() => { setOpen(false); onClosed?.(); }}
        footer={null}
        width="min(1120px, 92vw)"
        destroyOnClose
        centered
        title={content?.contentTitle || content?.title || "Quiz"}
        className="ln-roadmap-content-modal"
      >
        {src ? (
          <iframe
            src={src}
            title={content?.contentTitle || content?.title || "Quiz"}
            className="ln-roadmap-embedded-view__frame"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: "100%", height: "min(calc(100dvh - 180px), 720px)", minHeight: "min(680px, calc(100dvh - 180px))", border: 0, borderRadius: 12, display: "block" }}
          />
        ) : null}
      </Modal>
    </>
  );
}
