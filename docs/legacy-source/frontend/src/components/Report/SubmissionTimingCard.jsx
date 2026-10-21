import React from "react";
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons";

/**
 * The assignment report's equivalent of the quiz report's question-accuracy section -- there's no
 * sub-question breakdown for a free-form assignment, so the comparable "where's the friction"
 * insight is deadline behavior: how many submitted on time vs. late, and who enrolled hasn't
 * submitted at all (which a plain submissions list can't show, since it only lists who DID).
 */
const SubmissionTimingCard = ({ onTimeCount, lateCount, notSubmitted = [] }) => {
  const safeOnTime = Math.max(0, Number(onTimeCount) || 0);
  const safeLate = Math.max(0, Number(lateCount) || 0);
  const safeMissing = Array.isArray(notSubmitted)
    ? notSubmitted.filter((student) => student && typeof student === "object")
    : [];
  const total = safeOnTime + safeLate;

  return (
    <div className="ln-submission-timing">
      <div className="ln-submission-timing__split">
        <div className="ln-submission-timing__stat ln-submission-timing__stat--on-time">
          <CheckCircleFilled aria-hidden />
          <div>
            <strong>{safeOnTime}</strong>
            <span>On time</span>
          </div>
        </div>
        <div className="ln-submission-timing__stat ln-submission-timing__stat--late">
          <ClockCircleFilled aria-hidden />
          <div>
            <strong>{safeLate}</strong>
            <span>Late</span>
          </div>
        </div>
      </div>
      {total === 0 ? (
        <p className="ln-submission-timing__empty" role="status">No submitted assignments to chart yet.</p>
      ) : (
        <div className="ln-submission-timing__bar" role="img" aria-label={`${safeOnTime} on time, ${safeLate} late`}>
          <span className="ln-submission-timing__bar-segment ln-submission-timing__bar-segment--on-time" style={{ width: `${Math.round((safeOnTime / total) * 100)}%` }} />
          <span className="ln-submission-timing__bar-segment ln-submission-timing__bar-segment--late" style={{ width: `${Math.round((safeLate / total) * 100)}%` }} />
        </div>
      )}

      {safeMissing.length > 0 && (
        <div className="ln-submission-timing__missing">
          <h4>Hasn&apos;t submitted ({safeMissing.length})</h4>
          <ul>
            {safeMissing.map((student, index) => (
              <li key={student.id ?? index}>{student.name || "Unnamed student"}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(SubmissionTimingCard);
