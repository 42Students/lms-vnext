import React, { useMemo, useState } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

// Same tinted-initials avatar language as viewSubmissionsModal.jsx, AtRiskStudentsCard.jsx, etc.
// -- duplicated per-file rather than extracted into a shared util, matching this codebase's
// established (and deliberate) convention for this exact pattern.
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

/**
 * The per-student rows on a quiz/assignment report. Students arrive pre-sorted (best score
 * first, from the report builder); this only adds a name filter for larger classes, and lets the
 * caller supply a type-specific trailing cell (submitted time for quizzes; graded + on-time/late
 * for assignments) via `renderExtra` rather than hardcoding either shape here.
 */
const ReportStudentTable = ({ students = [], extraColumnLabel, renderExtra, emptyMessage = "No students yet." }) => {
  const [query, setQuery] = useState("");
  const safeStudents = useMemo(
    () => (Array.isArray(students) ? students.filter((student) => student && typeof student === "object") : []),
    [students]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeStudents;
    return safeStudents.filter((s) => String(s.name || "").toLowerCase().includes(q));
  }, [safeStudents, query]);

  if (safeStudents.length === 0) {
    return <p className="ln-report-table__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ln-report-table">
      {safeStudents.length > 8 && (
        <Input
          className="ln-report-table__search"
          prefix={<SearchOutlined aria-hidden />}
          placeholder="Search students…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
        />
      )}
      <div className="ln-report-table__head" role="row">
        <span>Student</span>
        <span>Score</span>
        {extraColumnLabel && <span>{extraColumnLabel}</span>}
      </div>
      <ul className="ln-report-table__list">
        {filtered.map((student) => {
          const tint = avatarTint(student.id ?? student.name);
          return (
            <li key={student.id ?? student.name ?? `student-${filtered.indexOf(student)}`} className="ln-report-table__row">
              <span className="ln-report-table__student">
                <span className="ln-report-table__avatar" style={{ background: tint.bg, color: tint.fg }} aria-hidden="true">
                  {studentInitials(student.name)}
                </span>
                <span className="ln-report-table__name">{student.name || "Unnamed student"}</span>
              </span>
              <span className="ln-report-table__score">
                {student.percent != null ? (
                  <>
                    <strong className={student.percent < 60 ? "ln-report-table__score-value--low" : ""}>
                      {student.percent}%
                    </strong>
                    <small>{student.score}/{student.maxScore}</small>
                  </>
                ) : (
                  <span className="ln-report-table__no-score">—</span>
                )}
              </span>
              {renderExtra && <span className="ln-report-table__extra">{renderExtra(student)}</span>}
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="ln-report-table__empty">No students match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
};

export default React.memo(ReportStudentTable);
