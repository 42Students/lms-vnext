import React from "react";
import { Popover } from "antd";
import { ExclamationCircleFilled, RightOutlined, SafetyCertificateFilled } from "@ant-design/icons";

// Same tinted-initials avatar language used across the quiz submissions modal, quiz preview and
// contacts page this session (viewSubmissionsModal.jsx, quizpanel.js, contacts) -- kept duplicated
// per-file rather than extracted into a shared util, matching this codebase's established (and
// deliberate) convention for this exact pattern.
const AVATAR_TINTS = [
  { bg: "#e0f2f1", fg: "#0f766e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dcfce7", fg: "#166534" },
];

function studentInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function avatarTint(seed) {
  const key = String(seed ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

// The severity score (computeAtRiskStudents in useFacultyCourseStats.js) is a raw accumulator
// (2-3 points per risk signal, one or more signals per student) rather than a bounded scale --
// this just needs a line to sort "worth a same-day look" from "worth keeping an eye on", not a
// precise number. 5+ means at least one severe signal (or two moderate ones stacked).
const CRITICAL_SEVERITY_THRESHOLD = 5;

// Today's two signals (attendance, missing submissions) cap out at 3 points each -- 6 total --
// so that's the denominator for turning the raw accumulator into a percentage a faculty member
// can actually read at a glance. Capped at 100 so a future third signal stacking on top never
// renders a nonsensical >100%.
const MAX_SEVERITY = 6;
function riskPercent(severity) {
  return Math.min(100, Math.round(((severity ?? 0) / MAX_SEVERITY) * 100));
}

/**
 * Faculty course-home card: which students need attention right now, and why -- not just a count.
 * Data comes from useFacultyCourseStats().atRiskStudents (already named, reasoned and sorted).
 * `studentAverages` (from the sibling performanceStats hook output) is optional -- when a
 * student has no graded work yet, the snapshot below just omits that line instead of a fake 0%.
 */
const AtRiskStudentsCard = ({ students = [], loading = false, onViewAll, studentAverages = [] }) => {
  const critical = students.filter((s) => (s.severity ?? 0) >= CRITICAL_SEVERITY_THRESHOLD);
  const moderate = students.length - critical.length;
  const visible = students.slice(0, 5);
  const hasMore = students.length > visible.length;

  return (
    <section className="ln-module-card learn-placements-section-card learn-risk-card" aria-label="At-risk students">
      <div className="learn-risk-card__head">
        <div className="learn-risk-card__heading">
          <span className={`learn-risk-card__icon${students.length ? " learn-risk-card__icon--warning" : ""}`}>
            {students.length ? <ExclamationCircleFilled /> : <SafetyCertificateFilled />}
          </span>
          <div>
            <h3 className="learn-risk-card__title">At-risk Students</h3>
            <p className="learn-risk-card__subtitle">
              {loading
                ? "Checking attendance and submissions…"
                : students.length === 0
                  ? "No major learner risk signals"
                  : "Needs attendance or submission follow-up"}
            </p>
          </div>
        </div>
        {!loading && students.length > 0 && (
          <div className="learn-risk-card__breakdown" role="status">
            {critical.length > 0 && (
              <span className="learn-risk-card__chip learn-risk-card__chip--critical">{critical.length} critical</span>
            )}
            {moderate > 0 && (
              <span className="learn-risk-card__chip learn-risk-card__chip--moderate">{moderate} moderate</span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="learn-risk-card__skeleton" aria-hidden="true">
          {[0, 1, 2].map((i) => <span key={i} className="learn-risk-card__skeleton-row" />)}
        </div>
      ) : students.length === 0 ? (
        <p className="learn-risk-card__empty">Every student is tracking well on attendance and submissions.</p>
      ) : (
        <>
          <ul className="learn-risk-card__list">
            {visible.map((student) => {
              const tint = avatarTint(student.studentId ?? student.name);
              const isCritical = (student.severity ?? 0) >= CRITICAL_SEVERITY_THRESHOLD;
              const pct = riskPercent(student.severity);
              const average = studentAverages.find((s) => s.studentId === student.studentId);
              const snapshot = (
                <div className="learn-risk-snapshot" role="none">
                  <div className="learn-risk-snapshot__head">
                    <span
                      className="learn-risk-snapshot__avatar"
                      style={{ background: tint.bg, color: tint.fg }}
                      aria-hidden="true"
                    >
                      {studentInitials(student.name)}
                    </span>
                    <span className="learn-risk-snapshot__name">{student.name}</span>
                    <span
                      className={`learn-risk-snapshot__risk-pill${isCritical ? " learn-risk-snapshot__risk-pill--critical" : ""}`}
                    >
                      {pct}% risk
                    </span>
                  </div>
                  <div className="learn-risk-snapshot__stats">
                    {student.attendancePercent != null && (
                      <div className="learn-risk-snapshot__stat">
                        <span className="learn-risk-snapshot__stat-label">Attendance</span>
                        <span className="learn-risk-snapshot__stat-track">
                          <span
                            className={`learn-risk-snapshot__stat-fill${student.attendancePercent < 50 ? " learn-risk-snapshot__stat-fill--poor" : " learn-risk-snapshot__stat-fill--fair"}`}
                            style={{ width: `${Math.max(4, student.attendancePercent)}%` }}
                          />
                        </span>
                        <span className="learn-risk-snapshot__stat-value">{student.attendancePercent}%</span>
                      </div>
                    )}
                    {student.missingCount > 0 && (
                      <div className="learn-risk-snapshot__stat learn-risk-snapshot__stat--plain">
                        <span className="learn-risk-snapshot__stat-label">Submissions missing</span>
                        <span className="learn-risk-snapshot__stat-value">{student.missingCount}</span>
                      </div>
                    )}
                    {average && (
                      <div className="learn-risk-snapshot__stat">
                        <span className="learn-risk-snapshot__stat-label">Average grade</span>
                        <span className="learn-risk-snapshot__stat-track">
                          <span
                            className={`learn-risk-snapshot__stat-fill${average.avgPercent < 60 ? " learn-risk-snapshot__stat-fill--poor" : " learn-risk-snapshot__stat-fill--good"}`}
                            style={{ width: `${Math.max(4, average.avgPercent)}%` }}
                          />
                        </span>
                        <span className="learn-risk-snapshot__stat-value">{average.avgPercent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={student.studentId} className="learn-risk-card__row-wrap">
                  <Popover content={snapshot} trigger="click" placement="bottomLeft" overlayClassName="learn-risk-snapshot-popover">
                    <button type="button" className="learn-risk-card__row" aria-haspopup="dialog">
                      <span
                        className="learn-risk-card__avatar"
                        style={{ background: tint.bg, color: tint.fg }}
                        aria-hidden="true"
                      >
                        {studentInitials(student.name)}
                      </span>
                      <span className="learn-risk-card__name">{student.name}</span>
                      <span className="learn-risk-card__reasons">
                        {(student.reasons ?? []).map((reason) => (
                          <span
                            key={reason}
                            className={`learn-risk-card__reason${isCritical ? " learn-risk-card__reason--critical" : ""}`}
                          >
                            {reason}
                          </span>
                        ))}
                      </span>
                    </button>
                  </Popover>
                </li>
              );
            })}
          </ul>
          <button type="button" className="learn-risk-card__cta" onClick={onViewAll}>
            {hasMore ? `View all ${students.length} students` : "View students"}
            <RightOutlined />
          </button>
        </>
      )}
    </section>
  );
};

export default React.memo(AtRiskStudentsCard);
