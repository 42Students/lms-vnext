import React from "react";

/**
 * Lesson-level progress bar for learners.
 * Shows completed/total, progress bar, and motivational message.
 */
export default function LessonProgressBar({ completed, total, nextContentId, onContinueClick }) {
  if (total == null || total <= 0) return null;

  const completedCount = Math.max(0, Math.min(total, completed ?? 0));
  const percent = total > 0 ? Math.round((100 * completedCount) / total) : 0;
  const isComplete = percent >= 100;
  const hasNext = nextContentId != null && nextContentId > 0;

  const getMessage = () => {
    if (isComplete) return "Lesson complete!";
    if (percent >= 75) return "Almost there!";
    if (percent >= 50) return "Keep going!";
    if (percent >= 25) return "Great progress!";
    if (percent > 0) return "You're in motion!";
    return "Your first step awaits";
  };

  return (
    <div className="lesson-progress-bar">
      <div className="lesson-progress-bar__row">
        <span className="lesson-progress-bar__label">
          {completedCount} of {total} complete
        </span>
        {hasNext && !isComplete && (
          <button
            type="button"
            className="lesson-progress-bar__continue"
            onClick={onContinueClick}
          >
            Continue from here →
          </button>
        )}
      </div>
      <div className="lesson-progress-bar__track">
        <div
          className="lesson-progress-bar__fill"
          style={{ transform: `scaleX(${percent / 100})` }}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${completedCount} of ${total} items complete`}
        />
      </div>
      <p className="lesson-progress-bar__message">{getMessage()}</p>
    </div>
  );
}
