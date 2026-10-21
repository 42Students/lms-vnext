import React from "react";

/**
 * Per-tab loading placeholder.
 *
 * Both course routers previously rendered the same hand-built, Overview-shaped skeleton — a
 * circular avatar plus a three-row paragraph, `min-height: 420px` — for the attendance month
 * grid, the chat column, the student roster and the module tree alike. A skeleton's only job is
 * to reserve the shape that is coming; one that reserves the wrong shape is worse than a spinner
 * because it makes a promise and then breaks it, and every break is a measurable layout shift on
 * a route users open dozens of times a week.
 *
 * Shapes here are sized to each tab's real first-paint geometry.
 */

function Bar({ w = "100%", h = 12, r = 6, style }) {
  return (
    <span
      className="course-skeleton__bar"
      style={{ width: w, height: h, borderRadius: r, ...style }}
      aria-hidden="true"
    />
  );
}

function RosterSkeleton() {
  return (
    <div className="course-skeleton course-skeleton--table">
      <div className="course-skeleton__row course-skeleton__row--head">
        <Bar w="180px" h={11} />
        <Bar w="120px" h={11} />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="course-skeleton__row" key={i}>
          <span className="course-skeleton__avatar" aria-hidden="true" />
          <span className="course-skeleton__stack">
            <Bar w="140px" h={13} />
            <Bar w="80px" h={10} />
          </span>
          <Bar w="110px" h={12} />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="course-skeleton course-skeleton--grid">
      <div className="course-skeleton__row course-skeleton__row--head">
        <Bar w="140px" h={11} />
        <Bar w="200px" h={11} />
      </div>
      {Array.from({ length: 7 }).map((_, row) => (
        <div className="course-skeleton__grid-row" key={row}>
          <Bar w="150px" h={14} />
          <span className="course-skeleton__cells" aria-hidden="true">
            {Array.from({ length: 14 }).map((__, cell) => (
              <span className="course-skeleton__cell" key={cell} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="course-skeleton course-skeleton--chat">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className={`course-skeleton__msg ${i % 2 ? "course-skeleton__msg--alt" : ""}`} key={i}>
          <span className="course-skeleton__avatar" aria-hidden="true" />
          <span className="course-skeleton__stack">
            <Bar w={i % 2 ? "38%" : "52%"} h={11} />
            <Bar w={i % 2 ? "64%" : "78%"} h={13} />
          </span>
        </div>
      ))}
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="course-skeleton course-skeleton--tree">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="course-skeleton__lesson" key={i}>
          <span className="course-skeleton__chip" aria-hidden="true" />
          <span className="course-skeleton__stack">
            <Bar w="46%" h={15} />
            <Bar w="28%" h={11} />
          </span>
        </div>
      ))}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="course-skeleton course-skeleton--overview">
      <div className="course-skeleton__about">
        <Bar w="30%" h={18} />
        <Bar w="92%" h={12} />
        <Bar w="76%" h={12} />
      </div>
      <div className="course-skeleton__cards">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="course-skeleton__card" key={i}>
            <span className="course-skeleton__chip" aria-hidden="true" />
            <Bar w="60%" h={13} />
            <Bar w="80%" h={10} />
            <Bar w="34%" h={26} r={8} />
          </div>
        ))}
      </div>
    </div>
  );
}

// The generic OverviewSkeleton above (about block + a uniform 4-card grid) doesn't resemble what
// a faculty member's Home actually renders (about card, then a full-width "next action" command
// bar, then a 2-column priority-card grid) -- so the instant bootstrapLoading flips to false, the
// whole page's shape jumped under the user, which is what read as "abrupt". This mirrors the real
// layout so the skeleton-to-content swap is a continuation, not a reflow.
function FacultyOverviewSkeleton() {
  return (
    <div className="course-skeleton course-skeleton--overview">
      <div className="course-skeleton__about">
        <Bar w="30%" h={18} />
        <Bar w="92%" h={12} />
        <Bar w="76%" h={12} />
      </div>
      <div className="course-skeleton__command" aria-hidden="true">
        <span className="course-skeleton__stack">
          <Bar w="120px" h={11} />
          <Bar w="220px" h={18} />
          <Bar w="70%" h={12} />
        </span>
        <span className="course-skeleton__cta" />
      </div>
      <div className="course-skeleton__priorities">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="course-skeleton__priority-card" key={i}>
            <span className="course-skeleton__chip" aria-hidden="true" />
            <span className="course-skeleton__stack">
              <Bar w="72%" h={13} />
              <Bar w="50%" h={10} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BY_TAB = {
  students: RosterSkeleton,
  attendanceDetail: GridSkeleton,
  discussions: ChatSkeleton,
  classroom: ChatSkeleton,
  roadmap: TreeSkeleton,
  blueprint: TreeSkeleton,
  lectures: TreeSkeleton,
  resources: TreeSkeleton,
  assessments: TreeSkeleton,
  "live-sessions": TreeSkeleton,
  home: OverviewSkeleton,
};

function CourseTabSkeleton({ tab, isTeacherRole = false }) {
  const Shape = tab === "home" && isTeacherRole ? FacultyOverviewSkeleton : (BY_TAB[tab] ?? OverviewSkeleton);
  return (
    <div className="learn-course-canvas" role="status" aria-live="polite" aria-label="Loading course">
      <div className="scroll-container">
        <div className="ln-module-card">
          <Shape />
        </div>
      </div>
    </div>
  );
}

export default CourseTabSkeleton;
