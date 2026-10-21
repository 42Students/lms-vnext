import dayjs from "dayjs";
import { buildScoreDistribution } from "./scoreDistribution";

function studentName(sub) {
  const first = sub?.studentFirstName ?? sub?.student_first_name ?? sub?.firstName ?? "";
  const last = sub?.studentLastName ?? sub?.student_last_name ?? sub?.lastName ?? "";
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || (sub?.studentId != null ? `Student ${sub.studentId}` : "Unknown student");
}

function rosterStudentId(entry) {
  const id = entry?.learnerId ?? entry?.id;
  return id != null ? Number(id) : null;
}

function rosterStudentName(entry) {
  const first = entry?.firstName ?? entry?.first_name ?? "";
  const last = entry?.lastName ?? entry?.last_name ?? "";
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || entry?.contactMail || entry?.email || (rosterStudentId(entry) != null ? `Student ${rosterStudentId(entry)}` : "Unknown student");
}

// Same graded check viewSubmissionsModal.jsx already uses (isSubmissionGraded) -- kept in sync
// rather than imported, since that file's version is scoped to its own local state shape.
function isGraded(sub) {
  const points = sub?.pointsObtained;
  return sub?.graded === 1 || (points != null && points !== "" && Number(points) >= 0);
}

/**
 * Builds a per-assignment report from data the existing "View Submissions" flow already fetches
 * -- getLessonContentById(contentId) for the assignment's own metadata (due date, points), and
 * getAssignmentSubmissions({ lessonContentId, classId }) for every submission. `roster`
 * (getLearnersByClass(classId)) is what makes completion rate and the "hasn't submitted" list
 * possible -- the submissions list alone only tells you who DID submit.
 */
export function buildAssignmentReport({ assignment, submissions, roster } = {}) {
  const contentData = assignment?.contentDataDTO ?? assignment?.content_data_dto ?? {};
  const dueDate = contentData?.due_date ?? contentData?.dueDate ?? null;
  const dueDateMs = dueDate ? new Date(dueDate).getTime() : null;
  const defaultPoints = Number(contentData?.points ?? contentData?.totalPoints ?? 0) || 0;

  const rosterList = Array.isArray(roster) ? roster : [];

  // A student can end up with more than one submission row (resubmission); keep the most recent.
  const byStudent = new Map();
  for (const sub of submissions ?? []) {
    const id = sub?.studentId ?? sub?.student_id;
    if (id == null) continue;
    const existing = byStudent.get(id);
    const subTime = new Date(sub?.updatedAt ?? sub?.createdAt ?? 0).getTime();
    const existingTime = existing ? new Date(existing?.updatedAt ?? existing?.createdAt ?? 0).getTime() : -1;
    if (!existing || subTime >= existingTime) byStudent.set(id, sub);
  }
  const uniqueSubmissions = Array.from(byStudent.values());

  const students = uniqueSubmissions
    .map((sub) => {
      const maxScore = Number(sub?.points) || defaultPoints;
      const graded = isGraded(sub);
      // isGraded() treats an explicit graded===1 as sufficient on its own (matching
      // viewSubmissionsModal.jsx's isSubmissionGraded), so pointsObtained isn't guaranteed to have
      // been validated as numeric by the time this runs -- Number(undefined) is NaN, and an
      // ungraded-looking NaN percent would silently corrupt the average and the distribution.
      const obtained = Number(sub?.pointsObtained);
      const percent = graded && maxScore > 0 && Number.isFinite(obtained)
        ? Math.min(100, Math.round((obtained / maxScore) * 100))
        : null;
      const submittedAt = sub?.createdAt ?? null;
      const isLate = dueDateMs != null && submittedAt ? new Date(submittedAt).getTime() > dueDateMs : false;
      return {
        // Normalized to Number -- studentId arrives as either a number or a numeric string
        // depending on the endpoint (seen elsewhere in this codebase, e.g.
        // computeAtRiskStudents in useFacultyCourseStats.js), while the roster's own id is always
        // Number()-cast via rosterStudentId(). A raw string id here would make the
        // "already submitted" Set lookup below fail on type alone, wrongly listing a submitted
        // student as missing.
        id: sub?.studentId != null ? Number(sub.studentId) : null,
        name: studentName(sub),
        score: percent != null ? obtained : null,
        maxScore,
        percent,
        graded,
        submittedAt,
        isLate,
      };
    })
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

  const scored = students.filter((s) => s.percent != null);
  const avgPercent = scored.length > 0
    ? Math.round(scored.reduce((sum, s) => sum + s.percent, 0) / scored.length)
    : null;

  const submittedIds = new Set(students.map((s) => s.id));
  const notSubmitted = rosterList
    .filter((entry) => !submittedIds.has(rosterStudentId(entry)))
    .map((entry) => ({ id: rosterStudentId(entry), name: rosterStudentName(entry) }));

  return {
    title: assignment?.contentTitle ?? assignment?.content_title ?? "Untitled assignment",
    dueDate,
    totalPoints: defaultPoints,
    rosterSize: rosterList.length || null,
    submittedCount: students.length,
    completionPercent: rosterList.length ? Math.round((students.length / rosterList.length) * 100) : null,
    gradedCount: students.filter((s) => s.graded).length,
    avgPercent,
    distribution: buildScoreDistribution(scored.map((s) => s.percent)),
    onTimeCount: students.filter((s) => !s.isLate).length,
    lateCount: students.filter((s) => s.isLate).length,
    notSubmitted,
    students,
    generatedAt: dayjs().format("MMM D, YYYY [at] h:mm A"),
  };
}
