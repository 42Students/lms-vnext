import React from "react";

function accuracyTone(percent) {
  if (percent == null) return "unanswered";
  if (percent < 50) return "poor";
  if (percent < 75) return "fair";
  return "good";
}

/**
 * The quiz report's standout section: every question with an accuracy bar, worst-answered
 * first (already sorted that way by buildQuizReport) -- the fastest way for a faculty member to
 * see exactly which concept the class collectively missed, not just the overall score.
 */
const QuestionAccuracyList = ({ questions = [] }) => {
  const safeQuestions = (Array.isArray(questions) ? questions : [])
    .filter((question) => question && typeof question === "object")
    .map((question, index) => {
      const rawAccuracy = question.accuracyPercent;
      const accuracyPercent = rawAccuracy == null
        ? null
        : Math.min(100, Math.max(0, Number(rawAccuracy) || 0));
      return {
        ...question,
        id: question.id ?? `question-${index}`,
        prompt: typeof question.prompt === "string" && question.prompt.trim()
          ? question.prompt
          : `Question ${index + 1}`,
        accuracyPercent,
        correctCount: Math.max(0, Number(question.correctCount) || 0),
        answeredCount: Math.max(0, Number(question.answeredCount) || 0),
      };
    });

  if (safeQuestions.length === 0) {
    return <p className="ln-question-accuracy__empty" role="status">This quiz has no questions yet.</p>;
  }

  return (
    <ol className="ln-question-accuracy">
      {safeQuestions.map((q, index) => {
        const tone = accuracyTone(q.accuracyPercent);
        return (
          <li key={q.id} className={`ln-question-accuracy__row ln-question-accuracy__row--${tone}`}>
            <span className="ln-question-accuracy__index">{index + 1}</span>
            <div className="ln-question-accuracy__body">
              <p className="ln-question-accuracy__prompt">{q.prompt}</p>
              <div
                className="ln-question-accuracy__track"
                role="img"
                aria-label={q.accuracyPercent != null
                  ? `${q.prompt}: ${q.accuracyPercent}% correct, ${q.correctCount} of ${q.answeredCount}`
                  : `${q.prompt}: not answered yet`}
              >
                <span
                  className={`ln-question-accuracy__fill ln-question-accuracy__fill--${tone}`}
                  style={{ width: `${q.accuracyPercent ?? 0}%` }}
                />
              </div>
            </div>
            <span className="ln-question-accuracy__value">
              {q.accuracyPercent != null ? (
                <>
                  <strong>{q.accuracyPercent}%</strong>
                  <small>{q.correctCount}/{q.answeredCount} correct</small>
                </>
              ) : (
                <small className="ln-question-accuracy__no-data">Not answered yet</small>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default React.memo(QuestionAccuracyList);
