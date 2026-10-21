import { useState, useEffect, useCallback, useRef } from "react";
import { getLessonList, getAssignmentSubmissions } from "@/api/Services/courseServices";
import { getStudentAttendanceByDaterange } from "@/api/Services/attendanceServices";
import { getLearnersByClass } from "@/api/Services/AdminService";
import moment from "moment";

const ATTENDANCE_DAYS_BACK = 60;

/**
 * Aggregates faculty-specific course stats: submissions, attendance, grading, student list.
 * Uses only existing API endpoints — no backend changes required.
 *
 * @param {{ courseSlug?: string, courseId?: number, classId?: number, facultyId?: number, enabled?: boolean }}
 */
export function useFacultyCourseStats({ courseSlug, courseId, classId, facultyId, enabled = true }) {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsRosterReliable, setStudentsRosterReliable] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [submissionStats, setSubmissionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceErrors, setSourceErrors] = useState({
    lessons: false,
    students: false,
    attendance: false,
    submissions: false,
  });
  const abortRef = useRef(null);

  const hasCourse = !!(courseSlug || courseId);
  const hasClass = !!classId;
  const canFetch = enabled && hasCourse && hasClass;

  const fetchAll = useCallback(async () => {
    if (!canFetch) {
      setStudentsRosterReliable(false);
      setLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);
    setSourceErrors({ lessons: false, students: false, attendance: false, submissions: false });

    try {
      const courseParams = courseSlug ? { courseSlug, classId } : { courseId, classId };

      // Parallel fetch: lessons, students, attendance
      const [lessonsRes, studentsRes, attendanceRes] = await Promise.allSettled([
        getLessonList(courseParams),
        getLearnersByClass(classId),
        facultyId ? getStudentAttendanceByDaterange({
          classId,
          ...(courseSlug ? { courseSlug } : { courseId }),
          facultyId,
          startDate: moment().subtract(ATTENDANCE_DAYS_BACK, "days").format("YYYY-MM-DD"),
          endDate: moment().format("YYYY-MM-DD"),
        }) : Promise.resolve(null),
      ]);

      if (signal.aborted) return;

      const lessonsReliable = lessonsRes.status === "fulfilled";
      const studentsReliable = studentsRes.status === "fulfilled";
      const attendanceReliable = attendanceRes.status === "fulfilled";

      // Process lessons. A rejected request is unknown course state, not an empty course.
      const lessonData = lessonsReliable
        ? (Array.isArray(lessonsRes.value?.data?.data) ? lessonsRes.value.data.data
            : Array.isArray(lessonsRes.value?.data) ? lessonsRes.value.data
            : [])
        : [];
      setLessons(lessonData);

      // Process students
      const studentsLoaded = studentsReliable;
      const studentData = studentsLoaded
        ? (Array.isArray(studentsRes.value?.data?.data) ? studentsRes.value.data.data
            : Array.isArray(studentsRes.value?.data) ? studentsRes.value.data
            : [])
        : [];
      setStudents(studentData);
      setStudentsRosterReliable(studentsLoaded && Array.isArray(studentData) && studentData.length > 0);

      // Process attendance
      const attData = attendanceReliable
        ? (attendanceRes.value?.data?.data ?? attendanceRes.value?.data ?? attendanceRes.value)
        : null;
      setAttendance(attData);

      // Now fetch submission stats for each assignment/quiz content
      if (signal.aborted) return;
      const assignmentContents = extractAssignmentContents(lessonData);
      let submissionsReliable = lessonsReliable;
      if (!lessonsReliable) {
        setSubmissionStats(null);
      } else if (assignmentContents.length > 0 && !signal.aborted) {
        const subResults = await fetchSubmissionStatsForContents(assignmentContents, classId, signal);
        if (!signal.aborted) {
          setSubmissionStats(subResults);
          submissionsReliable = subResults?.reliable !== false;
        }
      } else {
        setSubmissionStats({
          totalSubmitted: 0,
          totalGraded: 0,
          notGraded: 0,
          contents: [],
          reliable: true,
          failedContents: [],
        });
      }

      setSourceErrors({
        lessons: !lessonsReliable,
        students: !studentsReliable,
        attendance: !attendanceReliable,
        submissions: !submissionsReliable,
      });
    } catch (err) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      setError(err);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [courseSlug, courseId, classId, facultyId, canFetch]);

  useEffect(() => {
    fetchAll();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchAll]);

  // Derived stats
  const contentItems = extractAllContentItems(lessons);
  const assignmentContents = extractAssignmentContents(lessons);
  const attendanceStats = computeAttendanceStats(attendance, students.length, studentsRosterReliable);
  const performanceStats = computePerformanceStats(submissionStats, students);
  const atRiskStudents = computeAtRiskStudents(submissionStats, attendanceStats, students);
  const contentProgress = computeContentProgress(lessons);

  return {
    lessons,
    students,
    attendance,
    attendanceStats,
    submissionStats,
    performanceStats,
    atRiskStudents,
    contentProgress,
    contentItems,
    assignmentContents,
    loading,
    error,
    sourceErrors,
    refetch: fetchAll,
    // Reliability is part of the value. Callers must not turn an unknown metric into zero.
    lessonsReliable: !sourceErrors.lessons,
    studentsReliable: !sourceErrors.students,
    attendanceReliable: !sourceErrors.attendance,
    submissionsReliable: !sourceErrors.lessons && !sourceErrors.submissions,
    studentCount: sourceErrors.students ? null : students.length,
    lessonCount: sourceErrors.lessons ? null : lessons.length,
    contentItemCount: sourceErrors.lessons ? null : contentItems.length,
    pendingToGrade: (!sourceErrors.lessons && !sourceErrors.submissions)
      ? (submissionStats?.notGraded ?? 0)
      : null,
    avgAttendance: sourceErrors.attendance || sourceErrors.students ? null : attendanceStats.avgPercent,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractAllContentItems(lessons) {
  const items = [];
  for (const lesson of lessons) {
    const contents = lesson?.lessonContents ?? lesson?.lesson_contents ?? lesson?.contents ?? [];
    if (!Array.isArray(contents)) continue;
    for (const c of contents) {
      if (c) items.push({ ...c, lessonName: lesson?.lesson?.lessonName ?? lesson?.lesson?.lesson_name ?? "Lesson" });
    }
  }
  return items;
}

function extractAssignmentContents(lessons) {
  const items = [];
  const seenIds = new Set();
  for (const lesson of lessons) {
    const contents = lesson?.lessonContents ?? lesson?.lesson_contents ?? lesson?.contents ?? [];
    if (!Array.isArray(contents)) continue;
    for (const c of contents) {
      const type = String(c?.contentType ?? c?.content_type ?? "").toLowerCase();
      const status = String(c?.status ?? c?.contentStatus ?? "").toUpperCase();
      // Quizzes live entirely in the separate V2 quiz system now (quizzes/quiz_attempts tables,
      // auto-graded) — a LessonContents row can no longer have content_type='quiz' at all (the
      // backend hard-blocks creating one), so the "quiz" branch this used to check was dead.
      // Grading review only applies to assignments now.
      if (type === "assignment" && status !== "DRAFT") {
        const id = c?.id ?? c?.lessonContentId;
        if (id != null && seenIds.has(id)) continue; // skip duplicates
        if (id != null) seenIds.add(id);
        const contentData = c?.contentDataDTO ?? c?.content_data_dto ?? c?.contentData ?? c?.content_data ?? {};
        items.push({
          id,
          title: c?.contentTitle ?? c?.content_title ?? "Untitled",
          type,
          lessonId: lesson?.lesson?.id ?? lesson?.lesson?.lessonId ?? lesson?.lesson?.lesson_id ?? null,
          lessonName: lesson?.lesson?.lessonName ?? lesson?.lesson?.lesson_name ?? "Lesson",
          dueDate: contentData?.due_date ?? contentData?.dueDate ?? null,
          points: contentData?.points ?? contentData?.totalPoints ?? null,
        });
      }
    }
  }
  return items;
}

const CONCURRENCY_LIMIT = 4;

async function fetchSubmissionStatsForContents(contents, classId, signal) {
  // Fetch in batches with concurrency limit to avoid overwhelming the server
  const results = new Array(contents.length).fill(null);

  for (let start = 0; start < contents.length; start += CONCURRENCY_LIMIT) {
    if (signal?.aborted) return null;
    const batch = contents.slice(start, start + CONCURRENCY_LIMIT);
    const batchResults = await Promise.allSettled(
      batch.map(c =>
        getAssignmentSubmissions({ lessonContentId: c.id, classId, signal, all: true })
      )
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[start + j] = batchResults[j];
    }
  }

  if (signal?.aborted) return null;

  let totalSubmitted = 0;
  let totalGraded = 0;
  let notGraded = 0;
  const contentStats = [];
  const failedContents = [];

  for (let i = 0; i < contents.length; i++) {
    const c = contents[i];
    const res = results[i];
    let submissions = [];
    if (res?.status === "fulfilled") {
      const raw = res.value?.data ?? res.value;
      // Response shape: { status, message, data: [...] } or direct array
      submissions = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (raw?.content ?? []));
    } else {
      failedContents.push({ id: c.id, title: c.title });
    }

    // Deduplicate submissions per student — keep latest submission only
    // StudentAssignment uses studentId (int), fallback to learnerId for compat
    const byStudent = new Map();
    for (const sub of submissions) {
      const sid = sub?.studentId ?? sub?.student_id ?? sub?.learnerId ?? sub?.learner_id;
      if (!sid) continue;
      const existing = byStudent.get(sid);
      if (!existing || new Date(sub?.updatedAt ?? sub?.createdAt ?? 0) > new Date(existing?.updatedAt ?? existing?.createdAt ?? 0)) {
        byStudent.set(sid, sub);
      }
    }
    const uniqueSubmissions = Array.from(byStudent.values());

    const submitted = uniqueSubmissions.length;
    const graded = uniqueSubmissions.filter(s => isGraded(s)).length;
    const ungraded = submitted - graded;

    totalSubmitted += submitted;
    totalGraded += graded;
    notGraded += ungraded;

    // Store only lightweight per-student grade data, not full submission objects
    const studentGrades = uniqueSubmissions.map(s => ({
      learnerId: s?.studentId ?? s?.student_id ?? s?.learnerId ?? s?.learner_id,
      grade: getNumericGrade(s),
      totalMarks: getTotalMarks(s, c.points),
    }));

    contentStats.push({
      ...c,
      submitted,
      graded,
      ungraded,
      studentGrades,
    });
  }

  return {
    totalSubmitted,
    totalGraded,
    notGraded,
    contents: contentStats,
    reliable: failedContents.length === 0,
    failedContents,
  };
}

/**
 * Check if a submission has been graded.
 * StudentAssignment entity has: graded (0|1), pointsObtained, points.
 * Fallback field names for forward-compat: grade, marks, score.
 */
function isGraded(s) {
  // Prefer the explicit graded flag (0 = ungraded, 1 = graded)
  if (s?.graded === 1) return true;
  if (s?.graded === 0) return false;
  // Fallback: check if any grade-like field has a valid value
  const grade = s?.pointsObtained ?? s?.points_obtained ?? s?.grade ?? s?.marks ?? s?.score;
  if (grade == null || grade === "" || grade === -1) return false;
  const num = Number(grade);
  return !isNaN(num);
}

/**
 * Safely extract numeric grade value — returns null if not graded.
 * Primary field: pointsObtained (from StudentAssignment entity).
 */
function getNumericGrade(s) {
  if (s?.graded === 0) return null;
  const grade = s?.pointsObtained ?? s?.points_obtained ?? s?.grade ?? s?.marks ?? s?.score;
  if (grade == null || grade === "" || grade === -1) return null;
  const num = Number(grade);
  return isNaN(num) ? null : num;
}

/**
 * Extract total marks for a submission.
 * Primary field: points (from StudentAssignment entity).
 */
function getTotalMarks(s, fallback) {
  const total = s?.points ?? s?.totalMarks ?? s?.total_marks;
  if (total != null && total !== "" && Number(total) > 0) return Number(total);
  return fallback || 100;
}

function computeAttendanceStats(attendanceData, studentCount, rosterReliable) {
  const empty = {
    sessions: [],
    avgPercent: null,
    lastSessionPercent: null,
    lowestPercent: null,
    totalSessions: 0,
    lowAttendanceStudents: [],
    rosterReliable: !!rosterReliable,
  };
  if (!attendanceData) return empty;

  // API response shape: { classes: { "01": [{ startTime, Id, endTime, title }], ... }, absentees: [{ studentId, studentName, absent: [scheduleId, ...] }] }
  const classesMap = attendanceData?.classes ?? {};
  const absenteesList = Array.isArray(attendanceData?.absentees) ? attendanceData.absentees : [];

  // Flatten all sessions from the classes map
  const allSchedules = [];
  for (const daySchedules of Object.values(classesMap)) {
    if (Array.isArray(daySchedules)) {
      for (const s of daySchedules) {
        if (s && (s.startTime || s.Id)) {
          allSchedules.push(s);
        }
      }
    }
  }

  if (allSchedules.length === 0) return empty;

  // Build a reverse lookup: scheduleId → set of absent student IDs
  const absentBySchedule = {};
  for (const learner of absenteesList) {
    const sid = learner?.studentId;
    const absentSchedules = Array.isArray(learner?.absent) ? learner.absent : [];
    for (const schedId of absentSchedules) {
      if (!absentBySchedule[schedId]) absentBySchedule[schedId] = [];
      absentBySchedule[schedId].push(sid);
    }
  }

  const totalStudents = rosterReliable && Number.isFinite(studentCount) && studentCount > 0 ? studentCount : null;

  const parsed = allSchedules
    .map(s => {
      const scheduleId = s.Id ?? s.id;
      const absentIds = absentBySchedule[scheduleId] ?? [];
      const absentCount = absentIds.length;
      const present = totalStudents != null ? Math.max(0, totalStudents - absentCount) : null;
      const percent = totalStudents != null && totalStudents > 0 ? Math.round((present / totalStudents) * 100) : null;
      const date = s.startTime;
      return {
        id: scheduleId,
        date,
        dateLabel: date ? moment(date, "YYYY-MM-DD HH:mm:ss").format("MMM D") : "—",
        totalStudents,
        present,
        absent: absentCount,
        absentIds,
        percent,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const percentages = parsed.map(s => s.percent).filter((p) => p != null);
  const avg = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : null;
  const lowest = percentages.length > 0 ? Math.min(...percentages) : null;
  const last = parsed.length > 0 ? parsed[0].percent ?? null : null;

  // Find students absent in more than 25% of sessions
  const absentCounts = {};
  for (const learner of absenteesList) {
    const sid = learner?.studentId;
    const count = Array.isArray(learner?.absent) ? learner.absent.length : 0;
    if (sid && count > 0) absentCounts[sid] = count;
  }
  const threshold = parsed.length * 0.25;
  const lowAttendanceStudents = Object.entries(absentCounts)
    .filter(([, count]) => count > threshold)
    .map(([studentId, absentCount]) => ({
      studentId: Number(studentId),
      name: absenteesList.find(a => String(a?.studentId) === studentId)?.studentName ?? null,
      absentCount,
      attendancePercent: Math.round(((parsed.length - absentCount) / parsed.length) * 100),
    }))
    .sort((a, b) => a.attendancePercent - b.attendancePercent);

  return {
    sessions: parsed.slice(0, 8),
    avgPercent: avg,
    lastSessionPercent: last,
    lowestPercent: lowest,
    totalSessions: parsed.length,
    lowAttendanceStudents,
    rosterReliable: totalStudents != null,
  };
}

function computePerformanceStats(submissionStats, students) {
  if (!submissionStats?.contents?.length) {
    return { distribution: [], avgPercent: null, contentAverages: [] };
  }

  // Compute per-student average from all graded submissions
  const studentScores = {};
  for (const content of submissionStats.contents) {
    for (const sg of (content.studentGrades || [])) {
      const studentId = sg.learnerId;
      if (!studentId || sg.grade == null) continue;
      const total = sg.totalMarks;
      if (!total || total <= 0) continue;
      const percent = Math.min(100, Math.round((sg.grade / total) * 100));
      if (!studentScores[studentId]) studentScores[studentId] = [];
      studentScores[studentId].push(percent);
    }
  }

  // Compute average for each student, enriched with name from students list
  const studentAverages = Object.entries(studentScores).map(([id, scores]) => {
    const sid = Number(id);
    const s = students.find(st => Number(st.learnerId ?? st.id) === sid);
    const name = s
      ? [s.firstName ?? s.first_name, s.lastName ?? s.last_name].filter(Boolean).join(" ") || s.contactMail || `Student ${sid}`
      : `Student ${sid}`;
    return {
      studentId: sid,
      name,
      avgPercent: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    };
  });

  // Grade distribution buckets
  const buckets = [
    { label: "90-100%", min: 90, max: 100, count: 0 },
    { label: "80-89%", min: 80, max: 89, count: 0 },
    { label: "70-79%", min: 70, max: 79, count: 0 },
    { label: "60-69%", min: 60, max: 69, count: 0 },
    { label: "Below 60%", min: 0, max: 59, count: 0 },
  ];
  for (const s of studentAverages) {
    const bucket = buckets.find(b => s.avgPercent >= b.min && s.avgPercent <= b.max);
    if (bucket) bucket.count++;
  }

  const overallAvg = studentAverages.length > 0
    ? Math.round(studentAverages.reduce((a, b) => a + b.avgPercent, 0) / studentAverages.length)
    : null;

  // Per-content averages — use each student's own totalMarks for accurate percentage
  const contentAverages = submissionStats.contents.map(c => {
    const graded = (c.studentGrades || []).filter(sg => sg.grade != null);
    const avg = graded.length > 0
      ? Math.round(graded.reduce((sum, sg) => {
          const total = sg.totalMarks || 100;
          return sum + (sg.grade / total) * 100;
        }, 0) / graded.length)
      : null;
    return { id: c.id, title: c.title, type: c.type, avgPercent: avg, gradedCount: graded.length };
  });

  return { distribution: buckets, avgPercent: overallAvg, studentAverages, contentAverages };
}

function computeAtRiskStudents(submissionStats, attendanceStats, students) {
  if (!students.length) return [];

  const risks = new Map();

  const getOrCreate = (student) => {
    // LearnerResponseDTO has learnerId; StudentAssignment has studentId; Learner entity has id
    const id = Number(student.learnerId ?? student.studentId ?? student.id);
    if (!id || isNaN(id)) return null;
    if (!risks.has(id)) {
      const name = [student.firstName ?? student.first_name, student.lastName ?? student.last_name].filter(Boolean).join(" ") || student.contactMail || student.email || `Student ${id}`;
      risks.set(id, { studentId: id, name, reasons: [], severity: 0 });
    }
    return risks.get(id);
  };

  // Low attendance students
  for (const la of (attendanceStats.lowAttendanceStudents || [])) {
    const student = students.find(s => Number(s.learnerId ?? s.id) === la.studentId) || { studentId: la.studentId, firstName: la.name };
    const r = getOrCreate(student);
    if (!r) continue;
    r.reasons.push(`${la.attendancePercent}% attendance`);
    r.severity += la.attendancePercent < 50 ? 3 : 2;
    r.attendancePercent = la.attendancePercent;
  }

  // Students with missing submissions — only count content that's actually past due;
  // an unsubmitted assignment due next week isn't a risk signal, it's just not due yet.
  if (submissionStats?.contents) {
    const now = Date.now();
    const missingCounts = new Map();
    for (const c of submissionStats.contents) {
      // No due date at all is not the same as "already past due" — the condition below only
      // skipped a *future* due date, so an assignment published with no deadline fell through
      // and instantly flagged every non-submitter as at-risk, contradicting this block's own
      // stated intent right above.
      if (!c?.dueDate || new Date(c.dueDate).getTime() > now) continue;
      const submittedIds = new Set(
        (c.studentGrades || []).map(sg => Number(sg.learnerId)).filter(id => id > 0)
      );
      for (const student of students) {
        const sid = Number(student.learnerId ?? student.id);
        if (sid > 0 && !submittedIds.has(sid)) {
          missingCounts.set(sid, (missingCounts.get(sid) || 0) + 1);
        }
      }
    }
    for (const [sid, count] of missingCounts) {
      if (count >= 2) {
        const student = students.find(s => Number(s.learnerId ?? s.id) === sid) || { studentId: sid };
        const r = getOrCreate(student);
        if (!r) continue;
        r.reasons.push(`${count} submissions missing`);
        r.severity += count >= 3 ? 3 : 2;
        r.missingCount = count;
      }
    }
  }

  return Array.from(risks.values())
    .filter(r => r.reasons.length > 0)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 8);
}

function computeContentProgress(lessons) {
  const modules = [];
  let publishedItems = 0;
  let totalItems = 0;

  for (const lesson of lessons) {
    const name = lesson?.lesson?.lessonName ?? lesson?.lesson?.lesson_name ?? "Lesson";
    const contents = lesson?.lessonContents ?? lesson?.lesson_contents ?? lesson?.contents ?? [];
    const items = Array.isArray(contents) ? contents : [];
    const published = items.filter(c => {
      const status = c?.status ?? c?.contentStatus ?? "";
      return status !== "DRAFT" && status !== "draft";
    }).length;
    totalItems += items.length;
    publishedItems += published;
    modules.push({ name, total: items.length, published });
  }

  return { modules, publishedItems, totalItems, lessonCount: lessons.length };
}
