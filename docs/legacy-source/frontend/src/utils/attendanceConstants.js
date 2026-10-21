import dayjs from "dayjs";

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 2.6/5.3: minimum attendance percentage required to stay exam-eligible. No backend config for
// this exists yet (see COURSE_UI_AUDIT_FINDINGS.md P0-12) -- a real per-college/per-program
// override needs a backend settings entity and admin UI, genuine feature work, not attempted
// here. Centralized to this one constant so there is exactly one place to change it (or wire it
// to a future backend value) instead of two.
export const ATTENDANCE_THRESHOLD = 75;

// 5.4: a class that hasn't started yet can never appear in a student's `absent` list, so counting
// it toward totalMarks/presentCount silently inflates the percentage (and renders a future
// session as a green "P" before it's even happened). This was implemented twice
// (StudentAttendanceView's `heldClasses` filter and TeacherAttendanceView's `isHeld`), with the
// same rule fixed in both places independently -- exactly the shape where a third consumer would
// miss it. One shared implementation now backs both.
export function isHeldClassSession(cls, now = dayjs()) {
  return !cls?.startTime || !dayjs(cls.startTime).isAfter(now);
}

/**
 * One learner's status for one session (LRN-AT-01): a session that has not happened yet is
 * Scheduled, and a held session nobody took attendance for is Not marked. Neither counts as Present;
 * "not in the absence list" used to mean Present, which inflated attendance with future and
 * never-marked classes. attendanceMarked comes from the API; when it is missing the session counts
 * as marked (older responses).
 */
export function learnerSessionStatus(cls, absentIds = [], now = dayjs()) {
  if (!isHeldClassSession(cls, now)) return { key: "scheduled", label: "Scheduled", statusClass: "neutral" };
  if ((absentIds || []).includes(cls?.classScheduleId)) return { key: "absent", label: "Absent", statusClass: "absent" };
  if (cls?.attendanceMarked === false) return { key: "unmarked", label: "Not marked", statusClass: "neutral" };
  return { key: "present", label: "Present", statusClass: "present" };
}

/** Present / absent counts over the sessions that were actually marked. */
export function learnerAttendanceTally(classes = [], absentIds = [], now = dayjs()) {
  let present = 0;
  let absent = 0;
  (classes || []).forEach((cls) => {
    const { key } = learnerSessionStatus(cls, absentIds, now);
    if (key === "present") present += 1;
    if (key === "absent") absent += 1;
  });
  return { present, absent, counted: present + absent };
}


/**
 * How many more classes a learner can miss and stay at or above `thresholdPercent`, and how many
 * consecutive classes they must attend to get back above it. Every future class also adds to the
 * classes held, so: can miss m while present/(held+m) >= T, and must attend n while
 * (present+n)/(held+n) >= T. A 100% requirement can never be recovered once a class is missed.
 */
export function attendanceHeadroom(present, held, thresholdPercent) {
  const t = Number(thresholdPercent) / 100;
  if (!Number.isFinite(t) || t <= 0) return { canMiss: Infinity, mustAttend: 0, recoverable: true };
  const canMiss = Math.max(0, Math.floor(present / t - held + 1e-9));
  if (held === 0 || present / held >= t) return { canMiss, mustAttend: 0, recoverable: true };
  if (t >= 1) return { canMiss: 0, mustAttend: 0, recoverable: false };
  return { canMiss: 0, mustAttend: Math.max(1, Math.ceil((t * held - present) / (1 - t) - 1e-9)), recoverable: true };
}
