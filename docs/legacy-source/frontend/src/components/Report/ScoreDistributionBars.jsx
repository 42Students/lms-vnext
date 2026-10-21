import React from "react";
import { Popover } from "antd";

// Shared by PerformanceCard (course-home, averaged across all graded content) and the quiz/
// assignment report pages (scoped to one item) -- same bucket-to-tone mapping, same visual
// language, extracted once three call sites needed it rather than after a third copy existed.
const BUCKET_TONES = {
  "90-100%": "excellent",
  "80-89%": "good",
  "70-79%": "fair",
  "60-69%": "weak",
  "Below 60%": "poor",
};

/**
 * A horizontal, proportional bar per grade bucket. `distribution` is the same shape
 * computePerformanceStats already produces: [{ label, count }, ...] in fixed 90/80/70/60/below
 * order. A bar with a non-zero count is never rendered too thin to see (6% floor) -- a single
 * student shouldn't be visually indistinguishable from zero.
 *
 * `studentsByLabel` is optional (only PerformanceCard passes it) -- when given, a non-empty bar
 * becomes clickable and reveals exactly who's in that bucket, same "don't just show a count"
 * philosophy as the at-risk card's per-student snapshot (#6/#7).
 */
const ScoreDistributionBars = ({ distribution = [], studentsByLabel = null }) => {
  const safeDistribution = (Array.isArray(distribution) ? distribution : [])
    .filter((bucket) => bucket && typeof bucket === "object" && bucket.label != null)
    .map((bucket) => ({ ...bucket, count: Math.max(0, Number(bucket.count) || 0) }));
  const total = safeDistribution.reduce((sum, bucket) => sum + bucket.count, 0);

  if (total === 0) {
    return <p className="ln-score-distribution__empty" role="status">No graded scores to chart yet.</p>;
  }

  return (
    <div className="ln-score-distribution" role="img" aria-label={`Score distribution across ${total} students`}>
      {safeDistribution.map((bucket) => {
        const widthPercent = total > 0 ? Math.max(bucket.count > 0 ? 6 : 0, Math.round((bucket.count / total) * 100)) : 0;
        const row = (
          <div
            className={`ln-score-distribution__row${studentsByLabel && bucket.count > 0 ? " ln-score-distribution__row--clickable" : ""}`}
          >
            <span className="ln-score-distribution__label">{bucket.label}</span>
            <span className="ln-score-distribution__track">
              <span
                className={`ln-score-distribution__fill ln-score-distribution__fill--${BUCKET_TONES[bucket.label]}`}
                style={{ width: `${widthPercent}%` }}
              />
            </span>
            <span className="ln-score-distribution__count">{bucket.count}</span>
          </div>
        );

        const names = studentsByLabel?.[bucket.label];
        if (!names || names.length === 0) return <React.Fragment key={bucket.label}>{row}</React.Fragment>;

        return (
          <Popover
            key={bucket.label}
            trigger="click"
            placement="right"
            overlayClassName="ln-score-distribution-popover"
            content={
              <ul className="ln-score-distribution__names">
                {names.map((s) => (
                  <li key={s.studentId}>
                    <span>{s.name}</span>
                    <span>{s.avgPercent}%</span>
                  </li>
                ))}
              </ul>
            }
            title={`${bucket.label} (${names.length})`}
          >
            <button type="button" className="ln-score-distribution__row-btn" aria-haspopup="dialog">
              {row}
            </button>
          </Popover>
        );
      })}
    </div>
  );
};

export default React.memo(ScoreDistributionBars);
