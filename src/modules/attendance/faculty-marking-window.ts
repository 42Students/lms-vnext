export type FacultyAttendanceMarkingWindow = "OPEN" | "NOT_STARTED" | "WINDOW_EXPIRED";

/** Intentional vNext Faculty policy: never mark before class start; after end, only
 * the college's correction-window period remains writable by Faculty.
 * College Admin corrections have separate authorization and are not gated here.
 * The legacy Ready to mark button allowed early marking; any relaxation here
 * must be paired with a server-side policy, per-college setting and audit.
 */
export function facultyAttendanceMarkingWindow(input: {
  startsAt: Date;
  endsAt: Date;
  correctionWindowHours: number;
  now: Date;
}): FacultyAttendanceMarkingWindow {
  const { startsAt, endsAt, correctionWindowHours, now } = input;
  const start = startsAt.getTime();
  const end = endsAt.getTime();
  const current = now.getTime();
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(current) ||
    !Number.isFinite(correctionWindowHours) ||
    correctionWindowHours < 0 ||
    end <= start
  ) {
    return "WINDOW_EXPIRED";
  }
  const endOfCorrection = end + correctionWindowHours * 3_600_000;
  if (!Number.isFinite(endOfCorrection)) return "WINDOW_EXPIRED";
  if (current < start) return "NOT_STARTED";
  if (current > endOfCorrection) return "WINDOW_EXPIRED";
  return "OPEN";
}

/** One explicitly supported vNext policy for both server and Faculty UI.
 * Legacy's pre-class/historical writes could change records without the
 * college's correction authority; they are deliberately replaced with a
 * bounded Faculty correction period and administrator-only historical fixes.
 * This is not a permission decision: the writer additionally validates a
 * persisted Faculty teaching assignment and ACTIVE college membership. */
export const FACULTY_ATTENDANCE_TIMING_POLICY = {
 facultyMayMarkBeforeClass: false,
 facultyMayCorrectHistoricalMarksOutsideWindow: false,
 expiredCorrectionRoute: "COLLEGE_ADMIN_ATTENDANCE_CORRECTION",
 statusSource: "COLLEGE_ATTENDANCE_POLICY",
} as const;

export function facultyAttendanceMarkingGuidance(
 status:FacultyAttendanceMarkingWindow,wasMarked:boolean,
):{canEdit:boolean;message:string;nextAction:"EDIT"|"WAIT_FOR_CLASS"|"REQUEST_ADMIN_CORRECTION"}{
 if(status==="OPEN")return {canEdit:true,message:wasMarked?
  "Update a previously marked attendance record within the college correction window.":
  "Mark this class's attendance.",nextAction:"EDIT"};
 if(status==="NOT_STARTED")return {canEdit:false,
  message:"Attendance cannot be marked before the class starts.",
  nextAction:"WAIT_FOR_CLASS"};
 return {canEdit:false,message:wasMarked?
  "The correction window has ended. Ask your College Admin to correct historical marks.":
  "This class is outside the Faculty marking window. Ask your College Admin for a reviewed correction.",
  nextAction:"REQUEST_ADMIN_CORRECTION"};
}
